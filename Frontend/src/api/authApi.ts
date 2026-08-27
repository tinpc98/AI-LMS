import type User from "../interface/userInterface";
import axiosClient from "./axiosClient";
import type { ApiEnvelope } from "./unwrap";

export interface UpdateProfilePayload {
  fullName?: string;
  phone?: string;
  avatar?: string;
  teachingSubjects?: string[];
  availabilitySchedule?: User["availabilitySchedule"];
}

export const authApi = {
  login: (loginData: Pick<User, "email" | "password">) => {
    // Bắn request phương thức POST sang đúng cổng Backend /api/auth/login
    return axiosClient.post("/auth/login", loginData);
  },
  // Lấy hồ sơ của chính người dùng đang đăng nhập — GET /api/auth/me
  getMe: () => {
    return axiosClient.get<ApiEnvelope<User>>("/auth/me");
  },
  // Cập nhật hồ sơ cá nhân — PUT /api/auth/me (teachingSubjects/availabilitySchedule chỉ
  // được backend ghi nhận khi role hiện tại là Teacher, xem auth.controller.js updateMyProfile)
  updateMe: (payload: UpdateProfilePayload) => {
    return axiosClient.put<ApiEnvelope<User>>("/auth/me", payload);
  },
};
