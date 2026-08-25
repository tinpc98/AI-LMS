import { matchedData } from "express-validator";
import questionService from "./question.service.js";
import Question from "./question.model.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

// upload file excel bộ câu hỏi lên db
export const uploadExcelQuestions = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Vui lòng chọn file Excel để tải lên!" });
  }

  const importedQuestions = await questionService.importQuestionsFromExcel(req.file.buffer);

  res.status(201).json({
    message: `Nhập thành công ${importedQuestions.length} câu hỏi vào hệ thống!`,
    data: importedQuestions,
  });
});

// Xem toàn bộ và lọc câu hỏi
export const getQuestions = asyncHandler(async (req, res) => {
  const { topicId, type, difficulty, status, page, limit } = req.query;
  let queryFilter = {};

  if (topicId) queryFilter.topicId = topicId;
  if (type) queryFilter.type = type;
  if (difficulty) queryFilter.difficulty = difficulty;
  if (status) queryFilter.status = status;

  const pageNumber = page ? Number(page) : 1;
  const limitNumber = limit ? Number(limit) : 20;
  const skip = (pageNumber - 1) * limitNumber;

  const [questions, total] = await Promise.all([
    Question.find(queryFilter)
      .populate('topicId', 'name courseId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean(),
    Question.countDocuments(queryFilter)
  ]);

  res.status(200).json({
    pagination: {
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber)
    },
    data: questions,
  });
});

// Lấy 1 câu hỏi
export const getQuestionById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const question = await Question.findById(id).populate('topicId', 'name courseId').lean();
  
  if (!question) {
    return res.status(404).json({ message: "Không tìm thấy câu hỏi!" });
  }
  
  res.status(200).json({ data: question });
});

// Thêm câu hỏi
export const createQuestion = asyncHandler(async (req, res) => {
  const data = matchedData(req, { onlyValidData: true });

  // Add createdBy from auth user
  data.createdBy = req.user?.id || req.user?._id;

  const newQuestion = new Question(data);
  await newQuestion.save();
  
  res.status(201).json({ message: "Thêm câu hỏi thành công!", data: newQuestion });
});

// Sửa câu hỏi
export const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = matchedData(req, { onlyValidData: true });
  const userId = req.user?.id || req.user?._id;
  const role = (req.user?.role || "").toLowerCase();

  const question = await Question.findById(id);
  if (!question) return res.status(404).json({ message: "Không tìm thấy câu hỏi!" });

  if (role !== "admin" && question.createdBy?.toString() !== userId.toString()) {
    return res.status(403).json({ message: "Quyền truy cập bị từ chối. Bạn chỉ có thể sửa câu hỏi do mình tạo." });
  }

  const updatedQ = await Question.findByIdAndUpdate(id, updateData, {
    new: true,
  });
  
  res.status(200).json({ message: "Cập nhật thành công!", data: updatedQ });
});

// Xóa câu hỏi
export const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || req.user?._id;
  const role = (req.user?.role || "").toLowerCase();

  const question = await Question.findById(id);
  if (!question) return res.status(404).json({ message: "Không tìm thấy câu hỏi!" });

  if (role !== "admin" && question.createdBy?.toString() !== userId.toString()) {
    return res.status(403).json({ message: "Quyền truy cập bị từ chối. Bạn chỉ có thể xóa câu hỏi do mình tạo." });
  }

  await Question.softDelete(id, userId);

  res.status(200).json({ message: "Đã xóa câu hỏi khỏi Ngân hàng đề!" });
});
