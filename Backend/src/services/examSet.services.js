// File: src/services/examSet.services.js
import { Types } from "mongoose";
import ExamSet from "../models/examSet.model.js";
import Folder from "../models/folder.model.js";

/**
 * Create new exam set
 * @param {string} ownerId - Owner user ID (from JWT)
 * @param {Object} examData - Exam set data
 * @param {string} examData.folderId - Folder ID (required)
 * @param {string} examData.title - Exam title (required)
 * @param {string} examData.description - Exam description (optional)
 * @param {Array} examData.tags - Tags (optional)
 * @returns {Object} Created exam set
 */
export const createExamSetService = async (ownerId, examData) => {
  // Validate required fields
  if (!examData.folderId) {
    const error = new Error("folderId là bắt buộc");
    error.status = 400;
    throw error;
  }

  if (!examData.title) {
    const error = new Error("Tiêu đề là bắt buộc");
    error.status = 400;
    throw error;
  }

  // Verify folder exists and belongs to the owner
  const folder = await Folder.findOne({
    _id: examData.folderId,
    ownerId: ownerId,
    isDeleted: false,
  });

  if (!folder) {
    const error = new Error("Folder không tồn tại hoặc bạn không có quyền truy cập");
    error.status = 404;
    throw error;
  }

  // Create new exam set
  const newExamSet = new ExamSet({
    ownerId, // From JWT, not from client
    folderId: examData.folderId,
    title: examData.title.trim(),
    description: examData.description?.trim() || "",
    status: "draft", // Always default to draft
    tags: examData.tags || [],
    questions: [], // Empty by default
  });

  await newExamSet.save();
  return newExamSet;
};

/**
 * Get exam sets with filters
 * @param {string} ownerId - Current user ID (from JWT)
 * @param {Object} filters - Filter options
 * @param {string} filters.folderId - Filter by folder ID (optional)
 * @param {string} filters.status - Filter by status (optional)
 * @param {number} filters.page - Page number (default: 1)
 * @param {number} filters.limit - Items per page (default: 10, max: 100)
 * @returns {Object} Paginated exam sets
 */
export const getExamSetsService = async (ownerId, filters = {}) => {
  // Build query - always filter by owner
  const query = {
    ownerId: ownerId,
    isDeleted: false,
  };

  // Filter by folder ID if provided
  if (filters.folderId) {
    query.folderId = filters.folderId;
  }

  // Filter by status if provided
  if (filters.status) {
    const validStatuses = ["draft", "published", "archived"];
    if (validStatuses.includes(filters.status.toLowerCase())) {
      query.status = filters.status.toLowerCase();
    }
  }

  // Pagination
  const page = Math.max(1, parseInt(filters.page) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(filters.limit) || 10));
  const skip = (page - 1) * limit;

  // Fetch exam sets
  const [examSets, total] = await Promise.all([
    ExamSet.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("folderId", "name")
      .populate("ownerId", "fullName email"),
    ExamSet.countDocuments(query),
  ]);

  return {
    examSets,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

/**
 * Update exam set
 * @param {string} examSetId - Exam set ID
 * @param {string} ownerId - Current user ID (from JWT)
 * @param {Object} updateData - Data to update
 * @returns {Object} Updated exam set
 */
export const updateExamSetService = async (examSetId, ownerId, updateData) => {
  // Find exam set and verify ownership
  const examSet = await ExamSet.findOne({
    _id: examSetId,
    ownerId: ownerId,
    isDeleted: false,
  });

  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại hoặc bạn không có quyền sửa");
    error.status = 404;
    throw error;
  }

  // Cannot update published exam sets
  if (examSet.status === "published") {
    const error = new Error("Không thể sửa bộ đề thi đã xuất bản");
    error.status = 403;
    throw error;
  }

  // Allowed fields to update
  const allowedFields = ["title", "description", "tags", "folderId"];
  const updateFields = {};

  for (const field of allowedFields) {
    if (field in updateData && updateData[field] !== undefined) {
      updateFields[field] = updateData[field];
    }
  }

  // If updating folderId, verify new folder exists and belongs to owner
  if (updateFields.folderId) {
    const newFolder = await Folder.findOne({
      _id: updateFields.folderId,
      ownerId: ownerId,
      isDeleted: false,
    });

    if (!newFolder) {
      const error = new Error("Folder không tồn tại hoặc bạn không có quyền truy cập");
      error.status = 404;
      throw error;
    }
  }

  // Normalize string fields
  if (updateFields.title) {
    updateFields.title = updateFields.title.trim();
  }

  if (updateFields.description) {
    updateFields.description = updateFields.description.trim();
  }

  // Update exam set
  const updatedExamSet = await ExamSet.findByIdAndUpdate(examSetId, updateFields, {
    new: true,
    runValidators: true,
  }).populate("folderId", "name").populate("ownerId", "fullName email");

  return updatedExamSet;
};

