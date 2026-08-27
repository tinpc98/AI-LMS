import axiosClient from "./axiosClient";
import type { LessonProgress, QuizAttemptResult } from "../features/lesson/lesson.types";

// TÍNH NĂNG MỚI (mục 1.5) — endpoint ghi tiến độ theo từng block, mount tại /learning (xem
// Backend/src/routes/index.js) nhưng KHÔNG dùng envelope {success,data} như module badge/ranking
// (xem api/unwrap.ts) — lesson/lessonProgress.controller.js trả thẳng {message, ...}, nên đọc
// response.data trực tiếp thay vì unwrap().

export const lessonProgressApi = {
  recordVideoProgress: (
    lessonId: string,
    blockId: string,
    payload: { start: number; end: number }
  ) => {
    return axiosClient.post<{ message: string; progress: LessonProgress }>(
      `/learning/lessons/${lessonId}/blocks/${blockId}/video-progress`,
      payload
    );
  },

  recordDocumentOpen: (lessonId: string, blockId: string) => {
    return axiosClient.post<{
      message: string;
      progress: LessonProgress;
      documentUrl: string;
      documentUrlExpiresAt: string;
    }>(`/learning/lessons/${lessonId}/blocks/${blockId}/document-open`);
  },

  recordDocumentClose: (lessonId: string, blockId: string, payload: { openedSeconds: number }) => {
    return axiosClient.post<{ message: string; progress: LessonProgress }>(
      `/learning/lessons/${lessonId}/blocks/${blockId}/document-close`,
      payload
    );
  },

  submitPracticeQuizAttempt: (
    lessonId: string,
    blockId: string,
    payload: { answers: { questionId: string; selectedOptionIds: string[] }[] }
  ) => {
    return axiosClient.post<{ message: string } & QuizAttemptResult>(
      `/learning/lessons/${lessonId}/blocks/${blockId}/quiz-attempt`,
      payload
    );
  },

  getProgressForLessons: (lessonIds: string[]) => {
    return axiosClient.post<{ progresses: LessonProgress[] }>(`/learning/lessons/progress`, {
      lessonIds,
    });
  },
};

export default lessonProgressApi;
