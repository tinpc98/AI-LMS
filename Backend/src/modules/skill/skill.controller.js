import { asyncHandler } from "#shared/utils/asyncHandler.js";
import {
  createSkillService,
  getSkillsByTopicService,
  updateSkillService,
  archiveSkillService,
  restoreSkillService,
  deleteSkillService,
} from "./skill.service.js";

export const createSkill = asyncHandler(async (req, res) => {
  const { topicId, name, description } = req.body;
  const userId = req.user.id || req.user._id;

  const skill = await createSkillService({ topicId, name, description }, userId, req.user?.role);
  return res.status(201).json({ message: "Tạo Skill thành công", skill });
});

export const getSkillsByTopic = asyncHandler(async (req, res) => {
  const { topicId } = req.params;
  const { includeArchived } = req.query;

  const skills = await getSkillsByTopicService(topicId, {
    includeArchived: includeArchived === "true",
  });
  return res.status(200).json({ skills });
});

export const updateSkill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  const userId = req.user.id || req.user._id;

  const skill = await updateSkillService(id, { name, description }, userId, req.user?.role);
  return res.status(200).json({ message: "Cập nhật Skill thành công", skill });
});

export const archiveSkill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;

  const skill = await archiveSkillService(id, userId, req.user?.role);
  return res.status(200).json({ message: "Đã archive Skill", skill });
});

export const restoreSkill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;

  const skill = await restoreSkillService(id, userId, req.user?.role);
  return res.status(200).json({ message: "Đã khôi phục Skill", skill });
});

export const deleteSkill = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;

  await deleteSkillService(id, userId, req.user?.role);
  return res.status(200).json({ message: "Đã xóa Skill" });
});
