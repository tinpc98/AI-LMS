import express from "express";
import * as topicController from "./topic.controller.js";
import { verifyUser } from "#modules/auth";
import { isTeacher } from "#shared/middlewares/rbac.middleware.js";

const router = express.Router();

// Giáo viên/Admin quản lý Topic
router.post("/", verifyUser, isTeacher, topicController.createTopic);
router.patch("/reorder", verifyUser, isTeacher, topicController.reorderTopics);
router.patch("/:id", verifyUser, isTeacher, topicController.updateTopic);
router.patch("/:id/publish", verifyUser, isTeacher, topicController.publishTopic);
router.patch("/:id/archive", verifyUser, isTeacher, topicController.archiveTopic);
router.delete("/:id", verifyUser, isTeacher, topicController.deleteTopic);

// Ai đăng nhập cũng xem được (học sinh cần xem để duyệt nội dung khóa học)
router.get("/course/:courseId", verifyUser, topicController.getTopicsByCourse);
router.get("/:id", verifyUser, topicController.getTopicById);

export default router;
