// File: src/modules/exam-set/examSetQuestion.service.js
// Nghiệp vụ CÂU HỎI trong bộ đề: thêm, sửa, sắp xếp lại, xoá — kèm toàn bộ quy tắc
// kiểm tra payload theo từng loại câu hỏi (multiple_choice / true_false / short_answer /
// essay).
//
// Tách từ examSet.service.js ở Wave 4.1. Đây là nhóm lớn nhất và đan xen nhất: 4 hàm CRUD
// kéo theo 12 helper qua nhiều tầng gọi lồng nhau. Danh sách helper được tính bằng BAO
// ĐÓNG BẮC CẦU (helper gọi helper) chứ không phải chỉ nhìn tham chiếu trực tiếp — bước
// trước tôi đã sót đúng vì chỉ nhìn một tầng.
//
// Nội dung giữ NGUYÊN VĂN, chỉ thay danh sách import.
import { Types } from "mongoose";
import ExamSet from "./examSet.model.js";
import { recalculateExamSetMetrics } from "./examSet.metrics.js";
import { isEditableExamSetStatus } from "./examSetStatus.js";

const VALID_QUESTION_TYPES = ["multiple_choice", "true_false", "short_answer", "essay"];

const essayForbiddenFields = ["options", "correctAnswer", "acceptedAnswers", "caseSensitive"];

export const ensureEssayQuestionFieldsAllowed = (type, payload, existingQuestion = null) => {
  const questionType = String(type || "")
    .trim()
    .toLowerCase();
  if (questionType !== "essay") {
    return;
  }

  for (const field of essayForbiddenFields) {
    if (payload[field] !== undefined) {
      const error = new Error(`ESSAY không sử dụng ${field}`);
      error.status = 400;
      throw error;
    }
  }

  const effectiveScore =
    payload.score !== undefined
      ? payload.score
      : payload.points !== undefined
        ? payload.points
        : existingQuestion?.points;

  if (effectiveScore === undefined) {
    const error = new Error("Score là bắt buộc cho ESSAY");
    error.status = 400;
    throw error;
  }
};

const normalizeBooleanAnswer = (correctAnswer) => {
  if (typeof correctAnswer === "boolean") {
    return correctAnswer;
  }
  if (typeof correctAnswer === "string") {
    return correctAnswer.toLowerCase().trim() === "true";
  }
  return undefined;
};

const buildTrueFalseOptions = (correctAnswer) => {
  const normalizedCorrect = normalizeBooleanAnswer(correctAnswer);
  return [
    { id: "true", text: "True", isCorrect: normalizedCorrect === true },
    { id: "false", text: "False", isCorrect: normalizedCorrect === false },
  ];
};

const validateTrueFalsePayload = (questionData) => {
  const correctAnswerValue = normalizeBooleanAnswer(questionData.correctAnswer);
  if (correctAnswerValue === undefined) {
    const error = new Error("correctAnswer phải là boolean hoặc 'true'/'false' cho true_false");
    error.status = 400;
    throw error;
  }

  if (!questionData.options) {
    questionData.options = buildTrueFalseOptions(correctAnswerValue);
    return;
  }

  if (!Array.isArray(questionData.options) || questionData.options.length !== 2) {
    const error = new Error("Câu hỏi Đúng/Sai phải có đúng 2 lựa chọn");
    error.status = 400;
    throw error;
  }

  const normalized = questionData.options.map((option) => {
    if (!option || typeof option !== "object") {
      const error = new Error("TRUE_FALSE options phải là object");
      error.status = 400;
      throw error;
    }
    return String(option.text || "")
      .trim()
      .toLowerCase();
  });

  if (!normalized.includes("true") || !normalized.includes("false")) {
    const error = new Error("TRUE_FALSE options phải gồm True và False");
    error.status = 400;
    throw error;
  }
};

