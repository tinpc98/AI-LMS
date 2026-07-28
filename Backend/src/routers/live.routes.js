import express from "express";
import { createLiveSession, getActiveLiveSession, endLiveSession } from "../controllers/live.controller.js";
import { generateJaasToken, generateJaasTokenForSession } from "../controllers/jaas.controller.js";
import { verifyUser, isTeacher } from "../middlewares/auth.middlewares.js";
import { checkClassTeacherOwnership, checkClassEnrollment } from "../middlewares/liveAuth.middlewares.js";

const router = express.Router();

// --- 1. Tuyến Đường Legacy (Tương Thích Ngược FE Hiện Tại) ---
// Giáo viên tạo buổi học (yêu cầu sở hữu lớp)
router.post("/create", verifyUser, isTeacher, checkClassTeacherOwnership, createLiveSession);

// Sinh viên/Giáo viên xem active session (yêu cầu đăng ký lớp hoặc sở hữu lớp)
router.get("/active/:classId", verifyUser, checkClassEnrollment, getActiveLiveSession);

// Giáo viên kết thúc buổi học (yêu cầu sở hữu lớp)
router.post("/end", verifyUser, isTeacher, checkClassTeacherOwnership, endLiveSession);

// Lấy Token JaaS (yêu cầu đăng ký lớp hoặc sở hữu lớp)
router.post("/jaas-token", verifyUser, checkClassEnrollment, generateJaasToken);

// --- 2. Tuyến Đường REST API V2 Chuẩn Mục Tiêu (Sprint J3 & J4) ---
router.post("/sessions", verifyUser, isTeacher, checkClassTeacherOwnership, createLiveSession);
router.get("/classes/:classId/active", verifyUser, checkClassEnrollment, getActiveLiveSession);
router.post("/sessions/:sessionId/token", verifyUser, checkClassEnrollment, generateJaasTokenForSession);
router.patch("/sessions/:sessionId/end", verifyUser, isTeacher, checkClassTeacherOwnership, endLiveSession);

export default router;
