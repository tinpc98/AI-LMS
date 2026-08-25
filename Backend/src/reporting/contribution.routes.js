import { Router } from "express";
import {
  getMyContributionSummary,
  getTeacherContributionSummaryAdmin,
} from "./contribution.controller.js";
import { verifyUser } from "#modules/auth";
import { isTeacher, isAdmin } from "#shared/middlewares/rbac.middleware.js";

const router = Router();

router.use(verifyUser);

// GET /api/contribution/teachers/me?from=&to=
router.get("/teachers/me", isTeacher, getMyContributionSummary);
// GET /api/contribution/teachers/:teacherId?from=&to=  (Admin xem đóng góp giáo viên bất kỳ)
router.get("/teachers/:teacherId", isAdmin, getTeacherContributionSummaryAdmin);

export default router;
