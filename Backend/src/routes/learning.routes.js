import { Router } from "express";
import {
  getStudentProgress,
  updateLessonProgress,
  getClassRanking,
  getStudentRanking,
  getMyBadges,
  getMyActivities,
} from "../controllers/learning.controller.js";
import { verifyUser } from "#modules/auth";

const router = Router();

// Lắng nghe tất cả requests dưới chuẩn Auth
router.use(verifyUser);

// Progress
router.get("/progress/class/:classId", getStudentProgress);
router.post("/progress", updateLessonProgress);

// Ranking
router.get("/ranking/class/:classId", getClassRanking);
router.get("/ranking/student/:studentId", getStudentRanking);

// Gamification
router.get("/badges", getMyBadges);
router.get("/activities", getMyActivities);

export default router;
