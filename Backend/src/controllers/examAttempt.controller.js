import examAttemptService from "../services/examAttempt.service.js";
import ExamAttempt from "../models/examAttempt.model.js";

export const submitExam = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { answers } = req.body; // Mảng chứa [{ questionId, selectedOption, essayText }]

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Dữ liệu bài làm không hợp lệ!" });
    }

    // Gọi dịch vụ chấm bài
    const gradedAttempt = await examAttemptService.gradeSubmission(
      attemptId,
      answers,
    );

    res.status(200).json({
      message:
        gradedAttempt.status === "GRADED"
          ? "Nộp bài thành công! Hệ thống đã chấm xong trắc nghiệm."
          : "Nộp bài thành công! Đang chờ giáo viên chấm phần tự luận.",
      data: gradedAttempt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const startExam = async (req, res) => {
  try {
    const { examId, studentId } = req.body;
    const newAttempt = new ExamAttempt({
      examId,
      studentId,
      status: "IN_PROGRESS",
      startTime: new Date(),
    });

    await newAttempt.save();

    res.status(201).json({
      message: "Bắt đầu tính giờ làm bài!",
      data: newAttempt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Controller tiếp nhận yêu cầu chấm tự luận
export const gradeEssaySubmit = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { essayGrades } = req.body;

    if (!essayGrades || !Array.isArray(essayGrades)) {
      return res
        .status(400)
        .json({ message: "Dữ liệu chấm điểm không hợp lệ!" });
    }

    const updatedAttempt = await examAttemptService.gradeEssay(
      attemptId,
      essayGrades,
    );

    res.status(200).json({
      message: "Chấm điểm tự luận thành công! Đã chốt điểm bài thi.",
      data: updatedAttempt,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
