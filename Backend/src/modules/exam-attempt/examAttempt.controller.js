import mongoose from "mongoose";
import crypto from "crypto";
import { resolveAttemptDeadline, isSubmissionRejected } from "./attemptDeadline.js";
import { buildAttemptStats } from "./attemptStats.js";
import { logger } from "#shared/utils/logger.js";
import examAttemptService from "./examAttempt.service.js";
import ExamAttempt from "./examAttempt.model.js";
import { Exam } from "#modules/exam";
import { checkClassTeacherOwnership } from "#modules/class";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

// =======================================================
// 1. API CHO HỌC SINH: Bắt đầu làm bài thi
// =======================================================
export const startExam = asyncHandler(async (req, res) => {
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
      errorCode: "NOT_STARTED",
      message: "Kỳ thi chưa tới giờ bắt đầu!",
      startTime: exam.startTime,
    });
  }

  const existingAttempt = await ExamAttempt.findOne({
    examId,
    studentId,
    isDeleted: false,
  });

  if (existingAttempt) {
    logger.debug(
      `🔎 Đã có bài làm với trạng thái: ${existingAttempt.status}. Exam: ${examId}, Student: ${studentId}`
    );

    const completedStatuses = ["SUBMITTED", "PARTIALLY_GRADED", "GRADED"];

    if (completedStatuses.includes(existingAttempt.status)) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã hoàn thành bài thi này. Hệ thống không cho phép làm lại bài cũ!",
      });
    }

    if (existingAttempt.status === "IN_PROGRESS") {
      const { takeover, sessionToken: oldToken, tabId } = req.body;
      const isAlive =
        existingAttempt.lastHeartbeat && Date.now() - existingAttempt.lastHeartbeat.getTime() < 60000;
      
      // Kịch bản Cùng token
      if (oldToken && oldToken === existingAttempt.sessionToken) {
        // Cùng tabId -> Tải lại trang (F5) hoặc vô tình gọi lại API
        if (tabId && tabId === existingAttempt.activeTabId) {
          existingAttempt.lastHeartbeat = new Date();
          await existingAttempt.save();
          return res.status(200).json({
            success: true,
            message: "Tiếp tục bài thi hiện tại.",
            data: existingAttempt,
          });
        }
        
        // Khác tabId, phiên cũ ĐÃ CHẾT -> Chính chủ vào lại sau khi sập tab/rớt mạng (KHÔNG HỎI TAKEOVER)
        if (!isAlive) {
          existingAttempt.activeTabId = tabId;
          existingAttempt.lastHeartbeat = new Date();
          await existingAttempt.save();
          return res.status(200).json({
            success: true,
            message: "Khôi phục phiên làm bài (tab mới).",
            data: existingAttempt,
          });
        }

        // Khác tabId, phiên cũ CÒN SỐNG -> Mở 2 tab song song -> Hỏi takeover
        if (isAlive && !takeover) {
          return res.status(409).json({
            success: false,
            errorCode: "SESSION_ACTIVE",
            message: "Hệ thống phát hiện phiên làm bài đang mở hoặc chưa được đóng đúng cách. Bấm Tiếp tục để kết nối lại.",
          });
        }
      } else {
        // Kịch bản Khác token (Thiết bị khác hoàn toàn) -> Hỏi takeover
        if (isAlive && !takeover) {
          return res.status(409).json({
            success: false,
            errorCode: "SESSION_ACTIVE",
            message: "Bài thi này đang được làm ở thiết bị khác. Tiếp tục ở đây sẽ ngắt kết nối thiết bị kia.",
          });
        }
      }

      // Takeover hoặc session đã chết (và khác token)
      existingAttempt.sessionToken = crypto.randomBytes(16).toString("hex");
      existingAttempt.activeTabId = tabId;
      existingAttempt.lastHeartbeat = new Date();
      existingAttempt.takeoverCount += 1;
      existingAttempt.deviceLogs.push({
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        takeoverTime: new Date(),
      });
      await existingAttempt.save();

      return res.status(200).json({
        success: true,
        message: takeover ? "Đã tiếp quản phiên thi từ thiết bị khác." : "Học sinh đang làm dở, chuyển tiếp vào phòng thi.",
        data: existingAttempt,
      });
    }
  }

  const newAttempt = new ExamAttempt({
    examId,
    studentId,
    status: "IN_PROGRESS",
    startTime: new Date(),
    sessionToken: crypto.randomBytes(16).toString("hex"),
    activeTabId: req.body.tabId,
    lastHeartbeat: new Date(),
    deviceLogs: [
      {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        takeoverTime: new Date(),
      },
    ],
  });

  try {
    await newAttempt.save();
  } catch (error) {
    if (error.code === 11000) {
      // Bị lỗi trùng lặp (Race condition) -> Trả về bản ghi đang tồn tại thay vì ném lỗi
      const existing = await ExamAttempt.findOne({ examId, studentId, isDeleted: false });
      if (existing) {
        return res.status(200).json({
          success: true,
          message: "Lượt thi đã được tạo trước đó.",
          data: existing,
        });
      }
    }
    throw error;
  }

  return res.status(201).json({
    success: true,
    message: "Bắt đầu tính giờ làm bài!",
    data: newAttempt,
  });
});

