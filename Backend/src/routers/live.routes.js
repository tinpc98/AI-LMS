import express from "express";
import { createLiveSession, getActiveLiveSession, endLiveSession } from "../controllers/live.controller.js";
import { generateJaasToken } from "../controllers/jaas.controller.js";
import { verifyUser, isTeacher } from "../middlewares/auth.middlewares.js";

const router = express.Router();

// Chỉ Giáo viên mới được tạo hoặc kết thúc buổi học online
router.post("/create", verifyUser, isTeacher, createLiveSession);
router.get("/active/:classId", verifyUser, getActiveLiveSession);
router.post("/end", verifyUser, isTeacher, endLiveSession);
router.post("/jaas-token", verifyUser, generateJaasToken);

export default router;