const validateMultipleChoicePayload = (questionData) => {
  if (
    !questionData.options ||
    !Array.isArray(questionData.options) ||
    questionData.options.length < 2
  ) {
    const error = new Error("Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn");
    error.status = 400;
    throw error;
  }

  const hasCorrectAnswer = questionData.options.some(
    (opt) =>
      opt.isCorrect === true ||
      opt.id === questionData.correctAnswer ||
      opt.text === questionData.correctAnswer
  );
  if (!hasCorrectAnswer) {
    const error = new Error("Phải có ít nhất 1 đáp án đúng");
    error.status = 400;
    throw error;
  }
};

const validateShortAnswerPayload = (questionData) => {
  if (!questionData.correctAnswer || String(questionData.correctAnswer).trim() === "") {
    const error = new Error("Câu hỏi trả lời ngắn phải có câu trả lời đúng");
    error.status = 400;
    throw error;
  }
};

const validateQuestionPayloadByType = (type, questionData) => {
  const normalizedType = String(type || "")
    .trim()
    .toLowerCase();
  switch (normalizedType) {
    case "multiple_choice":
      return validateMultipleChoicePayload(questionData);
    case "true_false":
      return validateTrueFalsePayload(questionData);
    case "short_answer":
      return validateShortAnswerPayload(questionData);
    case "essay":
      return ensureEssayQuestionFieldsAllowed(normalizedType, questionData);
    default:
      return;
  }
};

const normalizeQuestionPayload = (type, questionData) => {
  const normalizedType = String(type || "")
    .trim()
    .toLowerCase();
  if (normalizedType === "true_false") {
    if (questionData.options === undefined || questionData.options === null) {
      const correctAnswerValue = normalizeBooleanAnswer(questionData.correctAnswer);
      questionData.options = buildTrueFalseOptions(correctAnswerValue);
    }
  }
};

const resolveUpdateField = (field, updateData, existingQuestion) => {
  if (updateData[field] !== undefined) {
    return updateData[field];
  }
  return existingQuestion?.[field];
};

const validateQuestionUpdatePayloadByType = (type, updateData, existingQuestion) => {
  const normalizedType = String(type || "")
    .trim()
    .toLowerCase();
  const effectiveOptions = resolveUpdateField("options", updateData, existingQuestion);
  const effectiveCorrectAnswer = resolveUpdateField("correctAnswer", updateData, existingQuestion);
  const effectivePoints = resolveUpdateField("points", updateData, existingQuestion);
  const effectiveScore = resolveUpdateField("score", updateData, existingQuestion);

  if (normalizedType === "multiple_choice") {
    if (updateData.options !== undefined) {
      if (!Array.isArray(effectiveOptions) || effectiveOptions.length < 2) {
        const error = new Error("Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn");
        error.status = 400;
        throw error;
      }
    }

    if (updateData.correctAnswer !== undefined && Array.isArray(effectiveOptions)) {
      const matchById = effectiveOptions.some((option) => option.id === updateData.correctAnswer);
      const matchByText = effectiveOptions.some(
        (option) => option.text === updateData.correctAnswer
      );
      if (!matchById && !matchByText) {
        const error = new Error("correctAnswer phải tồn tại trong options");
        error.status = 400;
        throw error;
      }
    }
  }

  if (normalizedType === "true_false") {
    if (updateData.correctAnswer !== undefined) {
      const normalizedAnswer = normalizeBooleanAnswer(updateData.correctAnswer);
      if (normalizedAnswer === undefined) {
        const error = new Error("correctAnswer phải là boolean hoặc 'true'/'false' cho true_false");
        error.status = 400;
        throw error;
      }
    }

    if (updateData.options !== undefined) {
      if (!Array.isArray(effectiveOptions) || effectiveOptions.length !== 2) {
        const error = new Error("Câu hỏi Đúng/Sai phải có đúng 2 lựa chọn");
        error.status = 400;
        throw error;
      }
      const normalized = effectiveOptions.map((option) => {
        if (!option || typeof option !== "object") {
          const error = new Error("TRUE_FALSE options phải là object");
          error.status = 400;
          throw error;
        }
        return String(option.text || "")
          .trim()
          .toLowerCase();
      });
      if (!normalized.includes("true") || !normalized.includes("false")) {
        const error = new Error("TRUE_FALSE options phải gồm True và False");
        error.status = 400;
        throw error;
      }
    }
  }

  if (normalizedType === "short_answer") {
    if (updateData.correctAnswer !== undefined && String(updateData.correctAnswer).trim() === "") {
      const error = new Error("correctAnswer là bắt buộc cho short_answer");
      error.status = 400;
      throw error;
    }
  }

  if (normalizedType === "essay") {
    if (
      updateData.score !== undefined ||
      updateData.points !== undefined ||
      updateData.type !== undefined
    ) {
      ensureEssayQuestionFieldsAllowed(normalizedType, updateData, existingQuestion);
    }
  }
};

