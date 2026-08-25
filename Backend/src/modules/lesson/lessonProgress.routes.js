import { Router } from "express";
import { updateLessonProgress, getStudentTopicProgress } from "./lessonProgress.controller.js";
import { verifyUser } from "#modules/auth";

const router = Router();

router.use(verifyUser);

// Đánh dấu hoàn thành / bỏ hoàn thành 1 bài giảng
router.patch("/lessons/:lessonId/progress", updateLessonProgress);

// (Optional) Lấy tiến độ của student trong 1 Topic
router.get("/topics/:topicId/progress", getStudentTopicProgress);

export default router;
