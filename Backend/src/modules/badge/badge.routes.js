// File: src/modules/badge/badge.routes.js
// Nhánh /ranking, /badges, /activities của tiền tố /api/learning.
//
// Tách từ learning.routes.js ở Wave 3.2 — xem ghi chú ở
// modules/lesson/lessonProgress.routes.js: cả hai router vẫn mount cùng tiền tố
// /api/learning nên URL bên ngoài không đổi.
import { Router } from "express";
import {
  getClassRanking,
  getStudentRanking,
  getMyBadges,
  getMyActivities,
} from "./badge.controller.js";
import { verifyUser } from "#modules/auth";

const router = Router();

router.use(verifyUser);

// Ranking
router.get("/ranking/class/:classId", getClassRanking);
router.get("/ranking/student/:studentId", getStudentRanking);

// Gamification
router.get("/badges", getMyBadges);
router.get("/activities", getMyActivities);

export default router;
