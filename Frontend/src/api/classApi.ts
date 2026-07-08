// Frontend/src/api/classApi.ts
import type { ICreateClassPayload } from "../interface/classInterface";
import axiosClient from "./axiosClient";

export const classApi = {
  getMyClasses: () => {
    return axiosClient.get("/api/classes");
  },

  createClass: (payload: ICreateClassPayload) => {
    return axiosClient.post("/api/classes", payload);
  },

  // Thêm mới: tham gia lớp học bằng mã
  joinClass: (joinCode: string) => {
    return axiosClient.post("/api/classes/join", { joinCode });
  },

  deleteClass: (classId: string) => {
    return axiosClient.delete(`/api/classes/${classId}`);
  },
};
