// File: src/modules/feedback/cohortFeedback.routes.js
import { Router } from "express";
import { verifyUser } from "#modules/auth";
import { isAdmin, isTeacher, isStudent } from "#shared/middlewares/rbac.middleware.js";
import {
  submitClassFeedback,
  getMyAverageRatings,
  getTeacherFeedbackDetails,
} from "./cohortFeedback.controller.js";

const router = Router();

router.post("/classes/:classId", verifyUser, isStudent, submitClassFeedback);
router.get("/me/average", verifyUser, isTeacher, getMyAverageRatings);
router.get("/teachers/:teacherId/details", verifyUser, isAdmin, getTeacherFeedbackDetails);

export default router;
