import mongoose from "mongoose";
import examAttemptService from "../services/examAttempt.service.js";
import ExamAttempt from "../models/examAttempt.model.js";
import Question from "../models/question.model.js";
import Exam from "../models/exam.model.js";
import { checkClassTeacherOwnership } from "../middlewares/auth.middlewares.js";

// =======================================================
// 1. API CHO HỌC SINH: Bắt đầu làm bài thi
// =======================================================
export const startExam = async (req, res) => {
  try {
    const { examId } = req.body;
    // Bắt buộc lấy studentId từ token của người dùng đăng nhập
    const studentId = (req.user?.id || req.user?._id)?.toString();
    const userRole = (req.user?.role || "").toLowerCase();

    if (!examId || !studentId || !mongoose.Types.ObjectId.isValid(examId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: `Lỗi hệ thống: ID kỳ thi (${examId || "Thiếu"}) - ID học sinh (${studentId || "Thiếu"}) không hợp lệ!`,
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Kỳ thi không tồn tại!" });
    }

    // === BƯỚC 1: KIỂM TRA LỊCH SỬ LÀM BÀI ===
    const existingAttempt = await ExamAttempt.findOne({
      examId: examId,
      studentId: studentId,
    });

    if (existingAttempt) {
      console.log(
        `🔎 Đã có bài làm với trạng thái: ${existingAttempt.status}. Exam: ${examId}, Student: ${studentId}`,
      );

      const completedStatuses = ["SUBMITTED", "PARTIALLY_GRADED", "GRADED"];
      if (completedStatuses.includes(existingAttempt.status)) {
        console.log(
          `🚫 Bị chặn! Học sinh không thể làm lại vì trạng thái là ${existingAttempt.status}.`,
        );
        return res.status(400).json({
          success: false,
          message:
            "Bạn đã hoàn thành bài thi này. Hệ thống không cho phép làm lại bài cũ!",
        });
      }

      // Cho phép resume nếu đang làm dở
      if (existingAttempt.status === "IN_PROGRESS") {
        return res.status(200).json({
          success: true,
          message: "Học sinh đang làm dở, chuyển tiếp vào phòng thi.",
          data: existingAttempt,
        });
      }
    }

    // === BƯỚC 2: TẠO BẢN GHI MỚI NẾU HOÀN TOÀN CHƯA THI ===
    console.log("✅ Học sinh hoàn toàn chưa thi, đang tạo bản ghi thi mới...");
    const newAttempt = new ExamAttempt({
      examId,
      studentId,
      status: "IN_PROGRESS",
      startTime: new Date(),
    });

    await newAttempt.save();

    return res.status(201).json({
      success: true,
      message: "Bắt đầu tính giờ làm bài!",
      data: newAttempt,
    });
  } catch (error) {
    console.error("❌ Lỗi API startExam:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =======================================================
// 2. API CHO HỌC SINH: Lấy chi tiết đề thi ĐANG LÀM
// =======================================================
export const getExamAttemptDetail = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const userId = (req.user?.id || req.user?._id)?.toString();
    const userRole = (req.user?.role || "").toLowerCase();

    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({ success: false, message: "ID bài thi không hợp lệ!" });
    }

    const attempt = await ExamAttempt.findById(attemptId).populate({
      path: "examId",
      populate: {
        path: "questions.questionId",
        select: "-correctAnswer",
      },
    });

    if (!attempt) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phiên làm bài thi!" });
    }

    // WA IDOR: Học sinh chỉ được phép xem lượt thi của chính mình
    if (userRole === "student" && attempt.studentId?.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem lượt thi của người khác!" });
    }

    const exam = attempt.examId;
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Đề thi của lượt làm bài này đã bị xóa!",
      });
    }

    // Lắp ráp dữ liệu thành mảng questions phẳng để Frontend dễ render
    const formattedQuestions = (exam.questions || [])
      .map((q) => {
        const details = q.questionId;
        if (!details) return null;

        return {
          _id: details._id,
          type: details.type,
          content: details.content,
          options: details.options,
          points: q.points,
        };
      })
      .filter((q) => q !== null);

    return res.status(200).json({
      success: true,
      data: {
        _id: attempt._id,
        status: attempt.status,
        examInfo: {
          title: exam.title,
          duration: exam.duration,
          startTime: exam.startTime,
        },
        questions: formattedQuestions,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết bài thi:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =======================================================
// 3. API CHO HỌC SINH: Nộp bài thi
// =======================================================
export const submitExam = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { answers } = req.body;
    const userId = (req.user?.id || req.user?._id)?.toString();
    const userRole = (req.user?.role || "").toLowerCase();

    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({ message: "ID bài thi không hợp lệ!" });
    }

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ message: "Dữ liệu bài làm không hợp lệ!" });
    }

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res.status(404).json({ message: "Không tìm thấy phiên làm bài thi!" });
    }

    // VÁ IDOR: Học sinh chỉ được nộp lượt thi của chính mình
    if (userRole === "student" && attempt.studentId?.toString() !== userId) {
      return res.status(403).json({ message: "Bạn không có quyền nộp bài thi của người khác!" });
    }

    const gradedAttempt = await examAttemptService.gradeSubmission(
      attemptId,
      answers,
    );

    return res.status(200).json({
      message:
        gradedAttempt.status === "GRADED"
          ? "Nộp bài thành công! Hệ thống đã chấm xong trắc nghiệm."
          : "Nộp bài thành công! Đang chờ giáo viên chấm phần tự luận.",
      data: gradedAttempt,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// =======================================================
// 4. API CHO GIÁO VIÊN: Lấy chi tiết để chấm tự luận/xem lại
// =======================================================
export const getAttemptForReview = async (req, res) => {
  try {
    const attemptId = req.params.id;

    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({ success: false, message: "ID bài thi không hợp lệ!" });
    }

    const attempt = await ExamAttempt.findById(attemptId)
      .populate("studentId", "fullName email studentCode avatar")
      .populate("examId", "title topic duration questions classId")
      .lean();

    if (!attempt) {
      return res.status(404).json({ message: "Không tìm thấy bài làm!" });
    }

    // Ownership Check: Đảm bảo Giáo viên/Admin phụ trách lớp thi đó mới có quyền xem
    if (attempt.examId?.classId) {
      const isAuthorized = await checkClassTeacherOwnership(
        attempt.examId.classId,
        req.user?.id || req.user?._id,
        req.user?.role
      );
      if (!isAuthorized) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền xem lượt thi này!" });
      }
    }

    const validAnswers = (attempt.answers || []).filter((ans) => ans && ans.questionId);
    const questionIds = validAnswers.map((ans) => ans.questionId);
    const questions = await Question.find({ _id: { $in: questionIds } }).lean();
    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    const reviewData = {
      attemptId: attempt._id,
      student: attempt.studentId,
      examInfo: attempt.examId,
      status: attempt.status,
      totalScore: attempt.totalScore,
      submittedAt: attempt.endTime,

      cheatWarnings: attempt.cheatWarnings || 0,

      answersDetail: validAnswers.map((ans) => {
        const qIdStr = ans.questionId.toString();
        const qInfo = questionMap.get(qIdStr);
        const examQuestionConfig = attempt.examId?.questions?.find(
          (eq) => eq.questionId && eq.questionId.toString() === qIdStr,
        );
        const assignedPoints = examQuestionConfig
          ? examQuestionConfig.points
          : qInfo?.points || 1;

        return {
          questionId: ans.questionId,
          type: qInfo?.type,
          questionContent: qInfo?.content,
          options: qInfo?.options,
          studentAnswer: ans.essayText || ans.selectedOption,
          correctAnswer: qInfo?.correctAnswer,
          pointsEarned: ans.pointsEarned,
          maxPoints: assignedPoints,
        };
      }),
    };

    return res.status(200).json({ success: true, data: reviewData });
  } catch (error) {
    console.error("Lỗi lấy chi tiết review:", error);
    return res.status(500).json({ message: error.message });
  }
};

