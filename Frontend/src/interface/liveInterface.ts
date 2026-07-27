export interface ILiveSession {
  _id: string;
  classId: string;
  meetingRoomId: string;
  sessionNumber: number;
  title: string;
  createdBy: string;
  scheduledStart?: string | null;
  scheduledEnd?: string | null;
  actualStart?: string | null;
  actualEnd?: string | null;
  status: "Scheduled" | "Live" | "Completed" | "Cancelled" | "Upcoming" | "Missed";
  recordingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ICreateLiveSessionRequest {
  classId: string;
  title?: string;
  scheduledStart?: string;
  scheduledEnd?: string;
}

export interface IEndLiveSessionRequest {
  classId: string;
}

export interface IGetJaasTokenRequest {
  roomName: string;
}

export interface IJaasTokenResponse {
  success: boolean;
  token: string;
  appId: string;
}

export interface ILiveSessionResponse {
  success: boolean;
  data: ILiveSession | null;
}
