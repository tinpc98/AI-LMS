import { Router } from "express";
import { markLessonComplete, getStudentProgress } from "../controllers/progress.controller.js";
import { verifyUser, isStudent } from "../middlewares/auth.middlewares.js";

const router = Router();

/**
 * POST /api/progress/mark-lesson-complete
 * @access Private - Student only
 * @desc Đánh dấu một bài giảng đã hoàn thành cho học sinh
 */
router.post("/mark-lesson-complete", verifyUser, isStudent, markLessonComplete);

/**
 * GET /api/progress/student/:studentId/class/:classId
 * @access Private
 * @desc Xem tiến độ bài giảng của một học sinh trong một lớp học
 */
router.get("/student/:studentId/class/:classId", verifyUser, getStudentProgress);

export default router;
