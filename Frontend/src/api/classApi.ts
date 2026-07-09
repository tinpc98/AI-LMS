// Frontend/src/api/classApi.ts
import type { ICreateClassPayload } from "../interface/classInterface";
import axiosClient from "./axiosClient";

export const classApi = {
  getMyClasses: () => axiosClient.get("/api/classes"),
  getClassById: (id: string) => axiosClient.get(`/api/classes/${id}`),
  createClass: (payload: ICreateClassPayload) => axiosClient.post("/api/classes", payload),
  joinClass: (joinCode: string) => axiosClient.post("/api/classes/join", { joinCode }),
  deleteClass: (classId: string) => axiosClient.delete(`/api/classes/${classId}`),
};