// =======================================================
// 2. API CHO HỌC SINH: Lấy chi tiết đề thi đang làm
// =======================================================
export const getExamAttemptDetail = asyncHandler(async (req, res) => {
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

  if (userRole === "student" && attempt.studentId?.toString() !== userId?.toString()) {
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

  const { resolveExamQuestions } = await import("./examQuestionResolver.js");

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
        if (typeof option === "string") return option;
        const safeOption =
          typeof option?.toObject === "function" ? option.toObject() : { ...option };

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
      answersVersion: attempt.answersVersion || 0,
      examInfo: {
        title: exam.title,
        duration: exam.duration,
        startTime: exam.startTime,
        classId: exam.classId,
      },
      // Hạn nộp TUYỆT ĐỐI của chính lượt thi này.
      // Frontend dùng để khóa đồng hồ vào mốc này thay vì tự tính.
      endTime: resolveAttemptDeadline(attempt.startTime, exam.duration),
      // Giờ máy chủ tại thời điểm trả response.
      // Frontend dùng để tính offset = serverTime - Date.now(), sau đó
      // tính lại remaining = (endTime - (Date.now() + offset)) để bù sai lệch.
      serverTime: new Date().toISOString(),
      cheatWarnings: attempt.cheatWarnings || 0,
      questions: formattedQuestions,
    },
  });
});

// =======================================================
// 3. API CHO HỌC SINH: Nộp bài thi
// =======================================================
export const submitExam = asyncHandler(async (req, res) => {
  const attemptId = req.params.id;
  const { answers } = req.body;
  const userId = req.user?.id || req.user?._id;
  const userRole = String(req.user?.role || "").toLowerCase();

  const sessionToken = req.headers["x-session-token"];

  if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
    return res.status(400).json({
      success: false,
      message: "ID bài thi không hợp lệ!",
    });
  }

  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy phiên làm bài thi!",
    });
  }

  // Session token matching
  if (userRole === "student" && attempt.sessionToken && sessionToken !== attempt.sessionToken) {
    return res.status(403).json({
      success: false,
      errorCode: "SESSION_MISMATCH",
      message: "Bài thi này đang được làm ở thiết bị khác. Không thể nộp bài từ đây.",
    });
  }

  if (userRole === "student" && attempt.studentId?.toString() !== userId?.toString()) {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền nộp bài thi của người khác!",
    });
  }

  if (attempt.status !== "IN_PROGRESS") {
    return res.status(400).json({
      success: false,
      message: "Bài thi này đã được nộp hoặc đã chốt điểm trước đó!",
    });
  }

  const exam = await Exam.findById(attempt.examId).select("duration startTime").lean();
  const rejection = isSubmissionRejected(attempt, exam);
  if (rejection.rejected) {
    return res.status(403).json({
      success: false,
      message: rejection.message,
    });
  }

  const gradedAttempt = await examAttemptService.gradeSubmission(attemptId, answers, userId);

  return res.status(200).json({
    success: true,
    message:
      gradedAttempt.status === "GRADED"
        ? "Nộp bài thành công! Hệ thống đã chấm xong trắc nghiệm."
        : "Nộp bài thành công! Đang chờ giáo viên chấm phần tự luận.",
    data: gradedAttempt,
  });
});

