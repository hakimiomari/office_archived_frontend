import axios from "axios";

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
 * The refresh token is expired / blacklisted / invalid — the session can't
 * be recovered. Clear what we can client-side, fire a best-effort
 * server-side logout (to clear the httpOnly refresh cookie), and bounce to
 * the login page. A full `window.location` navigation is deliberate: it
 * nukes all React state so nothing keeps retrying against a dead session.
 *
 * No-ops when already on the login page (avoids a redirect loop) and is
 * idempotent (the `loggingOut` flag), so multiple simultaneous 401s only
 * trigger one logout.
 */
function forceLogout() {
  if (typeof window === "undefined") return;
  if (loggingOut) return;
  loggingOut = true;

  // Clear the non-httpOnly access token cookie. The httpOnly refresh
  // token cookie is cleared server-side by /auth/logout below.
  document.cookie =
    "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";

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
    return Promise.reject(error);
  }
);

export default api;
