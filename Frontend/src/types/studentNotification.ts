export type NotificationCategory =
  | "assignment"
  | "exam"
  | "grade"
  | "attendance"
  | "announcement"
  | "live"
  | "system";

export type NotificationPriority = "normal" | "high";

export interface INotificationItem {
  _id: string;
  title: string;
  description: string;
  category: NotificationCategory;
  priority?: NotificationPriority;
  isRead: boolean;
  createdAt: string;
  className?: string;
  classId?: string;
  senderName?: string;
  senderAvatar?: string;
  targetRoute?: string;
  attachments?: Array<{ name: string; url: string }>;
  linkUrl?: string;
  dateGroup?: "Hôm nay" | "Hôm qua" | "7 ngày trước" | "Tháng này" | "Cũ hơn";
}

export interface NotificationFilterOptions {
  searchQuery: string;
  category: "all" | "unread" | "read" | NotificationCategory;
  sortBy: "newest" | "oldest" | "important";
}

export interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  todayCount: number;
  thisWeekCount: number;
}
