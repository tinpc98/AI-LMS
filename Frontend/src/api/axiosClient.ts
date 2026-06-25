import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

const axiosClient = axios.create({
  baseURL: "http://localhost:5000", // Port của Backend Node.js
  headers: {
    "Content-Type": "application/json",
  },
});
// 1. REQUEST INTERCEPTOR: Tự động đính kèm Authorization Header nếu có Token
axiosClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${token}`;
      }

      // In log debug khi đang ở môi trường phát triển (Development)
      if (import.meta.env.DEV) {
        console.log("[axios] Request:", config.method?.toUpperCase(), (config.baseURL ?? "") + config.url);
      }
    } catch (e) {
      console.error("[axios] Request interceptor error:", e);
    }
    return config;
  },
  // FIX LỖI: Định nghĩa kiểu dữ liệu là AxiosError thay vì any vô tổ chức
  (error: AxiosError) => {
    if (import.meta.env.DEV) {
      console.log("[axios] Request error:", error.message);
    }
    return Promise.reject(error);
  },
);

// 2. RESPONSE INTERCEPTOR: Quản lý phản hồi và Tự động Logout khi Token hết hạn
axiosClient.interceptors.response.use(
  (response) => {
    // Log phản hồi thành công khi dev local
    if (import.meta.env.DEV) {
      console.log("[axios] Response:", response.status, response.config.url);
    }
    return response;
  },
  // FIX LỖI: Định nghĩa kiểu dữ liệu là AxiosError để dập tắt lỗi Unexpected any
  (error: AxiosError) => {
    // Log lỗi phản hồi khi dev local
    if (import.meta.env.DEV) {
      console.log("[axios] Response error:", error.response?.status, error.message);
    }

    // Tự động xử lý khi Token không hợp lệ hoặc hết hạn (401 / 403)
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem("accessToken");
      alert("Phiên đăng nhập của bạn đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
