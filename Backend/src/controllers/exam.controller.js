import examService from "../services/exam.service.js";
import Exam from "../models/exam.model.js";
import classModel from "../models/class.model.js";

// 1. Tạo đề thi tự động bằng AI / Ma trận câu hỏi
export const autoGenerateExam = async (req, res) => {
  try {
    const {
      title,
      duration,
      topic,
      mcqCount,
      mcqPoints,
      essayCount,
      essayPoints,
      startTime,
      classId,
      aiPromptUsed,
    } = req.body;

    if (!topic || (!mcqCount && !essayCount)) {
      return res.status(400).json({ message: "Thiếu thông số sinh đề thi!" });
    }

    const newExam = await examService.generateExamWithMatrix({
      title,
      duration,
      topic,
      mcqCount,
      mcqPoints,
      essayCount,
      essayPoints,
      startTime,
      classId,
    });

    if (newExam) {
      newExam.createdBy = req.user.id;
      newExam.isAIGenerated = true;
      newExam.aiPromptUsed = aiPromptUsed || `Sinh đề thi tự động chủ đề ${topic}`;
      await newExam.save();
    }

    res.status(201).json({
      message: "Tạo đề thi tự động thành công!",
      data: newExam,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống khi sinh đề thi. Vui lòng thử lại sau.", error: error.message });
  }
};

// 2. Tạo đề thi thủ công
export const createExam = async (req, res) => {
  try {
    const { title, duration, questions, startTime, classId, maxScore, status } = req.body;

    if (!title || !duration || !startTime || !classId || !Array.isArray(questions)) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc để tạo đề thi" });
    }

    const newExam = new Exam({
      title,
      duration,
      questions,
      startTime,
      classId,
      createdBy: req.user.id,
      maxScore: maxScore || 10,
      status: status || "PUBLISHED",
      isAIGenerated: false,
    });

    await newExam.save();
    return res.status(201).json({ message: "Tạo đề thi thành công!", data: newExam });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Lỗi khi tạo đề thi" });
  }
};

// 3. Cập nhật đề thi
export const updateExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: "Đề thi không tồn tại!" });
    }

    if (req.user.role !== "Admin" && exam.createdBy?.toString() !== req.user.id) {
      return res.status(403).json({ message: "Bạn không có quyền chỉnh sửa đề thi này!" });
    }

    Object.assign(exam, req.body);
    await exam.save();

    return res.status(200).json({ message: "Cập nhật đề thi thành công!", data: exam });
  } catch (error) {
    return res.status(400).json({ message: error.message || "Lỗi khi cập nhật đề thi" });
  }
};

// 4. Xóa đề thi
export const deleteExam = async (req, res) => {
  try {
    const { id } = req.params;
    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: "Đề thi không tồn tại!" });
    }

    const userId = (req.user._id || req.user.id || "").toString();
    const userRole = (req.user.role || "").toLowerCase();

    // Lấy thông tin lớp học để kiểm tra xem Giáo viên hiện tại có phải giảng viên phụ trách lớp không
    const targetClass = await classModel.findById(exam.classId);
    const classTeacherId = (targetClass?.teacherId?._id || targetClass?.teacherId || "").toString();

    const isCreator = exam.createdBy && exam.createdBy.toString() === userId;
    const isClassTeacher = classTeacherId && classTeacherId === userId;

    if (userRole !== "admin" && !isCreator && !isClassTeacher) {
      return res.status(403).json({ message: "Bạn không có quyền xóa đề thi này!" });
    }

    await Exam.findByIdAndDelete(id);
    return res.status(200).json({ message: "Xóa đề thi thành công!" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi hệ thống khi xóa đề thi." });
  }
};

// 5. Lấy danh sách đề thi theo Lớp
export const getExamsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    const exams = await Exam.find({ classId: classId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: exams,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống khi lấy danh sách đề thi." });
  }
};

// 6. Lấy tất cả đề thi
export const getAllExams = async (req, res) => {
  try {
    const exams = await Exam.find().sort({ createdAt: -1 });

    const now = new Date().getTime();
    let updatedExams = [];

    for (let exam of exams) {
      const startTime = new Date(exam.startTime).getTime();
      const endTime = startTime + exam.duration * 60000;

      if (now > endTime && exam.status !== "COMPLETED") {
        exam.status = "COMPLETED";
        await exam.save();
      }

      updatedExams.push(exam);
    }

    res.status(200).json({
      success: true,
      data: updatedExams,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống khi tải danh sách đề thi." });
  }
};

// 7. Lấy chi tiết đề thi theo ID
export const getExamById = async (req, res) => {
  try {
    const examId = req.params.id;
    const exam = await Exam.findById(examId).populate("questions.questionId").lean();

    if (!exam) {
      return res.status(404).json({ message: "Không tìm thấy kỳ thi!" });
    }

    res.status(200).json({ data: exam });
  } catch (error) {
    res.status(500).json({ message: "Lỗi hệ thống khi tải chi tiết đề thi." });
  }
};