/**
 * Add question to exam set
 * @param {string} examSetId - Exam set ID
 * @param {string} ownerId - Current user ID (from JWT)
 * @param {Object} questionData - Question data
 * @returns {Object} Updated exam set with new question
 */
export const addQuestionToExamSetService = async (examSetId, ownerId, questionData) => {
  // Validate required fields
  if (!questionData.questionId) {
    const error = new Error("questionId là bắt buộc");
    error.status = 400;
    throw error;
  }

  if (!questionData.type) {
    const error = new Error("Loại câu hỏi là bắt buộc");
    error.status = 400;
    throw error;
  }

  if (!questionData.content) {
    const error = new Error("Nội dung câu hỏi là bắt buộc");
    error.status = 400;
    throw error;
  }

  // Find exam set and verify ownership
  const examSet = await ExamSet.findOne({
    _id: examSetId,
    ownerId: ownerId,
    isDeleted: false,
  });

  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại hoặc bạn không có quyền truy cập");
    error.status = 404;
    throw error;
  }

  // Check if exam set is in editable status
  if (!isEditableExamSetStatus(examSet.status)) {
    const error = new Error("Không thể thêm câu hỏi khi bộ đề thi không ở trạng thái draft");
    error.status = 403;
    throw error;
  }

  // Normalize and validate question type
  if (typeof questionData.type === "string") {
    questionData.type = questionData.type.trim().toLowerCase();
  }

  if (!VALID_QUESTION_TYPES.includes(questionData.type)) {
    const error = new Error("Loại câu hỏi không hợp lệ");
    error.status = 400;
    throw error;
  }

  validateQuestionPayloadByType(questionData.type, questionData);
  normalizeQuestionPayload(questionData.type, questionData);

  // Check if question ID already exists
  const questionExists = examSet.questions.some((q) => q.questionId === questionData.questionId);
  if (questionExists) {
    const error = new Error("questionId đã tồn tại trong bộ đề thi này");
    error.status = 400;
    throw error;
  }

  // Prepare new question object
  const newQuestion = {
    questionId: questionData.questionId.trim(),
    order: questionData.order !== undefined ? questionData.order : examSet.questions.length,
    type: questionData.type,
    content: questionData.content.trim(),
    imageUrl: questionData.imageUrl || null,
    hint: questionData.hint ? questionData.hint.trim() : "",
    points:
      questionData.points !== undefined
        ? questionData.points
        : questionData.score !== undefined
          ? questionData.score
          : 1,
    difficulty: questionData.difficulty || "medium",
    options: questionData.options || [],
    correctAnswer: questionData.correctAnswer !== undefined ? questionData.correctAnswer : "",
    acceptedAnswers: questionData.acceptedAnswers || [],
    caseSensitive: questionData.caseSensitive || false,
    explanation: questionData.explanation ? questionData.explanation.trim() : "",
    feedbackCorrect: questionData.feedbackCorrect || "Chính xác!",
    feedbackIncorrect: questionData.feedbackIncorrect || "Sai rồi!",
    suggestedAnswer: questionData.suggestedAnswer ? questionData.suggestedAnswer.trim() : "",
    rubric: Array.isArray(questionData.rubric) ? questionData.rubric : [],
    category: questionData.category ? questionData.category.trim() : "",
    tags: questionData.tags || [],
    isActive: questionData.isActive !== undefined ? questionData.isActive : true,
    timeLimit: questionData.timeLimit || null,
  };

  // Add question to array
  examSet.questions.push(newQuestion);

  // Recalculate metrics explicitly in service before save
  recalculateExamSetMetrics(examSet);

  const updatedExamSet = await examSet.save();

  return updatedExamSet.populate("folderId", "name").populate("ownerId", "fullName email");
};

