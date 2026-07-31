import { matchedData } from "express-validator";
import questionService from "./question.service.js";
import Question from "./question.model.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

// Wave 4.4: gỡ 5 khối try/catch ép cứng 500.
//
// Khuôn cũ `catch (error) { res.status(500).json({ message: error.message }) }` có hai
// hệ quả xấu ở file này:
//   1. Lỗi DO NGƯỜI DÙNG GÂY RA bị báo là lỗi server. Cụ thể: tải lên file Excel rỗng
//      hoặc sai định dạng trả 500, đúng ra phải là 400. Đã sửa ở tầng service bằng cách
//      ném ValidationError thay vì Error trần.
//   2. Rò rỉ error.message thô ra client kể cả ở production.
//
// Các phản hồi 400/404 dưới đây giữ NGUYÊN — chúng là return tường minh, không phải
// exception.

// upload file excel bộ câu hỏi lên db
export const uploadExcelQuestions = asyncHandler(async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "Vui lòng chọn file Excel để tải lên!" });
  }

  // Truyền buffer của file sang tầng Service xử lý
  const importedQuestions = await questionService.importQuestionsFromExcel(req.file.buffer);

  res.status(201).json({
    message: `Nhập thành công ${importedQuestions.length} câu hỏi vào hệ thống!`,
    data: importedQuestions,
  });
});

//===================================================================
// Xem toàn bộ và lọc câu hỏi
export const getQuestions = asyncHandler(async (req, res) => {
  const { topic, type, difficulty } = req.query;
  let queryFilter = {};

  // Nếu Frontend truyền tham số nào lên thì lọc theo tham số đó
  if (topic) queryFilter.topic = topic;
  if (type) queryFilter.type = type;
  if (difficulty) queryFilter.difficulty = difficulty;

  // Sắp xếp câu mới tạo lên đầu (createdAt: -1)
  const questions = await Question.find(queryFilter).sort({ createdAt: -1 }).lean();

  res.status(200).json({
    total: questions.length,
    data: questions,
  });
});

//===================================================================
// Thêm câu hỏi và chống trùng lặm câu hỏi
export const createQuestion = asyncHandler(async (req, res) => {
  const { content, type, options, correctAnswer, difficulty, topic } = req.body;

  // BẪY CHỐNG TRÙNG: Tìm xem đã có câu nào nội dung y hệt chưa (Loại bỏ khoảng trắng thừa)
  const existingQ = await Question.findOne({ content: content.trim() });

  if (existingQ) {
    return res.status(400).json({
      message: "Câu hỏi này đã tồn tại trong Ngân hàng đề thi!",
      duplicateId: existingQ._id,
    });
  }

  const newQuestion = new Question({
    content: content.trim(),
    type,
    options,
    correctAnswer,
    difficulty,
    topic,
  });

  await newQuestion.save();
  res.status(201).json({ message: "Thêm câu hỏi thành công!", data: newQuestion });
});

//===================================================================
// Sửa câu hỏi
export const updateQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  // matchedData() chỉ lấy các trường đã khai báo trong updateQuestionValidation,
  // cố tình loại trừ createdBy để tránh giáo viên khác chiếm quyền tác giả câu hỏi.
  const updateData = matchedData(req, { onlyValidData: true });

  // Nâng cao: Nếu sửa nội dung, lại phải check xem nội dung mới có trùng với câu khác không
  if (updateData.content) {
    const existingQ = await Question.findOne({
      content: updateData.content.trim(),
      _id: { $ne: id }, // Loại trừ chính nó ra
    });
    if (existingQ) return res.status(400).json({ message: "Nội dung sửa bị trùng với câu khác!" });
  }

  const updatedQ = await Question.findByIdAndUpdate(id, updateData, {
    new: true,
  });
  if (!updatedQ) return res.status(404).json({ message: "Không tìm thấy câu hỏi!" });

  res.status(200).json({ message: "Cập nhật thành công!", data: updatedQ });
});

//===================================================================
// Xóa câu hỏi
export const deleteQuestion = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id || req.user?._id;
  const deletedQ = await Question.softDelete(id, userId);

  if (!deletedQ) return res.status(404).json({ message: "Không tìm thấy câu hỏi!" });

  res.status(200).json({ message: "Đã xóa câu hỏi khỏi Ngân hàng đề!" });
});
