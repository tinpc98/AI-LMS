import { asyncHandler } from "#shared/utils/asyncHandler.js";
import * as examAttemptService from "./examAttempt.service.js";
import ExamAttempt from "./examAttempt.model.js";
import Exam from "../exam/exam.model.js";
import { checkClassTeacherOwnership } from "#modules/class";
import { processAttemptPerformanceService } from "#modules/performance";
import { buildAttemptStats } from "./attemptStats.js";
import { BusinessRuleError, AuthorizationError, ValidationError } from "#shared/utils/appError.js";

/**
 * Kiểm tra teacher có quyền với exam này (qua exam.classId).
 */
const checkTeacherExamAccess = async (exam, userId, role) => {
  if (!exam) return false;
  if ((role || "").toLowerCase() === "admin") return true;
  return checkClassTeacherOwnership(exam.classId, userId, role);
};

/**
 * POST /api/exams/:examId/start
 * Student bắt đầu thi.
 */
export const startExam = asyncHandler(async (req, res) => {
  const examId = req.params.examId;
  const studentId = req.user.id || req.user._id;

  try {
    const result = await examAttemptService.startExamService(examId, studentId);
    return res.status(result.isResume ? 200 : 201).json({
      success: true,
      message: result.isResume ? "Tiếp tục làm bài" : "Bắt đầu làm bài thi",
      data: {
        _id: result.attemptId,
        sessionToken: result.sessionToken,
        startedAt: result.startedAt,
        expiresAt: result.expiresAt,
        questions: result.questions,
        isResume: result.isResume || false,
      },
    });
  } catch (err) {
    throw new BusinessRuleError(
      err.message,
      err.code || "EXAM_ERROR",
      err.startAt ? { startAt: err.startAt } : null
    );
  }
});

/**
 * GET /api/exam-attempts/:attemptId
 * Student lấy chi tiết attempt (cần auth + ownership).
 * Teacher cũng có thể xem (để heartbeat sync không phải teacher).
 */
export const getAttempt = asyncHandler(async (req, res) => {
  const attemptId = req.params.attemptId;
  const userId = req.user.id || req.user._id;
  const role = (req.user?.role || "").toLowerCase();

  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) return res.status(404).json({ success: false, message: "Attempt not found" });

  // Student chỉ xem attempt của mình
  if (role === "student" && attempt.studentId.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }

  // Teacher: kiểm tra class ownership
  if (role === "teacher") {
    const exam = await Exam.findById(attempt.examId).select("classId").lean();
    const isOwner = await checkClassTeacherOwnership(exam?.classId, userId, role);
    if (!isOwner) return res.status(403).json({ success: false, message: "Forbidden" });
  }

  // Trả về data với các field frontend cần
  const exam = await Exam.findById(attempt.examId).select("title duration classId topicId").lean();

  return res.status(200).json({
    success: true,
    data: {
      _id: attempt._id,
      examId: attempt.examId,
      studentId: attempt.studentId,
      status: attempt.status,
      questions: attempt.questions,
      score: attempt.score,
      startedAt: attempt.startedAt,
      expiresAt: attempt.expiresAt,
      submittedAt: attempt.submittedAt,
      cheatWarnings: attempt.cheatWarnings,
      cheatLogs: attempt.cheatLogs,
      sessionToken: attempt.sessionToken,
      answersVersion: attempt.answersVersion,
      isLate: attempt.isLate,
      lateBySeconds: attempt.lateBySeconds,
      // examInfo cho frontend
      examInfo: exam
        ? {
            title: exam.title,
            duration: exam.duration,
            classId: exam.classId,
            topicId: exam.topicId,
          }
        : null,
      // endTime alias
      endTime: attempt.expiresAt,
      serverTime: new Date(),
    },
  });
});

/**
 * PATCH /api/exam-attempts/:attemptId/questions/:questionId
 * Student lưu câu trả lời theo từng câu.
 */
