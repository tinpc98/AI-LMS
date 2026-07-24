import axiosClient from "./axiosClient";

export const liveApi = {
  createSession: (data: { classId: string; title: string }) => axiosClient.post("/api/live/create", data),

  getActiveSession: (classId: string) => axiosClient.get(`/api/live/active/${classId}`),

  getJaasToken: (roomName: string) => axiosClient.post("/api/live/jaas-token", { roomName }),

  endSession: (classId: string) => axiosClient.post("/api/live/end", { classId }),
};

