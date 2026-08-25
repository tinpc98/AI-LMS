import { Router } from "express";
import {
  getMyPerformance,
  getMyWeaknesses,
  getMyRecommendations,
  generateMyRecommendation,
  getStudentPerformanceByTeacher,
  getStudentWeaknessesByTeacher,
  adminRebuildStudentPerformance
} from "./performance.controller.js";
import { verifyUser } from "#modules/auth";
import { isStudent, isTeacher, isAdmin } from "#shared/middlewares/rbac.middleware.js";

const router = Router();

router.use(verifyUser);

// ================= STUDENT ROUTES =================
router.get("/me", isStudent, getMyPerformance);
router.get("/me/weaknesses", isStudent, getMyWeaknesses);
router.get("/me/recommendations", isStudent, getMyRecommendations);
router.post("/me/recommendations/generate", isStudent, generateMyRecommendation);

// ================= TEACHER ROUTES =================
router.get("/teacher/students/:studentId", isTeacher, getStudentPerformanceByTeacher);
router.get("/teacher/students/:studentId/weaknesses", isTeacher, getStudentWeaknessesByTeacher);

// ================= ADMIN ROUTES =================
router.post("/admin/rebuild/:studentId", isAdmin, adminRebuildStudentPerformance);

export default router;
