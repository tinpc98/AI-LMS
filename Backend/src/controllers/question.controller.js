import questionService from "../services/question.service.js";
import Question from "../models/question.model.js";

// upload file excel bộ câu hỏi lên db
export const uploadExcelQuestions = async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ message: "Vui lòng chọn file Excel để tải lên!" });
    }

    // Truyền buffer của file sang tầng Service xử lý
    const importedQuestions = await questionService.importQuestionsFromExcel(
      req.file.buffer,
    );

    res.status(201).json({
      message: `Nhập thành công ${importedQuestions.length} câu hỏi vào hệ thống!`,
      data: importedQuestions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//===================================================================
// Xem toàn bộ và lọc câu hỏi
export const getQuestions = async (req, res) => {
  try {
    const { topic, type, difficulty } = req.query;
    let queryFilter = {};

    // Nếu Frontend truyền tham số nào lên thì lọc theo tham số đó
    if (topic) queryFilter.topic = topic;
    if (type) queryFilter.type = type;
    if (difficulty) queryFilter.difficulty = difficulty;

    // Sắp xếp câu mới tạo lên đầu (createdAt: -1)
    const questions = await Question.find(queryFilter).sort({ createdAt: -1 });

    res.status(200).json({
      total: questions.length,
      data: questions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//===================================================================
// Thêm câu hỏi và chống trùng lặm câu hỏi
export const createQuestion = async (req, res) => {
  try {
    const { content, type, options, correctAnswer, difficulty, topic } =
      req.body;

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
    res
      .status(201)
      .json({ message: "Thêm câu hỏi thành công!", data: newQuestion });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//===================================================================
// Sửa câu hỏi
export const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Nâng cao: Nếu sửa nội dung, lại phải check xem nội dung mới có trùng với câu khác không
    if (updateData.content) {
      const existingQ = await Question.findOne({
        content: updateData.content.trim(),
        _id: { $ne: id }, // Loại trừ chính nó ra
      });
      if (existingQ)
        return res
          .status(400)
          .json({ message: "Nội dung sửa bị trùng với câu khác!" });
    }

    const updatedQ = await Question.findByIdAndUpdate(id, updateData, {
      new: true,
    });
    if (!updatedQ)
      return res.status(404).json({ message: "Không tìm thấy câu hỏi!" });

    res.status(200).json({ message: "Cập nhật thành công!", data: updatedQ });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//===================================================================
// Xóa câu hỏi
export const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || req.user?._id;
    const deletedQ = await Question.softDelete(id, userId);

    if (!deletedQ)
      return res.status(404).json({ message: "Không tìm thấy câu hỏi!" });

    res.status(200).json({ message: "Đã xóa câu hỏi khỏi Ngân hàng đề!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
