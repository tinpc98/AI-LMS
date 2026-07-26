// Frontend/src/api/classApi.ts
import axiosClient from "./axiosClient";

export const classApi = {
  getMyClasses: () => axiosClient.get("/api/classes"),
  getClassById: (id: string) => axiosClient.get(`/api/classes/${id}`),
};

