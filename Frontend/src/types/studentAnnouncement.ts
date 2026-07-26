import type { IAnnouncement } from "../api/announcementApi";

export type AnnouncementTagType =
  | "Pinned"
  | "Important"
  | "Assignment"
  | "Exam"
  | "General"
  | "System";

export interface IExtendedAnnouncement extends IAnnouncement {
  isRead?: boolean;
  isPinned?: boolean;
  isImportant?: boolean;
  tagType?: AnnouncementTagType;
  authorName?: string;
  authorAvatar?: string;
  dateGroup?: "Hôm nay" | "Hôm qua" | "Tuần này" | "Tháng này" | "Cũ hơn";
}

export interface StudentAnnouncementFilterOptions {
  searchQuery: string;
  filterType: "all" | "unread" | "read" | "pinned" | "this_week" | "this_month";
  sortBy: "newest" | "oldest" | "important";
}

export interface StudentAnnouncementStats {
  total: number;
  unread: number;
  read: number;
  pinned: number;
}