export const saveAnswer = asyncHandler(async (req, res) => {
  const attemptId = req.params.attemptId;
  const questionId = req.params.questionId;
  const studentId = req.user.id || req.user._id;
  const sessionToken = req.headers["x-session-token"];

  if (!sessionToken) {
    throw new AuthorizationError("Thiếu session token");
  }

  const attempt = await examAttemptService.saveExamAnswerService(
    attemptId,
    sessionToken,
    studentId,
    questionId,
    req.body
  );
  return res.status(200).json({ success: true, message: "Đã lưu", data: attempt });
});

/**
 * POST /api/exam-attempts/:attemptId/submit
 * Student nộp bài.
 */
export const submitExam = asyncHandler(async (req, res) => {
  const attemptId = req.params.attemptId;
  const studentId = req.user.id || req.user._id;
  const sessionToken = req.headers["x-session-token"];

  if (!sessionToken) {
    throw new AuthorizationError("Thiếu session token");
  }

  const attempt = await examAttemptService.submitExamService(attemptId, sessionToken, studentId);
  return res.status(200).json({ success: true, message: "Nộp bài thành công", data: attempt });
});

/**
 * POST /api/exam-attempts/:attemptId/cheat
 * Student báo cáo hành vi gian lận (HTTP, không qua socket).
 */
export const reportCheat = asyncHandler(async (req, res) => {
  const attemptId = req.params.attemptId;
  const studentId = req.user.id || req.user._id;
  const sessionToken = req.headers["x-session-token"];
  const { cheatType } = req.body;

  if (!sessionToken) {
    throw new AuthorizationError("Thiếu session token");
  }

  const attempt = await examAttemptService.incrementCheatWarningService(
    attemptId,
    sessionToken,
    studentId,
    cheatType
  );
  return res.status(200).json({
    success: true,
    message: "Đã ghi nhận vi phạm",
    data: { cheatWarnings: attempt.cheatWarnings },
  });
});

/**
 * GET /api/exams/:examId/my-results
 * Student xem kết quả của mình.
 */
export const getMyResults = asyncHandler(async (req, res) => {
  const examId = req.params.examId;
  const studentId = req.user.id || req.user._id;

  const attempts = await ExamAttempt.find({ examId, studentId }).sort({ attemptNumber: -1 });
  const result = await examAttemptService.getFinalExamResultService(examId, studentId);
  return res.status(200).json({ success: true, data: { attempts, ...result } });
});

/**
 * GET /api/exam-attempts/exam/:examId
 * Teacher lấy danh sách tất cả attempt của 1 exam.
 */
export const getAttemptsByExam = asyncHandler(async (req, res) => {
  const { examId } = req.params;
  const userId = req.user.id || req.user._id;
  const role = req.user?.role;

  const exam = await Exam.findById(examId).select("classId title status").lean();
  if (!exam) return res.status(404).json({ success: false, message: "Exam not found" });

  const isOwner = await checkTeacherExamAccess(exam, userId, role);
  if (!isOwner) return res.status(403).json({ success: false, message: "Forbidden" });

  const attempts = await ExamAttempt.find({ examId, isDeleted: { $ne: true } })
    .populate("studentId", "name email avatar")
    .sort({ createdAt: -1 })
    .lean();

  const stats = buildAttemptStats(attempts);

  return res.status(200).json({
    success: true,
    data: attempts,
    stats,
  });
});

/**
 * GET /api/exam-attempts/:attemptId/review
 * Teacher xem chi tiết bài làm để chấm.
 */
