import express from "express";
import { autoGenerateExam } from "../controllers/exam.controller.js";
import { verifyUser } from "../middlewares/auth.middlewares.js";
import * as examController from "../controllers/exam.controller.js";

const router = express.Router();
router.post("/generate-auto", verifyUser, autoGenerateExam);
router.get("/class/:classId", examController.getExamsByClass);
router.get("/", examController.getAllExams);
router.get("/:id", examController.getExamById);
export default router;
