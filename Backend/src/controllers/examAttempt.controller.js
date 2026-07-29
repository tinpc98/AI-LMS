import mongoose from "mongoose";
import examAttemptService from "../services/examAttempt.service.js";
import ExamAttempt from "../models/examAttempt.model.js";
import Question from "../models/question.model.js";

// =======================================================
// 1. API CHO HỌC SINH: Bắt đầu làm bài thi
// =======================================================
export const startExam = async (req, res) => {
  try {
    const { examId, studentId: bodyStudentId } = req.body;

    const studentId = req.user?.id || req.user?._id || bodyStudentId;

    if (!examId || !studentId || !mongoose.Types.ObjectId.isValid(examId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({
        success: false,
        message: "Lỗi hệ thống: ID kỳ thi không hợp lệ!",
      });
    }

    if (req.user.role !== "student") {
      return res.status(403).json({ success: false, message: "Chỉ học sinh mới được phép làm bài thi!" });
    }

    const exam = await Exam.findOne({ _id: examId, isDeleted: false }).lean();
    if (!exam) {
      return res.status(404).json({ success: false, message: "Kỳ thi không tồn tại hoặc đã bị xóa!" });
    }

    if (exam.status !== "PUBLISHED") {
      return res.status(403).json({ success: false, message: "Kỳ thi chưa được mở hoặc đã kết thúc!" });
    }

    // Check Class enrollment
    const classInfo = await mongoose.model("Class").findOne({
      _id: exam.classId,
      isDeleted: false,
      "students.studentId": studentId,
      "students.status": "Enrolled",
    });

    if (!classInfo) {
      return res.status(403).json({ success: false, message: "Bạn không thuộc danh sách lớp thi này!" });
    }

    // Check time constraints (optional rule based on startTime)
    if (exam.startTime && new Date() < new Date(exam.startTime)) {
      return res.status(403).json({ success: false, message: "Kỳ thi chưa tới giờ bắt đầu!" });
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

    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({ success: false, message: "ID bài thi không hợp lệ!" });
    }

    const attempt = await ExamAttempt.findById(attemptId).lean();

    if (!attempt) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phiên làm bài thi!" });
    }

    // WA IDOR: Học sinh chỉ được phép xem lượt thi của chính mình
    if (userRole === "student" && attempt.studentId?.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xem lượt thi của người khác!" });
    }

    if (attempt.studentId.toString() !== userId.toString() && req.user.role === "student") {
      return res.status(404).json({ success: false, message: "Không tìm thấy phiên làm bài thi!" });
    }

    const exam = await mongoose.model("Exam").findById(attempt.examId).lean();
    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Đề thi của lượt làm bài này đã bị xóa!",
      });
    }

    // Resolve questions using common utility
    const { resolveExamQuestions } = await import("../utils/examQuestionResolver.js");
    const questionMap = await resolveExamQuestions(exam);

    const formattedQuestions = [];
    for (const q of exam.questions) {
      const qIdStr = q.questionId.toString();
      const details = questionMap.get(qIdStr);
      if (!details) continue;

      formattedQuestions.push({
        _id: details.questionId,
        type: details.type,
        content: details.content,
        options: details.options?.map(opt => {
          const safeOpt = { ...opt };
          delete safeOpt.isCorrect;
          return safeOpt;
        }) || [],
        points: details.points,
      });
    }

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
      userId
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
    const userId = req.user?.id || req.user?._id;

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

    const validAnswers = (attempt.answers || []).filter((ans) => ans && ans.questionId);

    const reviewData = {
      attemptId: attempt._id,
      student: attempt.studentId,
      examInfo: {
        title: exam.title,
        topic: exam.topic,
        duration: exam.duration,
      },
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

    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({ success: false, message: "ID phiên làm bài không hợp lệ!" });
    }

    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy phiên làm bài!" });
    }

    attempt.cheatWarnings = (attempt.cheatWarnings || 0) + 1;
    
    // Log if valid enum
    const validCheatTypes = ["switch_tab", "lose_focus", "multiple_faces", "no_face", "unauthorized_device", "suspicious_audio"];
    const typeToLog = validCheatTypes.includes(cheatType) ? cheatType : "switch_tab";
    
    attempt.cheatLogs.push({
      timestamp: new Date(),
      cheatType: typeToLog
    });

    await attempt.save();

    console.log(
      `🚨 Đã ghi nhận gian lận (${typeToLog}) cho attempt ${attemptId}. Tổng số lần: ${attempt.cheatWarnings}`,
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