export const getAttemptForReview = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const userId = req.user.id || req.user._id;
  const role = req.user?.role;

  const attempt = await ExamAttempt.findById(attemptId)
    .populate("studentId", "name email avatar")
    .lean();
  if (!attempt) return res.status(404).json({ success: false, message: "Attempt not found" });

  const exam = await Exam.findById(attempt.examId).select("classId title duration topicId").lean();

  const isOwner = await checkTeacherExamAccess(exam, userId, role);
  if (!isOwner) return res.status(403).json({ success: false, message: "Forbidden" });

  // Build answer detail for review (câu hỏi + đáp án + điểm)
  const answersDetail = attempt.questions.map((aq) => {
    const snap = aq.questionSnapshot || {};
    const studentAnswer =
      aq.answer?.selectedOptionIds?.join(", ") ||
      (aq.answer?.content || []).map((b) => b.text || "").join(" ") ||
      "";

    return {
      questionId: aq.questionId?.toString(),
      type: snap.type,
      questionContent: snap.content,
      options: snap.options,
      studentAnswer,
      isCorrect: aq.isCorrect,
      pointsEarned: aq.score,
      maxPoints: aq.points,
    };
  });

  return res.status(200).json({
    success: true,
    data: {
      attemptId: attempt._id,
      student: attempt.studentId,
      examInfo: {
        title: exam?.title,
        duration: exam?.duration,
        topicId: exam?.topicId,
      },
      status: attempt.status,
      totalScore: attempt.score,
      submittedAt: attempt.submittedAt,
      cheatWarnings: attempt.cheatWarnings,
      cheatLogs: attempt.cheatLogs,
      isLate: attempt.isLate,
      lateBySeconds: attempt.lateBySeconds,
      answersDetail,
    },
  });
});

/**
 * PUT /api/exam-attempts/:attemptId/grade-essay
 * Teacher chấm Essay cho ExamAttempt.
 *
 * Body: { essayGrades: [{ questionId, pointsEarned, feedback? }] }
 */
