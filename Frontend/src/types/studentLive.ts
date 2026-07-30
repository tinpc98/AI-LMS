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
}

export interface StudentLiveStats {
  total: number;
  attended: number;
  missed: number;
  upcoming: number;
}
