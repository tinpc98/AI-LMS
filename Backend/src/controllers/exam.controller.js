import examService from "../services/exam.service.js";
import Exam from "../models/exam.model.js";

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
    } = req.body;

    // Validate cơ bản
    if (!topic || (!mcqCount && !essayCount)) {
      return res.status(400).json({ message: "Thiếu thông số sinh đề thi!" });
    }

    // Giao phó toàn bộ nghiệp vụ nặng cho tầng Service
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

    res.status(201).json({
      message: "Tạo đề thành công!",
      data: newExam,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getExamsByClass = async (req, res) => {
  try {
    const { classId } = req.params;

    // Tìm các đề thi thuộc về classId này (có thể thêm điều kiện status: "PUBLISHED" nếu muốn)
    const exams = await Exam.find({ classId: classId });

    res.status(200).json({
      success: true,
      data: exams,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
export const getAllExams = async (req, res) => {
  try {
    // Kéo toàn bộ đề thi, sắp xếp mới nhất lên đầu
    const exams = await Exam.find().sort({ createdAt: -1 });

    const now = new Date().getTime();
    let updatedExams = [];

    for (let exam of exams) {
      const startTime = new Date(exam.startTime).getTime();
      const endTime = startTime + exam.duration * 60000; // duration (phút) -> milliseconds

      // LOGIC TỰ ĐỘNG CHUYỂN TRẠNG THÁI: Nếu quá giờ và chưa bị đánh dấu COMPLETED
      if (now > endTime && exam.status !== "COMPLETED") {
        exam.status = "COMPLETED";
        await exam.save(); // Cập nhật thẳng xuống DB chặn học sinh vào thi
      }

      updatedExams.push(exam);
    }

    res.status(200).json({
      success: true,
      data: updatedExams,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
export const getExamById = async (req, res) => {
  try {
    const examId = req.params.id;

    // Tìm kỳ thi trong Database
    const exam = await Exam.findById(examId).lean();

    if (!exam) {
      return res.status(404).json({ message: "Không tìm thấy kỳ thi!" });
    }

    res.status(200).json({ data: exam });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
