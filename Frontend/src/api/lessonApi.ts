import axiosClient from "./axiosClient";
import type { ICreateLessonPayload } from "../interface/lessonInterface";

export const lessonApi = {
  // BE trả về { lessons: [...] }
  getLessonsByClass: (classId: string) => {
    return axiosClient.get(`/api/lesson/class/${classId}`);
  },

  // BE nhận multipart/form-data (multer), field file là "files", tối đa 5
  createLesson: (payload: ICreateLessonPayload) => {
    const formData = new FormData();
    formData.append("title", payload.title);
    if (payload.description) formData.append("description", payload.description);
    if (payload.videoUrl) formData.append("videoUrl", payload.videoUrl);
    formData.append("classId", payload.classId);
    payload.files?.forEach((file) => formData.append("files", file));

    return axiosClient.post("/api/lesson", formData);
  },

  updateLesson: (id: string, payload: Partial<ICreateLessonPayload>) => {
    const formData = new FormData();
    if (payload.title) formData.append("title", payload.title);
    if (payload.description !== undefined) formData.append("description", payload.description);
    if (payload.videoUrl !== undefined) formData.append("videoUrl", payload.videoUrl);
    payload.files?.forEach((file) => formData.append("files", file));

    return axiosClient.put(`/api/lesson/${id}`, formData);
  },

  deleteLesson: (id: string) => {
    return axiosClient.delete(`/api/lesson/${id}`);
  },
};
