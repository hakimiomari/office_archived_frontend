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
    console.log("cookie is ready =>", token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