/**
 * Update question in exam set
 * @param {string} examSetId - Exam set ID
 * @param {string} ownerId - Current user ID (from JWT)
 * @param {string} questionId - Question ID (not MongoDB _id)
 * @param {Object} updateData - Question data to update
 * @returns {Object} Updated exam set with modified question
 */
export const updateQuestionInExamSetService = async (
  examSetId,
  ownerId,
  questionId,
  updateData
) => {
  // Find exam set and verify ownership
  const examSet = await ExamSet.findOne({
    _id: examSetId,
    ownerId: ownerId,
    isDeleted: false,
  });

  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại hoặc bạn không có quyền truy cập");
    error.status = 404;
    throw error;
  }

  // Check if exam set is published (cannot update questions in published exams)
  if (examSet.status === "published") {
    const error = new Error("Không thể cập nhật câu hỏi trong bộ đề thi đã công bố");
    error.status = 403;
    throw error;
  }

  // Find question in the questions array
  const questionIndex = examSet.questions.findIndex((q) => q.questionId === questionId);
  if (questionIndex === -1) {
    const error = new Error("Câu hỏi không tồn tại");
    error.status = 404;
    throw error;
  }

  const question = examSet.questions[questionIndex];

  // Cannot update questionId (unique identifier)
  if (updateData.questionId && updateData.questionId !== questionId) {
    const error = new Error("Không thể thay đổi questionId");
    error.status = 400;
    throw error;
  }

  const effectiveType = updateData.type
    ? String(updateData.type).trim().toLowerCase()
    : question.type;
  if (!VALID_QUESTION_TYPES.includes(effectiveType)) {
    const error = new Error("Loại câu hỏi không hợp lệ");
    error.status = 400;
    throw error;
  }

  updateData.type = effectiveType;
  const mergedQuestion = {
    ...question.toObject(),
    ...updateData,
    type: effectiveType,
  };

  validateQuestionPayloadByType(effectiveType, mergedQuestion);
  validateQuestionUpdatePayloadByType(effectiveType, updateData, question);
  normalizeQuestionPayload(effectiveType, mergedQuestion);

  if (
    effectiveType === "true_false" &&
    updateData.correctAnswer !== undefined &&
    updateData.options === undefined
  ) {
    question.options = mergedQuestion.options;
  }

  if (updateData.score !== undefined) {
    question.points = updateData.score;
  }
  if (updateData.points !== undefined) {
    question.points = updateData.points;
  }

  // Allowed fields to update
  const allowedFields = [
    "type",
    "content",
    "imageUrl",
    "hint",
    "points",
    "difficulty",
    "options",
    "correctAnswer",
    "acceptedAnswers",
    "caseSensitive",
    "explanation",
    "feedbackCorrect",
    "feedbackIncorrect",
    "category",
    "tags",
    "isActive",
    "timeLimit",
    "order",
    "suggestedAnswer",
    "rubric",
  ];

  // Update fields if provided
  for (const field of allowedFields) {
    if (field in updateData && updateData[field] !== undefined) {
      if (
        field === "content" ||
        field === "hint" ||
        field === "explanation" ||
        field === "category"
      ) {
        // Trim string fields
        question[field] =
          typeof updateData[field] === "string" ? updateData[field].trim() : updateData[field];
      } else {
        question[field] = updateData[field];
      }
    }
  }

  // Validate question type if it was updated
  const validTypes = ["multiple_choice", "true_false", "short_answer", "essay"];
  if (!validTypes.includes(question.type)) {
    const error = new Error("Loại câu hỏi không hợp lệ");
    error.status = 400;
    throw error;
  }

  // Type-specific validation
  if (question.type === "multiple_choice") {
    if (!question.options || !Array.isArray(question.options) || question.options.length < 2) {
      const error = new Error("Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn");
      error.status = 400;
      throw error;
    }

    const hasCorrectAnswer = question.options.some((opt) => opt.isCorrect === true);
    if (!hasCorrectAnswer) {
      const error = new Error("Phải có ít nhất 1 đáp án đúng");
      error.status = 400;
      throw error;
    }
  } else if (question.type === "true_false") {
    if (!question.options || !Array.isArray(question.options) || question.options.length !== 2) {
      const error = new Error("Câu hỏi Đúng/Sai phải có đúng 2 lựa chọn");
      error.status = 400;
      throw error;
    }

    const hasCorrectAnswer = question.options.some((opt) => opt.isCorrect === true);
    if (!hasCorrectAnswer) {
      const error = new Error("Phải có 1 đáp án đúng");
      error.status = 400;
      throw error;
    }
  } else if (question.type === "short_answer") {
    if (!question.correctAnswer) {
      const error = new Error("Câu hỏi trả lời ngắn phải có câu trả lời đúng");
      error.status = 400;
      throw error;
    }
  }

  // Update the question in the array
  examSet.questions[questionIndex] = question;

  // Recalculate metrics explicitly in service before save
  recalculateExamSetMetrics(examSet);

  // Save exam set
  const updatedExamSet = await examSet.save();

  return updatedExamSet.populate("folderId", "name").populate("ownerId", "fullName email");
};

