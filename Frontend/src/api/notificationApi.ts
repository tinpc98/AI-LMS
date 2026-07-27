import axiosClient from "./axiosClient";
import type { INotificationItem } from "../types/studentNotification";

export const initialNotificationsMock: INotificationItem[] = [
  {
    _id: "notif-101",
    title: "Bài tập mới: Xây dựng RESTful API với Node.js & Express",
    description: "Giảng viên Nguyễn Văn An vừa giao bài tập mới. Hạn nộp: 23:59 Chủ Nhật tuần này.",
    category: "assignment",
    priority: "high",
    isRead: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    className: "Lập trình Web nâng cao - K25",
    classId: "65a1234567890abcdef12345",
    senderName: "ThS. Nguyễn Văn An",
    targetRoute: "/classdetail/65a1234567890abcdef12345?tab=assignments",
    attachments: [
      { name: "De_bai_tap_NodeJS.pdf", url: "https://example.com/De_bai_tap_NodeJS.pdf" },
    ],
  },
  {
    _id: "notif-102",
    title: "Buổi học trực tuyến sắp bắt đầu",
    description: "Lớp 'Lập trình Web nâng cao' sẽ mở phòng học trực tuyến Jitsi trong 15 phút nữa.",
    category: "live",
    priority: "high",
    isRead: false,
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    className: "Lập trình Web nâng cao - K25",
    classId: "65a1234567890abcdef12345",
    senderName: "Hệ thống LMS",
    targetRoute: "/classdetail/65a1234567890abcdef12345?tab=live",
  },
  {
    _id: "notif-103",
    title: "Công bố điểm số Bài kiểm tra Giữa kỳ",
    description: "Giảng viên đã cập nhật bảng điểm Bài kiểm tra Giữa kỳ môn Cơ sở dữ liệu. Điểm số của bạn: 9.5/10.",
    category: "grade",
    priority: "normal",
    isRead: false,
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    className: "Cơ sở dữ liệu nâng cao",
    classId: "65a9876543210fedcba54321",
    senderName: "TS. Lê Thị Bình",
    targetRoute: "/classdetail/65a9876543210fedcba54321?tab=grades",
  },
  {
    _id: "notif-104",
    title: "Ghi nhận Điểm danh buổi học ngày 24/07",
    description: "Trạng thái điểm danh của bạn cho buổi học 'Thiết kế giao diện UI/UX' đã được ghi nhận: CÓ MẶT.",
    category: "attendance",
    priority: "normal",
    isRead: true,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    className: "Thiết kế UI/UX Enterprise",
    classId: "65b111222333444555666777",
    senderName: "ThS. Phạm Hoàng Long",
    targetRoute: "/classdetail/65b111222333444555666777?tab=attendance",
  },
  {
    _id: "notif-105",
    title: "Thông báo lịch nghỉ Lễ và học bù",
    description: "Giảng viên thông báo thay đổi lịch học tuần tới do trùng nghỉ lễ. Vui lòng xem thông báo chi tiết.",
    category: "announcement",
    priority: "high",
    isRead: true,
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    className: "Lập trình Web nâng cao - K25",
    classId: "65a1234567890abcdef12345",
    senderName: "ThS. Nguyễn Văn An",
    targetRoute: "/classdetail/65a1234567890abcdef12345?tab=announcements",
  },
  {
    _id: "notif-106",
    title: "Nâng cấp tính năng AI Assistant trên hệ thống EduPortal",
    description: "Hệ thống vừa cập nhật phiên bản AI Assistant mới hỗ trợ giải đáp bài tập 24/7.",
    category: "system",
    priority: "normal",
    isRead: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    senderName: "Quản trị hệ thống EduPortal",
  },
];

export const notificationApi = {
  // Lấy danh sách tất cả thông báo hệ thống
  getNotifications: async (): Promise<INotificationItem[]> => {
    try {
      const response = await axiosClient.get<{ data: INotificationItem[] }>("/api/notifications");
      return response.data.data || response.data || initialNotificationsMock;
    } catch {
      return initialNotificationsMock;
    }
  },

  // Đánh dấu 1 thông báo là đã đọc
  markAsRead: async (id: string): Promise<void> => {
    try {
      await axiosClient.patch(`/api/notifications/${id}/read`);
    } catch {
      // Graceful fallback
    }
  },

  // Đánh dấu tất cả thông báo là đã đọc
  markAllAsRead: async (): Promise<void> => {
    try {
      await axiosClient.patch("/api/notifications/read-all");
    } catch {
      // Graceful fallback
    }
  },
};

export default notificationApi;