export const gradeEssay = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const userId = req.user.id || req.user._id;
  const role = req.user?.role;
  const { essayGrades } = req.body;

  if (!Array.isArray(essayGrades) || essayGrades.length === 0) {
    return res.status(400).json({ success: false, message: "Thiếu dữ liệu chấm điểm" });
  }

  // BUG ĐÃ SỬA (race condition): trước đây đọc CẢ document, sửa mảng questions[] trong bộ nhớ,
  // rồi attempt.save() ghi đè NGUYÊN mảng đó. Nếu 2 giáo viên cùng chấm 1 attempt (chấm 2 câu
  // essay khác nhau) gần như đồng thời, người ghi sau đè mất điểm người ghi trước vì bản trong
  // bộ nhớ của họ vẫn còn là dữ liệu CŨ (đọc trước khi người kia lưu). Sửa bằng optimistic lock
  // trên __v (Mongoose version key có sẵn, không cần field mới) + $set theo đúng index câu hỏi
  // (không đụng câu khác) — nếu version lệch (ai đó vừa ghi), đọc lại và thử lại tối đa 5 lần
  // thay vì âm thầm ghi đè.
  const MAX_RETRIES = 5;
  let updated = null;

  for (let attemptNo = 0; attemptNo < MAX_RETRIES; attemptNo++) {
    const attempt = await ExamAttempt.findById(attemptId);
    if (!attempt) return res.status(404).json({ success: false, message: "Attempt not found" });

    if (!["PARTIALLY_GRADED", "SUBMITTED"].includes(attempt.status)) {
      return res
        .status(409)
        .json({ success: false, message: "Attempt không ở trạng thái cần chấm" });
    }

    const exam = await Exam.findById(attempt.examId).select("classId").lean();
    const isOwner = await checkTeacherExamAccess(exam, userId, role);
    if (!isOwner) return res.status(403).json({ success: false, message: "Forbidden" });

    // Xây $set theo index — chỉ đụng đúng những câu essay được chấm trong request này.
    const setOps = {};
    for (const grade of essayGrades) {
      const idx = attempt.questions.findIndex((q) => q.questionId.toString() === grade.questionId);
      if (idx === -1) continue;

      const aq = attempt.questions[idx];
      const qType = (aq.questionSnapshot?.type || "").toUpperCase();
      const isEssay = qType === "ESSAY" || qType === "SHORT_ANSWER";
      if (!isEssay) continue; // Chỉ chấm essay

      const awarded = Math.max(0, Math.min(aq.points, Number(grade.pointsEarned) || 0));
      setOps[`questions.${idx}.score`] = awarded;
      setOps[`questions.${idx}.isCorrect`] = awarded > 0;
    }

    if (Object.keys(setOps).length === 0) {
      return res.status(400).json({ success: false, message: "Không có câu Essay hợp lệ để chấm" });
    }

    // Tính totalScore/stillPending trên bản CHIẾU (projection) = dữ liệu vừa đọc + thay đổi của
    // request này — vẫn dựa trên đúng phiên bản đang giữ optimistic lock, không lẫn dữ liệu cũ.
    const projected = attempt.questions.map((q, idx) => ({
      score:
        setOps[`questions.${idx}.score`] !== undefined ? setOps[`questions.${idx}.score`] : q.score,
      isCorrect:
        setOps[`questions.${idx}.isCorrect`] !== undefined
          ? setOps[`questions.${idx}.isCorrect`]
          : q.isCorrect,
      type: (q.questionSnapshot?.type || "").toUpperCase(),
    }));
    const totalScore = projected.reduce((sum, q) => sum + (q.score || 0), 0);
    const stillPending = projected.some(
      (q) => q.type !== "MCQ" && q.type !== "MULTIPLE_CHOICE" && q.isCorrect === null
    );

    setOps.score = totalScore;
    if (!stillPending) setOps.status = "GRADED";

    updated = await ExamAttempt.findOneAndUpdate(
      { _id: attemptId, __v: attempt.__v },
      { $set: setOps, $inc: { __v: 1 } },
      { new: true }
    );

    if (updated) break; // Ghi thành công, không ai chen vào giữa lúc tính toán.
    // updated === null: __v đã đổi (giáo viên khác vừa ghi) — đọc lại bản mới nhất và thử lại.
  }

  if (!updated) {
    return res.status(409).json({
      success: false,
      message: "Có người khác vừa chấm bài này cùng lúc, vui lòng tải lại và thử lại.",
    });
  }

  // Trigger Performance Engine nếu đã GRADED
  if (updated.status === "GRADED" && !updated.performanceProcessedAt) {
    processAttemptPerformanceService(updated, "EXAM")
      .then(async () => {
        await ExamAttempt.findByIdAndUpdate(updated._id, {
          performanceProcessedAt: new Date(),
        });
      })
      .catch((err) => console.error("[gradeEssay] Performance error:", err));
  }

  return res.status(200).json({
    success: true,
    message: "Chấm điểm thành công",
    data: updated,
  });
});

/**
 * POST /api/exam-attempts/:attemptId/heartbeat
 * Student gửi heartbeat để xác nhận session còn hoạt động.
 */
export const heartbeat = asyncHandler(async (req, res) => {
  const { attemptId } = req.params;
  const userId = req.user.id || req.user._id;
  const sessionToken = req.headers["x-session-token"];

  const attempt = await ExamAttempt.findById(attemptId).select(
    "studentId status sessionToken activeTabId expiresAt"
  );

  if (!attempt) return res.status(404).json({ success: false, message: "Attempt not found" });
  if (attempt.studentId.toString() !== userId.toString()) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  if (attempt.status !== "IN_PROGRESS") {
    return res.status(409).json({ success: false, message: "Bài thi đã kết thúc" });
  }

  // Session mismatch detection
  if (attempt.sessionToken && sessionToken && attempt.sessionToken !== sessionToken) {
    return res.status(403).json({
      success: false,
      message: "Bài thi này đang được làm ở thiết bị khác.",
      errorCode: "SESSION_MISMATCH",
    });
  }

  return res.status(200).json({
    success: true,
    data: {
      status: attempt.status,
      expiresAt: attempt.expiresAt,
      serverTime: new Date(),
    },
  });
});
