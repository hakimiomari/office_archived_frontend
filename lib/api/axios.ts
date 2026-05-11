import axios from "axios";
import { readTenantFilterFromStorage } from "@/contexts/TenantFilterContext";

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

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("refresh_token")
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
        const res = await axios.get(
          "http://localhost:8001/api/auth/refresh-token",
          {
            withCredentials: true,
          }
        );
        const newAccessToken = res.data.access_token;
        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

export default api;