/**
 * Delete exam set (soft delete)
 * @param {string} examSetId - Exam set ID
 * @param {string} ownerId - Current user ID (from JWT)
 * @returns {Object} Deleted exam set
 */
export const deleteExamSetService = async (examSetId, ownerId) => {
  // Find exam set and verify ownership
  const examSet = await ExamSet.findOne({
    _id: examSetId,
    ownerId: ownerId,
    isDeleted: false,
  });

  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại hoặc bạn không có quyền xóa");
    error.status = 404;
    throw error;
  }

  // Soft delete: mark isDeleted = true
  examSet.isDeleted = true;
  await examSet.save();

  return examSet;
};

/**
 * Restore exam set (undo soft delete)
 * @param {string} examSetId - Exam set ID
 * @param {string} ownerId - Current user ID (from JWT)
 * @returns {Object} Restored exam set
 */
export const restoreExamSetService = async (examSetId, ownerId) => {
  // Find deleted exam set and verify ownership
  const examSet = await ExamSet.findOne({
    _id: examSetId,
    ownerId: ownerId,
    isDeleted: true,
  }).withDeleted(); // Include soft deleted docs

  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại hoặc bạn không có quyền khôi phục");
    error.status = 404;
    throw error;
  }

  // Restore: mark isDeleted = false
  examSet.isDeleted = false;
  await examSet.save();

  return examSet;
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

  // Check if exam set is published (cannot add questions to published exams)
  if (examSet.status === "published") {
    const error = new Error("Không thể thêm câu hỏi vào bộ đề thi đã công bố");
    error.status = 403;
    throw error;
  }

  // Check if question ID already exists
  const questionExists = examSet.questions.some(q => q.questionId === questionData.questionId);
  if (questionExists) {
    const error = new Error("questionId đã tồn tại trong bộ đề thi này");
    error.status = 400;
    throw error;
  }

  // Validate question type
  const validTypes = ["multiple_choice", "true_false", "short_answer", "essay"];
  if (!validTypes.includes(questionData.type)) {
    const error = new Error("Loại câu hỏi không hợp lệ");
    error.status = 400;
    throw error;
  }

  // Type-specific validation
  if (questionData.type === "multiple_choice") {
    if (!questionData.options || !Array.isArray(questionData.options) || questionData.options.length < 2) {
      const error = new Error("Câu hỏi trắc nghiệm phải có ít nhất 2 lựa chọn");
      error.status = 400;
      throw error;
    }

    const hasCorrectAnswer = questionData.options.some(opt => opt.isCorrect === true);
    if (!hasCorrectAnswer) {
      const error = new Error("Phải có ít nhất 1 đáp án đúng");
      error.status = 400;
      throw error;
    }
  } else if (questionData.type === "true_false") {
    if (!questionData.options || !Array.isArray(questionData.options) || questionData.options.length !== 2) {
      const error = new Error("Câu hỏi Đúng/Sai phải có đúng 2 lựa chọn");
      error.status = 400;
      throw error;
    }

    const hasCorrectAnswer = questionData.options.some(opt => opt.isCorrect === true);
    if (!hasCorrectAnswer) {
      const error = new Error("Phải có 1 đáp án đúng");
      error.status = 400;
      throw error;
    }
  } else if (questionData.type === "short_answer") {
    if (!questionData.correctAnswer) {
      const error = new Error("Câu hỏi trả lời ngắn phải có câu trả lời đúng");
      error.status = 400;
      throw error;
    }
  }

  // Prepare new question object
  const newQuestion = {
    questionId: questionData.questionId.trim(),
    order: questionData.order !== undefined ? questionData.order : examSet.questions.length,
    type: questionData.type,
    content: questionData.content.trim(),
    imageUrl: questionData.imageUrl || null,
    hint: questionData.hint ? questionData.hint.trim() : "",
    points: questionData.points || 1,
    difficulty: questionData.difficulty || "medium",
    options: questionData.options || [],
    correctAnswer: questionData.correctAnswer || "",
    acceptedAnswers: questionData.acceptedAnswers || [],
    caseSensitive: questionData.caseSensitive || false,
    explanation: questionData.explanation ? questionData.explanation.trim() : "",
    feedbackCorrect: questionData.feedbackCorrect || "Chính xác!",
    feedbackIncorrect: questionData.feedbackIncorrect || "Sai rồi!",
    category: questionData.category ? questionData.category.trim() : "",
    tags: questionData.tags || [],
    isActive: questionData.isActive !== undefined ? questionData.isActive : true,
    timeLimit: questionData.timeLimit || null,
  };

  // Add question to array
  examSet.questions.push(newQuestion);

  // Auto-update questionCount (will be done by pre-save middleware)
  // Save exam set
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
export const updateQuestionInExamSetService = async (examSetId, ownerId, questionId, updateData) => {
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
  const questionIndex = examSet.questions.findIndex(q => q.questionId === questionId);
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
  ];

  // Update fields if provided
  for (const field of allowedFields) {
    if (field in updateData && updateData[field] !== undefined) {
      if (field === "content" || field === "hint" || field === "explanation" || field === "category") {
        // Trim string fields
        question[field] = typeof updateData[field] === "string" ? updateData[field].trim() : updateData[field];
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

    const hasCorrectAnswer = question.options.some(opt => opt.isCorrect === true);
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

    const hasCorrectAnswer = question.options.some(opt => opt.isCorrect === true);
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
export const reorderQuestionsInExamSetService = async (examSetId, ownerId, reorderItems) => {
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

    if (order === undefined || order === null || typeof order !== "number" || !Number.isInteger(order) || order < 0) {
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
    ownerId: ownerId,
    isDeleted: false,
  });

  if (!examSet) {
    const error = new Error("Bộ đề thi không tồn tại hoặc bạn không có quyền truy cập");
    error.status = 404;
    throw error;
  }

  if (examSet.status === "published") {
    const error = new Error("Không thể reorder câu hỏi khi bộ đề thi đang ở trạng thái Published");
    error.status = 403;
    throw error;
  }

  const existingQuestionIds = new Set(examSet.questions.map(q => q.questionId));
  for (const { questionId } of normalizedItems) {
    if (!existingQuestionIds.has(questionId)) {
      const error = new Error(`Câu hỏi ${questionId} không tồn tại trong bộ đề thi`);
      error.status = 404;
      throw error;
    }
  }

  // Update orders on matching questions
  examSet.questions = examSet.questions.map(question => {
    const reorderItem = normalizedItems.find(item => item.questionId === question.questionId);
    if (reorderItem) {
      question.order = reorderItem.order;
    }
    return question;
  });

  // Sort the questions array by order ascending
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
export const deleteQuestionFromExamSetService = async (examSetId, currentUserId, currentUserRole, questionId) => {
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

  const questionIndex = examSet.questions.findIndex(q => q.questionId === normalizedQuestionId);
  if (questionIndex === -1) {
    const error = new Error("Câu hỏi không tồn tại trong bộ đề thi");
    error.status = 404;
    throw error;
  }

  examSet.questions.splice(questionIndex, 1);

  const updatedExamSet = await examSet.save();
  return updatedExamSet.populate("folderId", "name").populate("ownerId", "fullName email");
};
