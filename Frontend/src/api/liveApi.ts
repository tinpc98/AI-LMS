import axiosClient from "./axiosClient";
import type {
  ICreateLiveSessionRequest,
  ILiveSessionResponse,
  IJaasTokenResponse,
  ILiveSessionHistoryResponse,
} from "../interface/liveInterface";

/**
 * Client API Service kết nối REST API V2 chuẩn của Live Session
 */
export const liveApi = {
  // 1. POST /api/live/sessions (Tạo mới phiên LiveSession V2)
  createLiveSession: (data: ICreateLiveSessionRequest) =>
    axiosClient.post<ILiveSessionResponse>("/api/live/sessions", data),

  // 2. GET /api/live/classes/:classId/active (Lấy Active Session V2)
  getActiveLiveSession: (classId: string) =>
    axiosClient.get<ILiveSessionResponse>(`/api/live/classes/${classId}/active`),

  // 3. GET /api/live/sessions/:sessionId (Lấy Chi Tiết Session V2)
  getLiveSessionById: (sessionId: string) =>
    axiosClient.get<ILiveSessionResponse>(`/api/live/sessions/${sessionId}`),

  // 4. GET /api/live/classes/:classId/sessions (Lấy Lịch Sử Sessions V2)
  getLiveSessionHistory: (classId: string, params?: { page?: number; limit?: number; status?: string }) =>
    axiosClient.get<ILiveSessionHistoryResponse>(`/api/live/classes/${classId}/sessions`, { params }),

  // 5. POST /api/live/sessions/:sessionId/token (Lấy JWT JaaS Token V2)
  getLiveSessionToken: (sessionId: string) =>
    axiosClient.post<IJaasTokenResponse>(`/api/live/sessions/${sessionId}/token`),

  // 6. PATCH /api/live/sessions/:sessionId/end (Kết Thúc Session V2)
  endLiveSession: (sessionId: string) =>
    axiosClient.patch<ILiveSessionResponse>(`/api/live/sessions/${sessionId}/end`),

};

export default liveApi;
