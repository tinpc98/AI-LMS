import type { ILiveSession } from "../interface/liveInterface";

export type StudentLiveSessionStatus = "Upcoming" | "Live" | "Completed" | "Cancelled" | "Missed";

export interface IExtendedLiveSession extends Omit<ILiveSession, "status"> {
  _id?: string;
  status: StudentLiveSessionStatus;
  isLiveNow?: boolean;
  platform?: string;
  meetingUrl?: string;
  teacherName?: string;
  teacherAvatar?: string;
  countdownText?: string;
  isStartingSoon?: boolean; // starting within 30 minutes
  /**
   * Lịch học của lớp dưới dạng chữ, ví dụ "Thứ Hai · 08:00 - 10:30".
   *
   * Dùng cho các buổi suy từ lịch lớp — chúng chưa có mốc thời gian cụ thể, nên không có
   * scheduledStart. Hiện lịch học là sự thật; hiện một giờ bắt đầu suy đoán thì không.
   */
  scheduleText?: string;
}

export interface StudentLiveStats {
  total: number;
  attended: number;
  missed: number;
  upcoming: number;
}
