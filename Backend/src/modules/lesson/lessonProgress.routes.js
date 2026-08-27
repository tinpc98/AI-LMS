import { Router } from "express";
import {
  recordVideoProgress,
  recordDocumentOpen,
  recordDocumentClose,
  submitPracticeQuizAttempt,
  getStudentTopicProgress,
  getProgressForLessons,
} from "./lessonProgress.controller.js";
import { verifyUser } from "#modules/auth";

const router = Router();

router.use(verifyUser);

// TÍNH NĂNG MỚI (mục 1.5) — ghi tiến độ theo từng block, thay cho endpoint tự khai báo cũ.
router.post("/lessons/:lessonId/blocks/:blockId/video-progress", recordVideoProgress);
router.post("/lessons/:lessonId/blocks/:blockId/document-open", recordDocumentOpen);
router.post("/lessons/:lessonId/blocks/:blockId/document-close", recordDocumentClose);
router.post("/lessons/:lessonId/blocks/:blockId/quiz-attempt", submitPracticeQuizAttempt);

// Lấy tiến độ của student trong 1 Topic
router.get("/topics/:topicId/progress", getStudentTopicProgress);

// Lấy tiến độ của student cho 1 danh sách lessonId cụ thể (sidebar bài giảng của 1 Class)
router.post("/lessons/progress", getProgressForLessons);

export default router;
