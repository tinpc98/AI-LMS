import type { ILiveSession } from "../interface/liveInterface";

export type LiveSessionStatus = "Upcoming" | "Live" | "Completed" | "Cancelled" | "Missed";

export interface IExtendedLiveSession extends ILiveSession {
  status: LiveSessionStatus;
  isLiveNow?: boolean;
  platform?: "Jitsi Meet" | "Google Meet" | "Zoom" | "Microsoft Teams";
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
