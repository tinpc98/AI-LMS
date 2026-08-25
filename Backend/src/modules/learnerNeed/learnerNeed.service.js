import LearnerNeed from "./learnerNeed.model.js";
import { NotFoundError, AuthorizationError } from "#shared/utils/appError.js";

export const createLearnerNeed = async (studentId, payload) => {
  const { subject, currentLevel, goal, preferredFormat, preferredTimes, note } = payload;

  return LearnerNeed.create({
    studentId,
    subject,
    currentLevel,
    goal,
    preferredFormat,
    preferredTimes,
    note,
  });
};

export const getMyLearnerNeeds = async (studentId) => {
  return LearnerNeed.find({ studentId }).sort({ createdAt: -1 }).lean();
};

// Danh sách nhu cầu để admin/giáo viên xem khi xếp lớp. Chỉ trả về OPEN theo mặc định —
// nhu cầu đã MATCHED/CLOSED không còn cần hiển thị ở đây.
export const listLearnerNeeds = async (filters = {}) => {
  const query = {};
  if (filters.subject) query.subject = { $regex: filters.subject, $options: "i" };
  query.status = filters.status || "OPEN";

  return LearnerNeed.find(query)
    .populate("studentId", "fullName email avatar")
    .sort({ createdAt: -1 })
    .lean();
};

export const cancelMyLearnerNeed = async (studentId, needId) => {
  const need = await LearnerNeed.findById(needId);
  if (!need) throw new NotFoundError("Không tìm thấy nhu cầu học tập này");
  if (String(need.studentId) !== String(studentId)) {
    throw new AuthorizationError("Bạn không có quyền huỷ nhu cầu học tập này");
  }
  need.status = "CLOSED";
  await need.save();
  return need;
};

export const updateLearnerNeedStatus = async (needId, status) => {
  const need = await LearnerNeed.findById(needId);
  if (!need) throw new NotFoundError("Không tìm thấy nhu cầu học tập này");
  need.status = status;
  await need.save();
  return need;
};