// =======================================================
// 4. API CHO GIÁO VIÊN: Lấy chi tiết để chấm/xem lại
// =======================================================
export const getAttemptForReview = asyncHandler(async (req, res) => {
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

  const userId = (req.user.id || req.user._id || "").toString();
  const userRole = (req.user.role || "").toLowerCase();
  
  let hideAnswers = false;
  if (userRole === "student") {
    if (attempt.studentId._id.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem chi tiết bài thi của người khác!",
      });
    }
    const examEndTime = new Date(new Date(exam.startTime).getTime() + exam.duration * 60000);
    if (new Date() < examEndTime) {
      hideAnswers = true;
    }
  } else {
    const isAuthorized = await checkClassTeacherOwnership(exam.classId, userId, userRole);
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xem bài làm của lớp học này!",
      });
    }
  }

  const { resolveExamQuestions } = await import("./examQuestionResolver.js");

  const questionMap = await resolveExamQuestions(exam);

  const validAnswers = (attempt.answers || []).filter((answer) => answer && answer.questionId);

  const reviewData = {
    attemptId: attempt._id,
    student: attempt.studentId,
    examInfo: {
      title: exam.title,
      topic: exam.topic,
      duration: exam.duration,
    },
    status: attempt.status,
    totalScore: hideAnswers ? undefined : attempt.totalScore,
    isHideAnswers: hideAnswers,
    submittedAt: attempt.endTime,
    cheatWarnings: attempt.cheatWarnings || 0,
    cheatLogs: attempt.cheatLogs || [],
    // Nộp muộn: giáo viên cần thấy điều này TRƯỚC khi chấm, không phải sau.
    isLate: attempt.isLate || false,
    lateBySeconds: attempt.lateBySeconds || 0,

    answersDetail: hideAnswers ? [] : validAnswers.map((answer) => {
      const questionId = answer.questionId.toString();
      const questionInfo = questionMap.get(questionId);

      const examQuestionConfig = exam.questions?.find(
        (config) => config.questionId && config.questionId.toString() === questionId
      );

      const assignedPoints = examQuestionConfig?.points ?? questionInfo?.points ?? 1;

      return {
        questionId: answer.questionId,
        type: questionInfo?.type,
        questionContent: questionInfo?.content,
        options: questionInfo?.options,
        studentAnswer: answer.essayText || answer.selectedOption || answer.answer || "",
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
});

// =======================================================
// 5. API CHO GIÁO VIÊN: Chấm điểm tự luận
// =======================================================
export const gradeEssaySubmit = asyncHandler(async (req, res) => {
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

  const userId = (req.user.id || req.user._id || "").toString();
  const userRole = (req.user.role || "").toLowerCase();

  const updatedAttempt = await examAttemptService.gradeEssay(
    attemptId,
    essayGrades,
    userId,
    userRole
  );

  return res.status(200).json({
    success: true,
    message: "Chấm điểm tự luận thành công! Đã chốt điểm bài thi.",
    data: updatedAttempt,
  });
});

// =======================================================
// 6. Lấy danh sách bài thi theo Exam
// =======================================================
export const getAttemptsByExam = asyncHandler(async (req, res) => {
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

  const exam = await Exam.findById(examId).select("classId").lean();
  if (!exam) {
    return res.status(404).json({ success: false, message: "Không tìm thấy đề thi!" });
  }

  const userId = (req.user.id || req.user._id || "").toString();
  const userRole = (req.user.role || "").toLowerCase();
  const isAuthorized = await checkClassTeacherOwnership(exam.classId, userId, userRole);
  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền xem danh sách bài làm của lớp học này!",
    });
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Number(req.query.limit) || 100);

  const [attempts, allAttempts] = await Promise.all([
    ExamAttempt.find({ examId })
      .populate({ path: "studentId", select: "fullName studentCode avatar" })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    ExamAttempt.find({ examId }).select("status isLate").lean(),
  ]);

  const stats = buildAttemptStats(allAttempts);

  return res.status(200).json({
    success: true,
    message: "Lấy danh sách bài thi thành công",
    data: attempts,
    stats,
    pagination: {
      total: allAttempts.length,
      page,
      limit,
      totalPages: Math.ceil(allAttempts.length / limit),
    },
  });
});

