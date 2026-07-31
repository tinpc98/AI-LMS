import express from "express";
import {
  createLiveSession,
  getActiveLiveSession,
  getLiveSessionDetail,
  getLiveSessionHistory,
  endLiveSession,
} from "./live.controller.js";
import { generateJaasTokenForSession } from "./jaas.controller.js";
import { verifyUser } from "#modules/auth";
import { isTeacher } from "#shared/middlewares/rbac.middleware.js";
import {
  checkClassTeacherOwnership,
  checkClassEnrollment,
  resolveClassIdFromBody,
  resolveClassIdFromParams,
  resolveLiveSession,
} from "./liveAuth.middleware.js";

const router = express.Router();

// --- 2. Tuyến Đường REST API V2 Chuẩn Mục Tiêu (Sprint J3 & J4) ---
// Tạo buổi học mới (Teacher Owner)
router.post(
  "/sessions",
  verifyUser,
  isTeacher,
  resolveClassIdFromBody,
  checkClassTeacherOwnership,
  createLiveSession
);

// Lấy active session của lớp (Teacher Owner & Enrolled Student)
router.get(
  "/classes/:classId/active",
  verifyUser,
  resolveClassIdFromParams,
  checkClassEnrollment,
  getActiveLiveSession
);

// Lấy chi tiết phiên học trực tuyến (Teacher Owner & Enrolled Student thuộc lớp)
router.get(
  "/sessions/:sessionId",
  verifyUser,
  resolveLiveSession,
  checkClassEnrollment,
  getLiveSessionDetail
);

// Lấy lịch sử các phiên học của Lớp (Teacher Owner duy nhất)
router.get(
  "/classes/:classId/sessions",
  verifyUser,
  isTeacher,
  resolveClassIdFromParams,
  checkClassTeacherOwnership,
  getLiveSessionHistory
);

// Lấy JaaS JWT Token (Teacher Owner -> moderator=true, Enrolled Student -> moderator=false)
router.post(
  "/sessions/:sessionId/token",
  verifyUser,
  resolveLiveSession,
  checkClassEnrollment,
  generateJaasTokenForSession
);

// Kết thúc buổi học (Teacher Owner)
router.patch(
  "/sessions/:sessionId/end",
  verifyUser,
  isTeacher,
  resolveLiveSession,
  checkClassTeacherOwnership,
  endLiveSession
);

export default router;
