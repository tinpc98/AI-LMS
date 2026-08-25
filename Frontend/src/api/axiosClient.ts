import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { toast } from "../utils/toast";
import { getApiErrorStatus } from "../shared/utils/apiError";

import envConfig from "../config/env";

const axiosClient = axios.create({
  baseURL: envConfig.apiUrl,
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

      if (import.meta.env.DEV) {
        console.log(
          "[axios] Request:",
          config.method?.toUpperCase(),
          (config.baseURL ?? "") + config.url
        );
      }
    } catch (e) {
      console.error("[axios] Request interceptor error:", e);
    }
    return config;
  },
  (error: AxiosError) => {
    if (import.meta.env.DEV) {
      console.log("[axios] Request error:", error.message);
    }
    return Promise.reject(error);
  }
);

let isLogoutHandlingInProgress = false;

// 2. RESPONSE INTERCEPTOR: Quản lý phản hồi và Tự động Logout khi Token hết hạn
axiosClient.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log("[axios] Response:", response.status, response.config.url);
    }
    return response;
  },
  (error: AxiosError) => {
    if (import.meta.env.DEV) {
      console.log("[axios] Response error:", getApiErrorStatus(error), error.message);
    }

    const requestUrl = error.config?.url || "";
    const isLoginRequest = requestUrl.includes("/auth/login");

    // Chỉ tự động xử lý hết hạn phiên đăng nhập (401) cho các protected API, KHÔNG can thiệp vào API login
    if (getApiErrorStatus(error) === 401 && !isLoginRequest) {
      if (!isLogoutHandlingInProgress) {
        const token = localStorage.getItem("accessToken");
        if (token) {
          isLogoutHandlingInProgress = true;
          
          toast.error(
            "Phiên đăng nhập của bạn đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!",
            "Phiên hết hạn"
          );
          
          // Phát sự kiện toàn cục để useAuth tự động logout an toàn qua React Router (0 RELOAD)
          window.dispatchEvent(new Event("unauthorized-logout"));
          
          // Sau khi dispatch logout, token sẽ bị xóa bởi AuthProvider.
          // Reset lock sau một khoảng thời gian đủ dài để ứng dụng redirect về login (ví dụ: 10 giây),
          // tránh khóa vĩnh viễn nếu có lỗi xảy ra.
          setTimeout(() => {
            isLogoutHandlingInProgress = false;
          }, 10000);
        }
      }
    } else if (getApiErrorStatus(error) === 403) {
      toast.error("Bạn không có quyền thực hiện thao tác này!", "Từ chối truy cập");
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
