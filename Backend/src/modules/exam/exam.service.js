import Exam from "./exam.model.js";

export const createExamService = async (data, userId) => {
  // Loại bỏ các field legacy không có trong schema
  const { maxScore, isAIGenerated, startTime, ...validData } = data;
  const exam = new Exam({ ...validData, createdBy: userId });
  await exam.save();
  return exam;
};

export const updateExamService = async (examId, data) => {
  const exam = await Exam.findById(examId);
  if (!exam) throw new Error("Exam not found");
  // Loại bỏ các field không được phép sửa
  const { createdBy, _id, ...updateData } = data;
  Object.assign(exam, updateData);
  await exam.save();
  return exam;
};
