import axiosClient from "./axiosClient";
import type { INotificationItem } from "../types/studentNotification";

/**
 * Hình dạng thông báo THÔ từ máy chủ.
 *
 * Nhiều trường là tuỳ chọn và trùng nghĩa nhau (message/content/description, actionUrl/link/
 * targetRoute) — đó là dấu vết của nhiều đợt phát triển chồng lên nhau, không phải do client
 * đoán. Khai báo đúng như vậy để mapper bên dưới có thể xử lý mà không cần `any`.
 */
interface RawNotification {
  _id?: string;
  id?: string;
  title?: string;
  message?: string;
  content?: string;
  description?: string;
  type?: string;
  category?: string;
  priority?: string;
  isRead?: boolean;
  createdAt?: string;
  senderId?: string | { fullName?: string };
  senderName?: string;
  classId?: string | { _id?: string; className?: string };
  className?: string;
  metadata?: { className?: string; classId?: string };
  actionUrl?: string;
  link?: string;
  targetRoute?: string;
  attachments?: unknown[];
}

/**
 * Chuẩn hoá thông báo từ máy chủ sang định dạng của Frontend.
 */
export const mapNotificationItem = (raw: unknown): INotificationItem => {
  const item = (raw ?? {}) as RawNotification;
  const senderObj = typeof item.senderId === "object" ? item.senderId : null;
  const senderName = senderObj?.fullName || item.senderName || "Hệ thống LMS";

  return {
    _id: item._id || item.id || `notif-${Date.now()}`,
    title: item.title || "Thông báo",
    description: item.message || item.content || item.description || "",
    category: (item.type === "LIVE_SESSION_CREATED"
      ? "live"
      : item.type || item.category || "system") as INotificationItem["category"],
    priority: (item.priority || "normal") as INotificationItem["priority"],
    isRead: Boolean(item.isRead),
    createdAt: item.createdAt || new Date().toISOString(),
    className:
      (typeof item.classId === "object" ? item.classId?.className : undefined) ||
      item.className ||
      item.metadata?.className ||
      undefined,
    classId:
      (typeof item.classId === "object" ? item.classId?._id : item.classId) ||
      item.metadata?.classId ||
      undefined,
    senderName,
    targetRoute: item.actionUrl || item.link || item.targetRoute || undefined,
    attachments: (item.attachments || []) as INotificationItem["attachments"],
  };
};

export const notificationApi = {
  // Lấy danh sách tất cả thông báo hệ thống cá nhân
  getNotifications: async (): Promise<INotificationItem[]> => {
    const response = await axiosClient.get<{ success?: boolean; data?: RawNotification[] }>(
      "/api/notification"
    );
    const rawList = Array.isArray(response.data) ? response.data : response.data?.data || [];

    return rawList.map(mapNotificationItem);
  },

  // Đánh dấu 1 thông báo là đã đọc
  markAsRead: async (id: string): Promise<void> => {
    await axiosClient.put(`/api/notification/${id}/read`);
  },

  // Đánh dấu tất cả thông báo là đã đọc
  markAllAsRead: async (): Promise<void> => {
    await axiosClient.put("/api/notification/read-all");
  },

  // Lấy số lượng thông báo chưa đọc
  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    const response = await axiosClient.get("/api/notification/unread-count");
    return response.data?.data || { unreadCount: 0 };
  },
};

export default notificationApi;
