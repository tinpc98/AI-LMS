import axiosClient from "./axiosClient";
import type {
  ICreateLiveSessionRequest,
  ILiveSessionResponse,
  IJaasTokenResponse,
} from "../interface/liveInterface";

export const liveApi = {
  createSession: (data: ICreateLiveSessionRequest) =>
    axiosClient.post<ILiveSessionResponse>("/api/live/create", data),
  getActiveSession: (classId: string) =>
    axiosClient.get<ILiveSessionResponse>(`/api/live/active/${classId}`),
  getJaasToken: (meetingRoomId: string) =>
    axiosClient.post<IJaasTokenResponse>("/api/live/jaas-token", { roomName: meetingRoomId }),
  endSession: (classId: string) =>
    axiosClient.post<ILiveSessionResponse>("/api/live/end", { classId }),
};
export default liveApi;
