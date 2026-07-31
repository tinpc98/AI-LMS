import { Router } from "express";
import {
  getStudentDashboard,
  getTeacherDashboard,
  exportClassReportCSV,
} from "../controllers/analytics.controller.js";
import { verifyUser } from "#modules/auth";

const router = Router();

router.use(verifyUser);

router.get("/student/dashboard/:classId", getStudentDashboard);
router.get("/teacher/dashboard/:classId", getTeacherDashboard);
router.get("/teacher/export/:classId", exportClassReportCSV);

export default router;
