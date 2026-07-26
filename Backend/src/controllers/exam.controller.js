import mongoose from "mongoose";
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

    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: "ID lớp học không hợp lệ!" });
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
      newExam.createdBy = req.user.id || req.user._id;
      newExam.isAIGenerated = true;
      newExam.aiPromptUsed = aiPromptUsed || `Sinh đề thi tự động chủ đề ${topic}`;
      await newExam.save();
    }

    return res.status(201).json({
      message: "Tạo đề thi tự động thành công!",
      data: newExam,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Lỗi hệ thống khi sinh đề thi." });
  }
};

// 2. Tạo đề thi thủ công
export const createExam = async (req, res) => {
  try {
    const { title, duration, questions, startTime, classId, maxScore, status } = req.body;

    if (!title || !duration || !startTime || !classId || !Array.isArray(questions)) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc để tạo đề thi" });
    }

    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({ message: "ID lớp học không hợp lệ!" });
    }

    // Chuẩn hóa phân bổ điểm câu hỏi đảm bảo tổng = 10
    let formattedQuestions = questions.map((q) => {
      if (typeof q === "string" || q instanceof mongoose.Types.ObjectId) {
        return { questionId: q, points: 0 };
      }
      return {
        questionId: q.questionId || q._id,
        points: Number(q.points) || 0,
      };
    });

    const totalPoints = formattedQuestions.reduce((sum, q) => sum + (q.points || 0), 0);

    // Nếu tổng điểm khác 10 hoặc chưa được gán điểm, tự động phân bổ đều điểm 10 cho các câu
    if (parseFloat(totalPoints.toFixed(2)) !== 10 && formattedQuestions.length > 0) {
      const count = formattedQuestions.length;
      const basePoint = Math.floor((10 / count) * 100) / 100;
      const remainder = 10 - basePoint * (count - 1);

      formattedQuestions = formattedQuestions.map((q, idx) => ({
        ...q,
        points: idx === count - 1 ? Number(remainder.toFixed(2)) : basePoint,
      }));
    }

    const newExam = new Exam({
      title,
      duration: Number(duration),
      questions: formattedQuestions,
      startTime: new Date(startTime),
      classId,
      createdBy: req.user.id || req.user._id,
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
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đề thi không hợp lệ!" });
    }

    const exam = await Exam.findById(id);
    if (!exam) {
      return res.status(404).json({ message: "Đề thi không tồn tại!" });
    }

    const userId = (req.user.id || req.user._id).toString();
    const userRole = (req.user.role || "").toLowerCase();

    if (userRole !== "admin" && exam.createdBy?.toString() !== userId) {
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
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "ID đề thi không hợp lệ!" });
    }

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
    return res.status(500).json({ message: error.message || "Lỗi hệ thống khi xóa đề thi." });
  }
};

// 5. Lấy danh sách đề thi theo Lớp
export const getExamsByClass = async (req, res) => {
  try {
    const { classId } = req.params;
    if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(200).json({ success: true, data: [] });
    }

    const exams = await Exam.find({ classId: classId }).sort({ createdAt: -1 }).lean();

    return res.status(200).json({
      success: true,
      data: exams,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Lỗi hệ thống khi lấy danh sách đề thi." });
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

    return res.status(200).json({
      success: true,
      data: updatedExams,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Lỗi hệ thống khi tải danh sách đề thi." });
  }
};

// 7. Lấy chi tiết đề thi theo ID
export const getExamById = async (req, res) => {
  try {
    const examId = req.params.id;
    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(404).json({ message: "Kỳ thi không tồn tại hoặc ID không hợp lệ!" });
    }

    const exam = await Exam.findById(examId).populate("questions.questionId").lean();

    if (!exam) {
      return res.status(404).json({ message: "Không tìm thấy kỳ thi!" });
    }

    return res.status(200).json({ data: exam });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Lỗi hệ thống khi tải chi tiết đề thi." });
  }
};