// =======================================================
// 5. API CHO GIÁO VIÊN: Chấm điểm tự luận
// =======================================================
export const gradeEssaySubmit = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { essayGrades } = req.body;

    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({ message: "ID bài thi không hợp lệ!" });
    }

    if (!essayGrades || !Array.isArray(essayGrades)) {
      return res
        .status(400)
        .json({ message: "Dữ liệu chấm điểm không hợp lệ!" });
    }

    const attempt = await ExamAttempt.findById(attemptId).populate("examId");
    if (!attempt) {
      return res.status(404).json({ message: "Không tìm thấy phiên làm bài thi!" });
    }

    if (attempt.examId?.classId) {
      const isAuthorized = await checkClassTeacherOwnership(
        attempt.examId.classId,
        req.user?.id || req.user?._id,
        req.user?.role
      );
      if (!isAuthorized) {
        return res.status(403).json({ message: "Bạn không có quyền chấm bài thi của lớp này!" });
      }
    }

    const updatedAttempt = await examAttemptService.gradeEssay(
      attemptId,
      essayGrades,
    );

    return res.status(200).json({
      message: "Chấm điểm tự luận thành công! Đã chốt điểm bài thi.",
      data: updatedAttempt,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// =======================================================
// 6. Lấy danh sách bài thi theo Exam (Dành cho Giáo viên/Admin)
// =======================================================
export const getAttemptsByExam = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(200).json({
        success: true,
        message: "Lấy danh sách bài thi thành công",
        data: [],
        stats: { total: 0, graded: 0, pending: 0 },
      });
    }

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ success: false, message: "Kỳ thi không tồn tại!" });
    }

    if (exam.classId) {
      const isAuthorized = await checkClassTeacherOwnership(
        exam.classId,
        req.user?.id || req.user?._id,
        req.user?.role
      );
      if (!isAuthorized) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền xem các bài làm của kỳ thi này!" });
      }
    }

    const attempts = await ExamAttempt.find({ examId: examId })
      .populate({
        path: "studentId",
        select: "fullName studentCode avatar",
      })
      .sort({ createdAt: -1 });

    const stats = {
      total: attempts.length,
      graded: attempts.filter((a) => a.status === "GRADED").length,
      pending: attempts.filter((a) => a.status === "SUBMITTED").length,
    };

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách bài thi thành công",
      data: attempts,
      stats: stats,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài thi:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ: " + error.message,
    });
  }
};

export const recordCheatWarning = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const userId = (req.user?.id || req.user?._id)?.toString();

    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({ success: false, message: "ID phiên làm bài không hợp lệ!" });
    }

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phiên làm bài!" });
    }

    if (attempt.studentId?.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền cập nhật phiên làm bài này!" });
    }

    attempt.cheatWarnings = (attempt.cheatWarnings || 0) + 1;
    await attempt.save();

    console.log(
      `🚨 Đã ghi nhận gian lận cho attempt ${attemptId}. Tổng số lần: ${attempt.cheatWarnings}`,
    );

    return res.status(200).json({
      success: true,
      message: "Đã ghi nhận cảnh báo gian lận",
      cheatWarnings: attempt.cheatWarnings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
