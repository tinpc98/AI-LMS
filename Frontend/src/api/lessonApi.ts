// Frontend/src/api/lessonApi.ts
import axiosClient from "./axiosClient";
import type { ICreateLessonPayload } from "../interface/lessonInterface";

export const lessonApi = {
  getLessonsByClass: (classId: string) => {
    return axiosClient.get(`/lessons/class/${classId}`);
  },

  // TÍNH NĂNG MỚI (mục 1): lấy chi tiết 1 bài giảng theo id — bao gồm blocks (VIDEO/DOCUMENT/
  // PRACTICE_QUIZ đã populate đủ nội dung câu hỏi, không có đáp án đúng nếu người gọi là học sinh).
  getLessonById: (id: string) => {
    return axiosClient.get(`/lessons/${id}`);
  },

  createLesson: (payload: ICreateLessonPayload) => {
    const data = {
      title: payload.title,
      description: payload.description,
      videoUrl: payload.videoUrl,
      classId: payload.classId,
      order: payload.order,
      status: payload.isPublished ? "PUBLISHED" : "DRAFT",
      duration: payload.duration,
      // videoIds, documentIds would be handled here if file upload was separate
    };
    return axiosClient.post("/lessons", data);
  },

  updateLesson: (id: string, payload: Partial<ICreateLessonPayload>) => {
    const data: any = { ...payload };
    if (payload.isPublished !== undefined) {
      data.status = payload.isPublished ? "PUBLISHED" : "DRAFT";
      delete data.isPublished;
    }
    return axiosClient.put(`/lessons/${id}`, data);
  },

  deleteLesson: (id: string) => {
    return axiosClient.delete(`/lessons/${id}`);
  },

  updateLessonQuiz: (id: string, payload: { allowImageSubmit: boolean; questions: any[] }) => {
    return axiosClient.patch(`/lessons/${id}/quiz`, payload);
  },

  deleteLessonAttachment: (id: string, publicId: string) => {
    return axiosClient.delete(`/lessons/${id}/attachments/${encodeURIComponent(publicId)}`);
  },
};
