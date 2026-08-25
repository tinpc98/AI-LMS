import axiosClient from "./axiosClient";
import type { Payment, PaymentConfig } from "../types/payment";

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const paymentApi = {
  // Config
  getConfig: (): Promise<ApiResponse<PaymentConfig>> => axiosClient.get("/payments/config"),
  updateConfig: (data: Partial<PaymentConfig>): Promise<ApiResponse<PaymentConfig>> =>
    axiosClient.put("/payments/config", data),

  // Student
  submitPayment: (paymentId: string): Promise<ApiResponse<Payment>> =>
    axiosClient.post(`/payments/${paymentId}/submit`),
  getMyPayments: (): Promise<ApiResponse<Payment[]>> => axiosClient.get("/payments/me"),

  // Admin
  getPayments: (params?: any): Promise<ApiResponse<Payment[]>> =>
    axiosClient.get("/payments/admin/pending", { params }),
  adminCreatePayment: (enrollmentId: string): Promise<ApiResponse<Payment>> =>
    axiosClient.post("/payments/admin", { enrollmentId }),
  verifyPayment: (id: string): Promise<ApiResponse<Payment>> =>
    axiosClient.post(`/payments/${id}/confirm`),
  refundPayment: (id: string): Promise<ApiResponse<Payment>> =>
    axiosClient.patch(`/payments/${id}/refund`),

  // Common
  getPaymentDetail: (id: string): Promise<ApiResponse<Payment>> =>
    axiosClient.get(`/payments/${id}`),
  cancelPayment: (id: string): Promise<ApiResponse<Payment>> =>
    axiosClient.patch(`/payments/${id}/cancel`),
};
