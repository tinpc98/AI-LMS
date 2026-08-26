import axiosClient from "../../api/axiosClient";
import type { CreateSkillPayload, SkillRecord, UpdateSkillPayload } from "./skill.types";

// TÍNH NĂNG MỚI (mục 6): Skill là nhãn phân loại câu hỏi, scope theo Topic — KHÔNG dùng envelope
// {success,data} như topicService.ts (skill.controller.js trả thẳng {message, skill(s)}, cùng
// quy ước với lesson/lessonProgress.controller.js, xem api/lessonProgressApi.ts).
const mapSkill = (skill: any): SkillRecord => ({ ...skill, id: skill._id || skill.id });

export const skillService = {
  async getSkillsByTopic(topicId: string, includeArchived = false): Promise<SkillRecord[]> {
    const response = await axiosClient.get(`/skills/topic/${topicId}`, {
      params: includeArchived ? { includeArchived: "true" } : undefined,
    });
    return (response.data.skills || []).map(mapSkill);
  },

  async createSkill(payload: CreateSkillPayload): Promise<SkillRecord> {
    const response = await axiosClient.post("/skills", payload);
    return mapSkill(response.data.skill);
  },

  async updateSkill(id: string, payload: UpdateSkillPayload): Promise<SkillRecord> {
    const response = await axiosClient.put(`/skills/${id}`, payload);
    return mapSkill(response.data.skill);
  },

  async archiveSkill(id: string): Promise<SkillRecord> {
    const response = await axiosClient.patch(`/skills/${id}/archive`);
    return mapSkill(response.data.skill);
  },

  async restoreSkill(id: string): Promise<SkillRecord> {
    const response = await axiosClient.patch(`/skills/${id}/restore`);
    return mapSkill(response.data.skill);
  },

  async deleteSkill(id: string): Promise<void> {
    await axiosClient.delete(`/skills/${id}`);
  },
};
