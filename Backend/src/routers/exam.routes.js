import express from "express";
import { autoGenerateExam } from "../controllers/exam.controller.js";
import { verifyUser } from "../middlewares/auth.middlewares.js";

const router = express.Router();
router.post("/generate-auto", verifyUser, autoGenerateExam);
export default router;
