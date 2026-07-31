import axiosClient from "./axiosClient";
import type { INotificationItem } from "../types/studentNotification";

/**
 * Data Mapper để chuẩn hóa response từ Backend sang định dạng INotificationItem của Frontend
 */
export const mapNotificationItem = (item: any): INotificationItem => {
  const senderObj = typeof item.senderId === "object" ? item.senderId : null;
  const senderName = senderObj?.fullName || item.senderName || "Hệ thống LMS";

  return {
    _id: item._id || item.id || `notif-${Date.now()}`,
    title: item.title || "Thông báo",
    description: item.message || item.content || item.description || "",
    category: (item.type === "LIVE_SESSION_CREATED"
      ? "live"
      : item.type || item.category || "system") as any,
    priority: item.priority || "normal",
    isRead: Boolean(item.isRead),
    createdAt: item.createdAt || new Date().toISOString(),
    className: item.classId?.className || item.className || item.metadata?.className || undefined,
    classId: item.classId?._id || item.classId || item.metadata?.classId || undefined,
    senderName,
    targetRoute: item.actionUrl || item.link || item.targetRoute || undefined,
    attachments: item.attachments || [],
  };
};

export const notificationApi = {
  // Lấy danh sách tất cả thông báo hệ thống cá nhân
  getNotifications: async (): Promise<INotificationItem[]> => {
    const response = await axiosClient.get<{ success?: boolean; data?: any[] }>(
      "/api/notifications"
    );
    const rawList = Array.isArray(response.data) ? response.data : response.data?.data || [];

    return rawList.map(mapNotificationItem);
  },

  // Đánh dấu 1 thông báo là đã đọc
  markAsRead: async (id: string): Promise<void> => {
    await axiosClient.put(`/api/notifications/${id}/read`);
  },

  // Đánh dấu tất cả thông báo là đã đọc
  markAllAsRead: async (): Promise<void> => {
    await axiosClient.put("/api/notifications/read-all");
  },

  // Lấy số lượng thông báo chưa đọc
  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const response = await axiosClient.get("/api/notifications/unread-count");
    return response.data?.data || { unreadCount: 0 };
  },
};

export default notificationApi;
