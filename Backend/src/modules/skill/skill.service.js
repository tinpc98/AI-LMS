// Quản lý Skill — TÍNH NĂNG MỚI theo đặc tả nghiệp vụ mục 6 (EduSpace-Dac-ta-nghiep-vu).
//
// Phạm vi MVP đã chốt: Skill CHỈ là nhãn phân loại câu hỏi (question-classification tag), scope
// theo Topic — KHÔNG có mastery-level scoring, KHÔNG hiển thị cho học sinh. Lý do giữ lại module
// này sớm dù chưa dùng để tính điểm: AI cá nhân hóa cần nhãn skill để hoạt động, dữ liệu nhãn
// tích lũy theo thời gian nên phải bắt đầu gắn từ bây giờ — càng để muộn càng nhiều câu hỏi cũ
// không có nhãn. Tính mastery-level + hiển thị cho học sinh CỐ Ý hoãn sang giai đoạn 2.
import mongoose from "mongoose";
import Skill from "./skill.model.js";
import { Topic } from "#modules/topic";
import { Course } from "#modules/course";
import { Question } from "#modules/question";
import { NotFoundError, BusinessRuleError, AuthorizationError } from "#shared/utils/appError.js";

/**
 * Giáo viên chủ nhiệm khóa học chứa Topic (qua Topic -> Course -> createdBy) hoặc Admin mới
 * được quản lý Skill của Topic đó — mirror đúng pattern checkTopicTeacherOwnership đã lặp lại ở
 * lesson.service.js/assignment.service.js, viết riêng ở đây (không cross-import topic.service.js)
 * để tránh phụ thuộc chéo không cần thiết giữa 2 module không có quan hệ vòng.
 */
const assertTopicOwnership = async (topicId, userId, role) => {
  const topic = await Topic.findById(topicId);
  if (!topic) throw new NotFoundError("Không tìm thấy Topic.");

  if ((role || "").toLowerCase() !== "admin") {
    const course = await Course.findById(topic.courseId).select("createdBy").lean();
    if (!course || course.createdBy.toString() !== userId.toString()) {
      throw new AuthorizationError("Bạn không có quyền quản lý Skill của Topic này.");
    }
  }

  return topic;
};

const getSkillOr404 = async (skillId) => {
  if (!mongoose.Types.ObjectId.isValid(skillId)) {
    throw new NotFoundError("ID Skill không hợp lệ.");
  }
  const skill = await Skill.findById(skillId);
  if (!skill) throw new NotFoundError("Không tìm thấy Skill.");
  return skill;
};

export const createSkillService = async ({ topicId, name, description }, userId, role) => {
  if (!topicId) throw new BusinessRuleError("Thiếu topicId.");
  if (!name) throw new BusinessRuleError("Thiếu tên Skill.");

  await assertTopicOwnership(topicId, userId, role);

  const order = await Skill.countDocuments({ topicId });

  return Skill.create({ topicId, name, description: description || "", order });
};

/** Danh sách Skill của 1 Topic, sắp theo order — ẩn ARCHIVED trừ khi yêu cầu rõ. */
export const getSkillsByTopicService = async (topicId, { includeArchived = false } = {}) => {
  const query = { topicId };
  if (!includeArchived) query.status = "ACTIVE";
  return Skill.find(query).sort({ order: 1 }).lean();
};

export const updateSkillService = async (skillId, { name, description }, userId, role) => {
  const skill = await getSkillOr404(skillId);
  await assertTopicOwnership(skill.topicId, userId, role);

  if (name !== undefined) skill.name = name;
  if (description !== undefined) skill.description = description;
  await skill.save();
  return skill;
};

export const archiveSkillService = async (skillId, userId, role) => {
  const skill = await getSkillOr404(skillId);
  await assertTopicOwnership(skill.topicId, userId, role);

  if (skill.status === "ARCHIVED") {
    throw new BusinessRuleError("Skill đã ở trạng thái ARCHIVED.");
  }
  skill.status = "ARCHIVED";
  await skill.save();
  return skill;
};

export const restoreSkillService = async (skillId, userId, role) => {
  const skill = await getSkillOr404(skillId);
  await assertTopicOwnership(skill.topicId, userId, role);

  if (skill.status === "ACTIVE") {
    throw new BusinessRuleError("Skill đã ở trạng thái ACTIVE.");
  }
  skill.status = "ACTIVE";
  await skill.save();
  return skill;
};

/**
 * Xóa hẳn Skill — chỉ cho phép khi KHÔNG còn câu hỏi nào gắn nhãn này (Question.primarySkillId),
 * tránh để lại tham chiếu mồ côi. Còn dùng thì chỉ cho archive.
 */
export const deleteSkillService = async (skillId, userId, role) => {
  const skill = await getSkillOr404(skillId);
  await assertTopicOwnership(skill.topicId, userId, role);

  const questionCount = await Question.countDocuments({ primarySkillId: skillId });
  if (questionCount > 0) {
    throw new BusinessRuleError(
      "Skill này đang được gắn cho câu hỏi — không thể xóa. Hãy archive thay vì xóa."
    );
  }

  await skill.softDelete(userId);
  return skill;
};

export default {
  createSkillService,
  getSkillsByTopicService,
  updateSkillService,
  archiveSkillService,
  restoreSkillService,
  deleteSkillService,
};