/**
 * Reorder questions within an exam set
 * @param {string} examSetId
 * @param {string} ownerId
 * @param {Array} reorderItems
 * @returns {Object} Updated exam set
 */
export const reorderQuestionsInExamSetService = async (
  examSetId,
  currentUserId,
  currentUserRole,
  reorderItems
) => {
  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    const error = new Error("examSetId không hợp lệ");
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(reorderItems) || reorderItems.length === 0) {
    const error = new Error("Payload questions phải là một mảng và không được rỗng");
    error.status = 400;
    throw error;
  }

  const questionIdSet = new Set();
  const orderSet = new Set();
  const normalizedItems = reorderItems.map((item, index) => {
    if (!item || typeof item !== "object") {
      const error = new Error(`questions[${index}] phải là object chứa questionId và order`);
      error.status = 400;
      throw error;
    }

    const { questionId, order } = item;

    if (!questionId || typeof questionId !== "string" || questionId.trim() === "") {
      const error = new Error(`questions[${index}].questionId là bắt buộc`);
      error.status = 400;
      throw error;
    }

    if (
      order === undefined ||
      order === null ||
      typeof order !== "number" ||
      !Number.isInteger(order) ||
      order < 0
    ) {
      const error = new Error(`questions[${index}].order phải là số nguyên không âm`);
      error.status = 400;
      throw error;
    }

    const trimmedId = questionId.trim();
    if (questionIdSet.has(trimmedId)) {
      const error = new Error("Không được phép duplicate questionId trong payload");
      error.status = 400;
      throw error;
    }

    if (orderSet.has(order)) {
      const error = new Error("Không được phép duplicate order trong payload");
      error.status = 400;
      throw error;
    }

    questionIdSet.add(trimmedId);
    orderSet.add(order);

    return { questionId: trimmedId, order };
  });

  const examSet = await ExamSet.findOne({
    _id: examSetId,
    isDeleted: false,
  });

  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại hoặc bạn không có quyền truy cập");
    error.status = 404;
    throw error;
  }

  const userRole = (currentUserRole || "").toLowerCase();
  const isOwner = examSet.ownerId.toString() === currentUserId;
  const hasEditPermission = ["admin", "teacher"].includes(userRole);

  if (!isOwner && !hasEditPermission) {
    const error = new Error("Bạn không có quyền sắp xếp lại câu hỏi");
    error.status = 403;
    throw error;
  }

  if (examSet.status !== "draft") {
    const error = new Error("Chỉ có thể sắp xếp lại câu hỏi khi bộ đề thi đang ở trạng thái draft");
    error.status = 403;
    throw error;
  }

  const existingQuestionIds = new Set(examSet.questions.map((q) => q.questionId));
  const reorderItemMap = new Map(normalizedItems.map((item) => [item.questionId, item.order]));

  for (const { questionId } of normalizedItems) {
    if (!existingQuestionIds.has(questionId)) {
      const error = new Error(`Câu hỏi ${questionId} không tồn tại trong bộ đề thi`);
      error.status = 404;
      throw error;
    }
  }

  const finalOrderSet = new Set();
  for (const question of examSet.questions) {
    const newOrder = reorderItemMap.has(question.questionId)
      ? reorderItemMap.get(question.questionId)
      : question.order;
    if (finalOrderSet.has(newOrder)) {
      const error = new Error("Không được phép duplicate order sau khi sắp xếp lại câu hỏi");
      error.status = 400;
      throw error;
    }
    finalOrderSet.add(newOrder);
  }

  examSet.questions = examSet.questions.map((question) => {
    const reorderItem = reorderItemMap.get(question.questionId);
    if (reorderItem !== undefined) {
      question.order = reorderItem;
    }
    return question;
  });

  examSet.questions.sort((a, b) => a.order - b.order);

  const updatedExamSet = await examSet.save();
  return updatedExamSet.populate("folderId", "name").populate("ownerId", "fullName email");
};

