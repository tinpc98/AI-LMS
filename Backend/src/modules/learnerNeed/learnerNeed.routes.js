import { Router } from "express";
import {
  createMyLearnerNeed,
  getMyLearnerNeeds,
  listLearnerNeeds,
  cancelMyLearnerNeed,
  updateLearnerNeedStatus,
} from "./learnerNeed.controller.js";
import { verifyUser } from "#modules/auth";
import { isStudent, isTeacher } from "#shared/middlewares/rbac.middleware.js";

const router = Router();

router.use(verifyUser);

// Học viên khai báo/xem/huỷ nhu cầu học tập của chính mình.
router.post("/my", isStudent, createMyLearnerNeed);
router.get("/my", isStudent, getMyLearnerNeeds);
router.patch("/my/:id/cancel", isStudent, cancelMyLearnerNeed);

// Admin/giáo viên xem danh sách để xếp lớp thủ công (MVP — xem gap analysis R04).
router.get("/", isTeacher, listLearnerNeeds);
router.patch("/:id/status", isTeacher, updateLearnerNeedStatus);

export default router;
