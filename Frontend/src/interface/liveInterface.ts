export type LiveSessionStatus = "Scheduled" | "Live" | "Completed" | "Cancelled";

export interface LiveSessionUser {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface ILiveSession {
  id: string;
  classId: string;
  roomName: string;
  sessionNumber: number;
  title: string;
  status: LiveSessionStatus;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  createdBy: LiveSessionUser | string;
  endedBy?: LiveSessionUser | string | null;
  recordingUrl?: string;
  createdAt: string;
  updatedAt: string;
  meetingRoomId?: string; // Legacy alias fallback
}

export interface ICreateLiveSessionRequest {
  classId: string;
  title?: string;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
}

export interface IJaasTokenResponseData {
  sessionId: string;
  roomName: string;
  appId: string;
  domain: string;
  token: string;
  moderator: boolean;
  expiresAt?: string;
}

export interface IJaasTokenResponse {
  success: boolean;
  data?: IJaasTokenResponseData;
  token?: string; // Legacy fallback
  appId?: string; // Legacy fallback
  domain?: string;
  roomName?: string;
}

export interface ILiveSessionResponse {
  success: boolean;
  message?: string;
  data: ILiveSession | null;
}

export interface ILiveSessionHistoryResponse {
  success: boolean;
  data: {
    items: ILiveSession[];
    pagination: {
      page: number;
      limit: number;
      totalItems: number;
      totalPages: number;
    };
  };
}
