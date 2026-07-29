import mongoose from "mongoose";
import examAttemptService from "../services/examAttempt.service.js";
import ExamAttempt from "../models/examAttempt.model.js";
import Exam from "../models/exam.model.js";

// =======================================================
// 1. API CHO HỌC SINH: Bắt đầu làm bài thi
// =======================================================
export const startExam = async (req, res) => {
  try {
    const { examId, studentId: bodyStudentId } = req.body;
    const studentId = req.user?.id || req.user?._id || bodyStudentId;

    if (
      !examId ||
      !studentId ||
      !mongoose.Types.ObjectId.isValid(examId) ||
      !mongoose.Types.ObjectId.isValid(studentId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Lỗi hệ thống: ID kỳ thi không hợp lệ!",
      });
    }

    const userRole = String(req.user?.role || "").toLowerCase();
    if (userRole !== "student") {
      return res.status(403).json({
        success: false,
        message: "Chỉ học sinh mới được phép làm bài thi!",
      });
    }

    const exam = await Exam.findOne({
      _id: examId,
      isDeleted: false,
    }).lean();

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Kỳ thi không tồn tại hoặc đã bị xóa!",
      });
    }

    if (exam.status !== "PUBLISHED") {
      return res.status(403).json({
        success: false,
        message: "Kỳ thi chưa được mở hoặc đã kết thúc!",
      });
    }

    const classInfo = await mongoose.model("Class").findOne({
      _id: exam.classId,
      isDeleted: false,
      "students.studentId": studentId,
      "students.status": "Enrolled",
    });

    if (!classInfo) {
      return res.status(403).json({
        success: false,
        message: "Bạn không thuộc danh sách lớp thi này!",
      });
    }

    if (exam.startTime && new Date() < new Date(exam.startTime)) {
      return res.status(403).json({
        success: false,
        message: "Kỳ thi chưa tới giờ bắt đầu!",
      });
    }

    const existingAttempt = await ExamAttempt.findOne({
      examId,
      studentId,
    });

    if (existingAttempt) {
      console.log(
        `🔎 Đã có bài làm với trạng thái: ${existingAttempt.status}. Exam: ${examId}, Student: ${studentId}`,
      );

      const completedStatuses = [
        "SUBMITTED",
        "PARTIALLY_GRADED",
        "GRADED",
      ];

      if (completedStatuses.includes(existingAttempt.status)) {
        return res.status(400).json({
          success: false,
          message:
            "Bạn đã hoàn thành bài thi này. Hệ thống không cho phép làm lại bài cũ!",
        });
      }

      if (existingAttempt.status === "IN_PROGRESS") {
        return res.status(200).json({
          success: true,
          message: "Học sinh đang làm dở, chuyển tiếp vào phòng thi.",
          data: existingAttempt,
        });
      }
    }

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

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================================================
// 2. API CHO HỌC SINH: Lấy chi tiết đề thi đang làm
// =======================================================
export const getExamAttemptDetail = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const userId = req.user?.id || req.user?._id;
    const userRole = String(req.user?.role || "").toLowerCase();

    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({
        success: false,
        message: "ID bài thi không hợp lệ!",
      });
    }

    const attempt = await ExamAttempt.findById(attemptId).lean();

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phiên làm bài thi!",
      });
    }

    if (
      userRole === "student" &&
      attempt.studentId?.toString() !== userId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem lượt thi của người khác!",
      });
    }

    const exam = await Exam.findById(attempt.examId).lean();

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Đề thi của lượt làm bài này đã bị xóa!",
      });
    }

    const { resolveExamQuestions } = await import(
      "../utils/examQuestionResolver.js"
    );

    const questionMap = await resolveExamQuestions(exam);
    const formattedQuestions = [];

    for (const questionConfig of exam.questions || []) {
      if (!questionConfig?.questionId) {
        continue;
      }

      const questionId = questionConfig.questionId.toString();
      const details = questionMap.get(questionId);

      if (!details) {
        continue;
      }

      const safeOptions =
        details.options?.map((option) => {
          const safeOption =
            typeof option.toObject === "function"
              ? option.toObject()
              : { ...option };

          delete safeOption.isCorrect;

          return safeOption;
        }) || [];

      formattedQuestions.push({
        _id: details.questionId,
        type: details.type,
        content: details.content,
        options: safeOptions,
        points: questionConfig.points ?? details.points,
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
          classId: exam.classId,
        },
        questions: formattedQuestions,
      },
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết bài thi:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================================================
// 3. API CHO HỌC SINH: Nộp bài thi
// =======================================================
export const submitExam = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { answers } = req.body;
    const userId = req.user?.id || req.user?._id;
    const userRole = String(req.user?.role || "").toLowerCase();

    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({
        success: false,
        message: "ID bài thi không hợp lệ!",
      });
    }

    if (!Array.isArray(answers)) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu bài làm không hợp lệ!",
      });
    }

    const attempt = await ExamAttempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phiên làm bài thi!",
      });
    }

    if (
      userRole === "student" &&
      attempt.studentId?.toString() !== userId?.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền nộp bài thi của người khác!",
      });
    }

    const gradedAttempt = await examAttemptService.gradeSubmission(
      attemptId,
      answers,
      userId,
    );

    return res.status(200).json({
      success: true,
      message:
        gradedAttempt.status === "GRADED"
          ? "Nộp bài thành công! Hệ thống đã chấm xong trắc nghiệm."
          : "Nộp bài thành công! Đang chờ giáo viên chấm phần tự luận.",
      data: gradedAttempt,
    });
  } catch (error) {
    console.error("Lỗi nộp bài thi:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================================================
// 4. API CHO GIÁO VIÊN: Lấy chi tiết để chấm/xem lại
// =======================================================
export const getAttemptForReview = async (req, res) => {
  try {
    const attemptId = req.params.id;

    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({
        success: false,
        message: "ID bài thi không hợp lệ!",
      });
    }

    const attempt = await ExamAttempt.findById(attemptId)
      .populate("studentId", "fullName email studentCode avatar")
      .populate("examId", "title topic duration questions classId")
      .lean();

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bài làm!",
      });
    }

    const exam = attempt.examId;

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề thi của bài làm này!",
      });
    }

    const { resolveExamQuestions } = await import(
      "../utils/examQuestionResolver.js"
    );

    const questionMap = await resolveExamQuestions(exam);

    const validAnswers = (attempt.answers || []).filter(
      (answer) => answer && answer.questionId,
    );

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

      answersDetail: validAnswers.map((answer) => {
        const questionId = answer.questionId.toString();
        const questionInfo = questionMap.get(questionId);

        const examQuestionConfig = exam.questions?.find(
          (config) =>
            config.questionId &&
            config.questionId.toString() === questionId,
        );

        const assignedPoints =
          examQuestionConfig?.points ?? questionInfo?.points ?? 1;

        return {
          questionId: answer.questionId,
          type: questionInfo?.type,
          questionContent: questionInfo?.content,
          options: questionInfo?.options,
          studentAnswer:
            answer.essayText ||
            answer.selectedOption ||
            answer.answer ||
            "",
          correctAnswer: questionInfo?.correctAnswer,
          pointsEarned: answer.pointsEarned,
          maxPoints: assignedPoints,
        };
      }),
    };

    return res.status(200).json({
      success: true,
      data: reviewData,
    });
  } catch (error) {
    console.error("Lỗi lấy chi tiết review:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
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
      return res.status(400).json({
        success: false,
        message: "ID bài thi không hợp lệ!",
      });
    }

    if (!Array.isArray(essayGrades)) {
      return res.status(400).json({
        success: false,
        message: "Dữ liệu chấm điểm không hợp lệ!",
      });
    }

    const updatedAttempt = await examAttemptService.gradeEssay(
      attemptId,
      essayGrades,
    );

    return res.status(200).json({
      success: true,
      message: "Chấm điểm tự luận thành công! Đã chốt điểm bài thi.",
      data: updatedAttempt,
    });
  } catch (error) {
    console.error("Lỗi chấm điểm tự luận:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =======================================================
// 6. Lấy danh sách bài thi theo Exam
// =======================================================
export const getAttemptsByExam = async (req, res) => {
  try {
    const { examId } = req.params;

    if (!examId || !mongoose.Types.ObjectId.isValid(examId)) {
      return res.status(200).json({
        success: true,
        message: "Lấy danh sách bài thi thành công",
        data: [],
        stats: {
          total: 0,
          graded: 0,
          pending: 0,
        },
      });
    }

    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 100);
    const skip = (page - 1) * limit;

    const [attempts, allAttempts] = await Promise.all([
      ExamAttempt.find({ examId })
        .populate({
          path: "studentId",
          select: "fullName studentCode avatar",
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ExamAttempt.find({ examId }).select("status").lean()
    ]);

    const stats = {
      total: allAttempts.length,
      graded: allAttempts.filter(
        (attempt) => attempt.status === "GRADED",
      ).length,
      pending: allAttempts.filter(
        (attempt) => attempt.status === "SUBMITTED",
      ).length,
    };

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách bài thi thành công",
      data: attempts,
      stats,
      pagination: {
        total: allAttempts.length,
        page,
        limit,
        totalPages: Math.ceil(allAttempts.length / limit)
      }
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách bài thi:", error);

    return res.status(500).json({
      success: false,
      message: `Lỗi máy chủ nội bộ: ${error.message}`,
    });
  }
};

// =======================================================
// 7. Ghi nhận cảnh báo gian lận
// =======================================================
export const recordCheatWarning = async (req, res) => {
  try {
    const attemptId = req.params.id;
    const { cheatType } = req.body;

    if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
      return res.status(400).json({
        success: false,
        message: "ID phiên làm bài không hợp lệ!",
      });
    }

    const attempt = await ExamAttempt.findById(attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phiên làm bài!",
      });
    }

    const validCheatTypes = [
      "switch_tab",
      "lose_focus",
      "multiple_faces",
      "no_face",
      "unauthorized_device",
      "suspicious_audio",
    ];

    const normalizedCheatType = validCheatTypes.includes(cheatType)
      ? cheatType
      : "switch_tab";

    attempt.cheatWarnings = (attempt.cheatWarnings || 0) + 1;

    if (!Array.isArray(attempt.cheatLogs)) {
      attempt.cheatLogs = [];
    }

    attempt.cheatLogs.push({
      timestamp: new Date(),
      cheatType: normalizedCheatType,
    });

    await attempt.save();

    console.log(
      `🚨 Đã ghi nhận gian lận (${normalizedCheatType}) cho attempt ${attemptId}. Tổng số lần: ${attempt.cheatWarnings}`,
    );

    return res.status(200).json({
      success: true,
      message: "Đã ghi nhận cảnh báo gian lận",
      cheatWarnings: attempt.cheatWarnings,
    });
  } catch (error) {
    console.error("Lỗi ghi nhận cảnh báo gian lận:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};