// =======================================================
// 7. Ghi nhận cảnh báo gian lận
// =======================================================
export const recordCheatWarning = asyncHandler(async (req, res) => {
  const attemptId = req.params.id;
  const { cheatType } = req.body;
  const sessionToken = req.headers["x-session-token"];

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

  if (attempt.sessionToken && sessionToken !== attempt.sessionToken) {
    return res.status(403).json({ success: false, message: "Thiết bị không hợp lệ." });
  }

  const validCheatTypes = [
    "TAB_SWITCH",
    "FULLSCREEN_EXIT",
    "COPY_PASTE",
    "MULTIPLE_FACES"
  ];

  const normalizedCheatType = validCheatTypes.includes(cheatType) ? cheatType : "TAB_SWITCH";

  const updatedAttempt = await ExamAttempt.findOneAndUpdate(
    { _id: attemptId, status: "IN_PROGRESS" },
    {
      $inc: { cheatWarnings: 1 },
      $push: { cheatLogs: { timestamp: new Date(), cheatType: normalizedCheatType } }
    },
    { new: true }
  );

  if (!updatedAttempt) {
    // Nếu status không phải IN_PROGRESS (đã nộp), hoặc bị xoá
    return res.status(400).json({ success: false, message: "Bài thi không trong trạng thái làm bài hoặc đã được nộp." });
  }

  logger.warn(
    `🚨 Đã ghi nhận gian lận (${normalizedCheatType}) cho attempt ${attemptId}. Tổng số lần: ${updatedAttempt.cheatWarnings}`
  );

  if (updatedAttempt.cheatWarnings >= 5) {
    const { default: examAttemptService } = await import("./examAttempt.service.js");
    await examAttemptService.gradeSubmission(attemptId, updatedAttempt.answers || [], true);
    
    return res.status(403).json({
      success: false,
      errorCode: "CHEAT_THRESHOLD_REACHED",
      message: "Bài thi đã được tự động nộp do vi phạm quá 5 lần.",
      cheatWarnings: updatedAttempt.cheatWarnings,
    });
  }

  return res.status(200).json({
    success: true,
    message: "Đã ghi nhận cảnh báo gian lận",
    cheatWarnings: updatedAttempt.cheatWarnings,
  });
});

// =======================================================
// 8. API CHO HỌC SINH: Heartbeat
// =======================================================
export const heartbeat = asyncHandler(async (req, res) => {
  const attemptId = req.params.id;
  const sessionToken = req.headers["x-session-token"];

  if (!attemptId || !mongoose.Types.ObjectId.isValid(attemptId)) {
    return res.status(400).json({ success: false, message: "ID bài thi không hợp lệ!" });
  }

  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) {
    return res.status(404).json({ success: false, message: "Không tìm thấy phiên làm bài thi!" });
  }

  if (attempt.status !== "IN_PROGRESS") {
    return res.status(400).json({ success: false, message: "Bài thi đã kết thúc." });
  }

  if (attempt.sessionToken && sessionToken !== attempt.sessionToken) {
    return res.status(403).json({
      success: false,
      errorCode: "SESSION_MISMATCH",
      message: "Bài thi này đang được làm ở thiết bị khác.",
    });
  }

  attempt.lastHeartbeat = new Date();
  await attempt.save();

  return res.status(200).json({ success: true });
});
