import express from "express";
import {
  createSkill,
  getSkillsByTopic,
  updateSkill,
  archiveSkill,
  restoreSkill,
  deleteSkill,
} from "./skill.controller.js";
import { verifyUser } from "#modules/auth";
import { isTeacher } from "#shared/middlewares/rbac.middleware.js";

const router = express.Router();

router.post("/", verifyUser, isTeacher, createSkill);
router.get("/topic/:topicId", verifyUser, getSkillsByTopic);
router.put("/:id", verifyUser, isTeacher, updateSkill);
router.patch("/:id/archive", verifyUser, isTeacher, archiveSkill);
router.patch("/:id/restore", verifyUser, isTeacher, restoreSkill);
router.delete("/:id", verifyUser, isTeacher, deleteSkill);

export default router;
