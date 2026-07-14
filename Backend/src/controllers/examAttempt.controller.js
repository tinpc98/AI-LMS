import examAttemptService from "../services/examAttempt.service.js";
import ExamAttempt from "../models/examAttempt.model.js";
import Question from "../models/question.model.js";

// Hàm nộp bài thi
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

// Hàm bắt đầu làm bài thi
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

// API: Lấy chi tiết bài làm dành cho Giáo viên xem và chấm điểm
export const getAttemptForReview = async (req, res) => {
  try {
    const attemptId = req.params.id;

    // 1. Tìm bài làm, "móc nối" (populate) lấy tên học sinh và tên Đề thi
    const attempt = await ExamAttempt.findById(attemptId)
      .populate("studentId", "fullName email")
      .populate("examId", "title topic duration")
      .lean(); // Dùng lean() để trả về plain JS object giúp query nhanh hơn

    if (!attempt) {
      return res.status(404).json({ message: "Không tìm thấy bài làm!" });
    }

    // 2. Lấy nội dung gốc của các câu hỏi (để GV biết học sinh đang trả lời cái gì)
    const questionIds = attempt.answers.map((ans) => ans.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } }).lean();

    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    // 3. Lắp ráp data hoàn chỉnh trả về cho Frontend
    const reviewData = {
      attemptId: attempt._id,
      student: attempt.studentId,
      examInfo: attempt.examId,
      status: attempt.status,
      totalScore: attempt.totalScore,
      submittedAt: attempt.endTime,
      answersDetail: attempt.answers.map((ans) => {
        const qInfo = questionMap.get(ans.questionId.toString());
        return {
          questionId: ans.questionId,
          type: qInfo?.type,
          questionContent: qInfo?.content, // Nội dung câu hỏi (VD: "Write a short dialogue...")
          studentAnswer: ans.essayText || ans.selectedOption, // Câu trả lời của HS
          correctAnswer: qInfo?.correctAnswer, // Đáp án chuẩn (để GV tham khảo)
          pointsEarned: ans.pointsEarned,
        };
      }),
    };

    res.status(200).json({ data: reviewData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
