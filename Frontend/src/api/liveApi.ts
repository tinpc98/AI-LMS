import axiosClient from "./axiosClient";

export const liveApi = {
  createSession: (data: { classId: string }) => axiosClient.post("/api/live/create", data),
  getActiveSession: (classId: string) => axiosClient.get(`/api/live/active/${classId}`),
  getJaasToken: (meetingRoomId: string) => axiosClient.post("/api/live/jaas-token", { roomName: meetingRoomId }),
  endSession: (classId: string) => axiosClient.post("/api/live/end", { classId }),
};

