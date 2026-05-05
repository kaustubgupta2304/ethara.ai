import axios from "axios";
import toast from "react-hot-toast";

const baseURL = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") || "";

const api = axios.create({
  baseURL: baseURL ? `${baseURL}/api` : "/api",
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("ttm_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const msg =
      err.response?.data?.message ||
      err.response?.data?.errors?.[0]?.message ||
      err.message ||
      "Request failed";
    if (err.response?.status === 401 && !err.config?.url?.includes("/auth/login")) {
      localStorage.removeItem("ttm_token");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    } else if (err.response?.status !== 401) {
      toast.error(typeof msg === "string" ? msg : "Something went wrong");
    }
    return Promise.reject(err);
  }
);

export default api;
