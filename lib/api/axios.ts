import axios from "axios";
import toast from "react-hot-toast";
import { readTenantFilterFromStorage } from "@/contexts/TenantFilterContext";

/**
 * Map a 403 response body produced by the subscription guards / limit
 * service into a friendly toast. The backend returns these codes:
 *   - subscription.module.disabled
 *   - subscription.feature.disabled
 *   - subscription.limit.exceeded
 *   - subscription.missing / inactive / expired
 * Permission 403s don't carry a `code` and fall through silently.
 */
function maybeToastSubscription403(err: any) {
  const body = err?.response?.data;
  const code: string | undefined = body?.code;
  if (!code || !code.startsWith("subscription.")) return;

  if (code === "subscription.limit.exceeded") {
    toast.error(
      body.message ??
        `Plan limit reached — upgrade to add more.`,
    );
    return;
  }
  if (code === "subscription.module.disabled") {
    toast.error(
      `This module isn't included in your current plan. Upgrade to enable it.`,
    );
    return;
  }
  if (code === "subscription.feature.disabled") {
    toast.error(
      `This feature isn't included in your current plan. Upgrade to unlock it.`,
    );
    return;
  }
  if (
    code === "subscription.missing" ||
    code === "subscription.inactive" ||
    code === "subscription.expired"
  ) {
    toast.error(`Your subscription isn't active. Contact your administrator.`);
    return;
  }
}

const api = axios.create({
  baseURL: "http://localhost:8001/api/",
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = document.cookie
      .split("; ")
      .find((row) => row.startsWith("access_token"))
      ?.split("=")[1];
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // SUPER_ADMIN company filter: when the picker is set, scope every
    // read/write to that company via the X-Tenant-Company-Id header. The
    // backend ignores the header for non-SUPER_ADMIN users (it's a hint,
    // not a permission), so it's safe to send unconditionally.
    const filterCompanyId = readTenantFilterFromStorage();
    if (filterCompanyId != null) {
      config.headers["X-Tenant-Company-Id"] = String(filterCompanyId);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// response interceptor for 401 responses
let isRefreshing = false;
let failedQueue: any[] = [];
// Guards against firing the logout/redirect more than once when several
// requests 401 at the same time and the refresh attempt fails for all.
let loggingOut = false;

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

/**
 * The refresh token is expired/invalid — the session can't be recovered.
 * Clear what we can client-side, fire a best-effort server-side logout
 * (to clear the httpOnly refresh cookie), and bounce to the login page.
 * A full `window.location` navigation is deliberate: it nukes all React
 * state so nothing keeps retrying against a dead session.
 *
 * No-ops when already on the login page (avoids a redirect loop) and is
 * idempotent (the `loggingOut` flag).
 */
function forceLogout() {
  if (typeof window === "undefined") return;
  if (loggingOut) return;
  loggingOut = true;

  // Clear the non-httpOnly access token cookie.
  document.cookie =
    "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  // Drop the SUPER_ADMIN tenant scope so a re-login starts clean.
  try {
    window.localStorage.removeItem("superAdminCompanyId");
    window.localStorage.removeItem("superAdminCompanyName");
  } catch {
    /* ignore storage errors */
  }
  // Best-effort: ask the server to clear the httpOnly refresh cookie.
  // Don't block the redirect on it — if the session is dead this may
  // 401 too, which is fine.
  void axios
    .post(
      "http://localhost:8001/api/auth/logout",
      {},
      { withCredentials: true },
    )
    .catch(() => {});

  if (window.location.pathname !== "/") {
    window.location.href = "/";
  }
}

const REFRESH_URL = "http://localhost:8001/api/auth/refresh-token";

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;

    // Only attempt a refresh on a 401 for a normal request that hasn't
    // already been retried, and isn't the refresh call itself.
    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !String(originalRequest.url ?? "").includes("auth/refresh-token")
    ) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token: string) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(api(originalRequest));
            },
            reject: (err: any) => reject(err),
          });
        });
      }
      isRefreshing = true;
      try {
        const res = await axios.get(REFRESH_URL, { withCredentials: true });
        const newAccessToken = res.data.access_token;
        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (err: any) {
        processQueue(err, null);
        // Log the user out only when the server actually rejected the
        // refresh — expired / blacklisted / invalid token. A pure
        // network error (no `response`) is transient; don't kick the
        // user out for a flaky connection.
        if (err?.response) {
          forceLogout();
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    // 403s carrying a `code` prefixed with `subscription.` are surfaced
    // as a friendly toast. Pure permission 403s fall through silently
    // — the caller's own UI usually shows nothing-to-see-here state.
    if (status === 403) {
      maybeToastSubscription403(error);
    }

    return Promise.reject(error);
  }
);

export default api;
