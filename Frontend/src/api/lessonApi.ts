// Frontend/src/api/lessonApi.ts
import axiosClient from "./axiosClient";
import type {
  CreateLessonPayload,
  UpdateLessonPayload,
  UploadedDocument,
} from "../features/lesson/lesson.types";

// TÍNH NĂNG MỚI (mục 1): dựng lại đúng theo contract backend thật (lesson.service.js) — bản cũ
// gửi {videoUrl, duration, isPublished, ...} không khớp gì với backend (Lesson giờ là tập hợp
// block, không còn field phẳng nào trong số đó).
export const lessonApi = {
  getLessonsByClass: (classId: string) => {
    return axiosClient.get(`/lessons/class/${classId}`);
  },

  getLessonById: (id: string) => {
    return axiosClient.get(`/lessons/${id}`);
  },

  createLesson: (payload: CreateLessonPayload) => {
    return axiosClient.post("/lessons", payload);
  },

  updateLesson: (id: string, payload: UpdateLessonPayload) => {
    return axiosClient.put(`/lessons/${id}`, payload);
  },

  updateLessonStatus: (id: string, status: "DRAFT" | "PUBLISHED" | "ARCHIVED") => {
    return axiosClient.patch(`/lessons/${id}/status`, { status });
  },

  deleteLesson: (id: string) => {
    return axiosClient.delete(`/lessons/${id}`);
  },

  uploadDocument: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return axiosClient.post<{ message: string; document: UploadedDocument }>(
      "/lessons/upload-document",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
  },

  createPracticeQuiz: (payload: {
    title: string;
    questions: { questionId: string; order?: number }[];
  }) => {
    return axiosClient.post("/lessons/practice-quizzes", payload);
  },
};
