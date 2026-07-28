import express from "express";
import {
  createLiveSession,
  getActiveLiveSession,
  getLiveSessionDetail,
  getLiveSessionHistory,
  endLiveSession,
} from "../controllers/live.controller.js";
import { generateJaasToken, generateJaasTokenForSession } from "../controllers/jaas.controller.js";
import { verifyUser, isTeacher } from "../middlewares/auth.middlewares.js";
import { checkClassTeacherOwnership, checkClassEnrollment } from "../middlewares/liveAuth.middlewares.js";

const router = express.Router();

// --- 1. Tuyến Đường Legacy (Tương Thích Ngược FE V1) ---
router.post("/create", verifyUser, isTeacher, checkClassTeacherOwnership, createLiveSession);
router.get("/active/:classId", verifyUser, checkClassEnrollment, getActiveLiveSession);
router.post("/end", verifyUser, isTeacher, checkClassTeacherOwnership, endLiveSession);
router.post("/jaas-token", verifyUser, checkClassEnrollment, generateJaasToken);

// --- 2. Tuyến Đường REST API V2 Chuẩn Mục Tiêu (Sprint J3 & J4) ---
// Tạo buổi học mới (Teacher Owner)
router.post("/sessions", verifyUser, isTeacher, checkClassTeacherOwnership, createLiveSession);

// Lấy active session của lớp (Teacher Owner & Enrolled Student)
router.get("/classes/:classId/active", verifyUser, checkClassEnrollment, getActiveLiveSession);

// Lấy chi tiết phiên học trực tuyến (Teacher Owner & Enrolled Student thuộc lớp)
router.get("/sessions/:sessionId", verifyUser, checkClassEnrollment, getLiveSessionDetail);

// Lấy lịch sử các phiên học của Lớp (Teacher Owner duy nhất)
router.get("/classes/:classId/sessions", verifyUser, isTeacher, checkClassTeacherOwnership, getLiveSessionHistory);

// Lấy JaaS JWT Token (Teacher Owner -> moderator=true, Enrolled Student -> moderator=false)
router.post("/sessions/:sessionId/token", verifyUser, checkClassEnrollment, generateJaasTokenForSession);

// Kết thúc buổi học (Teacher Owner)
router.patch("/sessions/:sessionId/end", verifyUser, isTeacher, checkClassTeacherOwnership, endLiveSession);

export default router;
