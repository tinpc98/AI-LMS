import examService from "../services/exam.service.js";

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
    });

    res.status(201).json({
      message: "Tạo đề thành công!",
      data: newExam,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