/**
 * Delete question from exam set
 * @param {string} examSetId
 * @param {string} currentUserId
 * @param {string} currentUserRole
 * @param {string} questionId
 * @returns {Object} Updated exam set
 */
export const deleteQuestionFromExamSetService = async (
  examSetId,
  currentUserId,
  currentUserRole,
  questionId
) => {
  if (!examSetId || !Types.ObjectId.isValid(examSetId)) {
    const error = new Error("examSetId không hợp lệ");
    error.status = 400;
    throw error;
  }

  if (!questionId || typeof questionId !== "string" || questionId.trim() === "") {
    const error = new Error("questionId là bắt buộc");
    error.status = 400;
    throw error;
  }

  const normalizedQuestionId = questionId.trim();

  const examSet = await ExamSet.findOne({
    _id: examSetId,
    isDeleted: false,
  });

  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại");
    error.status = 404;
    throw error;
  }

  const userRole = (currentUserRole || "").toLowerCase();
  const isOwner = examSet.ownerId.toString() === currentUserId;
  const hasEditPermission = ["admin", "teacher"].includes(userRole);

  if (!isOwner && !hasEditPermission) {
    const error = new Error("Bạn không có quyền xóa câu hỏi");
    error.status = 403;
    throw error;
  }

  if (examSet.status === "published") {
    const error = new Error("Không thể xóa câu hỏi khi bộ đề thi đang ở trạng thái Published");
    error.status = 403;
    throw error;
  }

  const questionIndex = examSet.questions.findIndex((q) => q.questionId === normalizedQuestionId);
  if (questionIndex === -1) {
    const error = new Error("Câu hỏi không tồn tại trong bộ đề thi");
    error.status = 404;
    throw error;
  }

  examSet.questions.splice(questionIndex, 1);

  recalculateExamSetMetrics(examSet);

  const updatedExamSet = await examSet.save();
  return updatedExamSet.populate("folderId", "name").populate("ownerId", "fullName email");
};
