// Frontend/src/api/lessonApi.ts
import axiosClient from "./axiosClient";
import type { ICreateLessonPayload } from "../interface/lessonInterface";

export const lessonApi = {
  getLessonsByClass: (classId: string) => {
    return axiosClient.get(`/api/lessons/class/${classId}`);
  },

  createLesson: (payload: ICreateLessonPayload) => {
    const formData = new FormData();
    formData.append("title", payload.title);
    if (payload.description) formData.append("description", payload.description);
    if (payload.videoUrl) formData.append("videoUrl", payload.videoUrl);
    formData.append("classId", payload.classId);
    if (payload.order !== undefined) formData.append("order", String(payload.order));
    if (payload.isPublished !== undefined) formData.append("isPublished", String(payload.isPublished));
    if (payload.duration !== undefined) formData.append("duration", String(payload.duration));
    payload.files?.forEach((file) => formData.append("files", file));

    return axiosClient.post("/api/lessons", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  updateLesson: (id: string, payload: Partial<ICreateLessonPayload>) => {
    const formData = new FormData();
    if (payload.title) formData.append("title", payload.title);
    if (payload.description !== undefined) formData.append("description", payload.description);
    if (payload.videoUrl !== undefined) formData.append("videoUrl", payload.videoUrl);
    if (payload.order !== undefined) formData.append("order", String(payload.order));
    if (payload.isPublished !== undefined) formData.append("isPublished", String(payload.isPublished));
    if (payload.duration !== undefined) formData.append("duration", String(payload.duration));
    payload.files?.forEach((file) => formData.append("files", file));

    return axiosClient.put(`/api/lessons/${id}`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  deleteLesson: (id: string) => {
    return axiosClient.delete(`/api/lessons/${id}`);
  },
};
