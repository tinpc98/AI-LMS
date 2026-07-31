import mongoose from "mongoose";
import ExamSet from "../../models/examSet.model.js";
import ExamSetShare from "../../models/examSetShare.model.js";
import { User } from "#modules/auth";
import Exam from "../../models/exam.model.js";
import crypto from "crypto";

const generateFingerprint = (userId, classId, examSetId, blueprint) => {
  // S4-FIX-02: Canonicalize blueprint deeply using deterministic stringify
  const canonicalize = (obj) => {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(canonicalize);
    return Object.keys(obj)
      .sort()
      .reduce((acc, key) => {
        acc[key] = canonicalize(obj[key]);
        return acc;
      }, {});
  };

  const blueprintStr = JSON.stringify(canonicalize(blueprint));
  const data = `${userId.toString()}|${classId.toString()}|${examSetId.toString()}|${blueprintStr}`;

  return crypto.createHash("sha256").update(data).digest("hex");
};

/**
 * Phân bổ điểm sao cho tổng điểm bằng totalPoints.
 * Điểm dư sẽ được cộng dồn vào câu hỏi cuối cùng.
 */
const distributePoints = (questions, totalPoints) => {
  if (!questions || questions.length === 0) return [];

  const count = questions.length;
  const basePoint = Math.floor((totalPoints / count) * 100) / 100;
  const remainder = totalPoints - basePoint * (count - 1);

  return questions.map((q, index) => ({
    ...q,
    assignedPoints: index === count - 1 ? Number(remainder.toFixed(2)) : basePoint,
  }));
};

/**
 * Tìm kiếm cấu hình chọn câu hỏi từ các bucket (type, diff)
 * sao cho thỏa mãn exact constraints của typeDistribution và difficultyDistribution
 */
const findValidBucketCounts = (buckets, targetTypes, targetDiffs) => {
  const resultCounts = new Array(buckets.length).fill(0);

  // Initialize with 0 to prevent NaN
  const remTypes = {};
  const remDiffs = {};

  for (const b of buckets) {
    remTypes[b.type] = targetTypes[b.type] || 0;
    remDiffs[b.diff] = targetDiffs[b.diff] || 0;
  }

  let found = false;

  const backtrack = (bucketIndex) => {
    if (bucketIndex === buckets.length) {
      for (const t of Object.values(remTypes)) if (t !== 0) return false;
      for (const d of Object.values(remDiffs)) if (d !== 0) return false;
      found = true;
      return true;
    }

    const bucket = buckets[bucketIndex];
    const maxPossible = Math.min(
      bucket.available.length,
      remTypes[bucket.type] || 0,
      remDiffs[bucket.diff] || 0
    );

    // Try from maxPossible down to 0
    for (let count = maxPossible; count >= 0; count--) {
      remTypes[bucket.type] -= count;
      remDiffs[bucket.diff] -= count;
      resultCounts[bucketIndex] = count;

      if (backtrack(bucketIndex + 1)) return true;

      remTypes[bucket.type] += count;
      remDiffs[bucket.diff] += count;
      resultCounts[bucketIndex] = 0;
    }

    return false;
  };

  backtrack(0);
  return found ? resultCounts : null;
};

/**
 * Lựa chọn câu hỏi theo đúng phân bố (deterministic)
 */
const selectQuestionsByBlueprint = (pool, blueprint) => {
  const {
    totalQuestions,
    questionTypeDistribution,
    difficultyDistribution,
    shuffleQuestions,
    shuffleOptions,
  } = blueprint;

  // Validate totals
  const totalTypes = Object.values(questionTypeDistribution).reduce((a, b) => a + b, 0);
  const totalDiffs = Object.values(difficultyDistribution).reduce((a, b) => a + b, 0);

  if (totalTypes !== totalQuestions || totalDiffs !== totalQuestions) {
    throw new Error("Tổng phân bố loại câu hỏi hoặc độ khó không khớp với tổng số câu hỏi.");
  }

  // Create 12 buckets
  const types = ["multiple_choice", "true_false", "short_answer", "essay"];
  const diffs = ["easy", "medium", "hard"];
  const buckets = [];

  for (const t of types) {
    for (const d of diffs) {
      buckets.push({
        type: t,
        diff: d,
        available: pool
          .filter((q) => q.type === t && q.difficulty === d)
          .sort((a, b) => a.questionId.localeCompare(b.questionId)), // Sort deterministic
      });
    }
  }

  const counts = findValidBucketCounts(buckets, questionTypeDistribution, difficultyDistribution);

  if (!counts) {
    const err = new Error("ExamSet không đủ câu hỏi thỏa mãn đúng ma trận đề thi (Blueprint).");
    err.statusCode = 422;
    throw err;
  }

  let selectedQuestions = [];
  for (let i = 0; i < buckets.length; i++) {
    const bucket = buckets[i];
    const countToPick = counts[i];
    // Copy out the exact number of questions
    const picked = bucket.available.slice(0, countToPick).map((q) => JSON.parse(JSON.stringify(q)));
    selectedQuestions.push(...picked);
  }

  // Shuffle questions if requested
  if (shuffleQuestions) {
    // Deterministic shuffle logic usually requires a seed.
    // We use a simple pseudo-random approach using the question IDs if strict determinism is needed for tests.
    // For now, we will just sort by a hash of the question ID + title to be deterministic yet mixed.
    selectedQuestions.sort((a, b) => {
      const hashA = crypto.createHash("md5").update(a.questionId).digest("hex");
      const hashB = crypto.createHash("md5").update(b.questionId).digest("hex");
      return hashA.localeCompare(hashB);
    });
  }

  // Shuffle options if requested
  if (shuffleOptions) {
    for (const q of selectedQuestions) {
      if (
        (q.type === "multiple_choice" || q.type === "true_false") &&
        q.options &&
        q.options.length > 0
      ) {
        q.options.sort((a, b) => {
          const hashA = crypto.createHash("md5").update(a.id).digest("hex");
          const hashB = crypto.createHash("md5").update(b.id).digest("hex");
          return hashA.localeCompare(hashB);
        });
      }
    }
  }

  return selectedQuestions;
};

const generateExamFromSet = async ({ userId, classId, examSetId, blueprint }) => {
  const { title, durationMinutes, totalPoints } = blueprint;

  // 1. Lấy ExamSet và kiểm tra quyền
  const examSet = await ExamSet.findOne({ _id: examSetId, isDeleted: false }).lean();
  if (!examSet) {
    const err = new Error("ExamSet không tồn tại hoặc đã bị xóa.");
    err.statusCode = 404;
    throw err;
  }

  // S4-FIX-05: IDOR check with Role and Sharing
  const user = await User.findById(userId).lean();
  const userRole = (user?.role || "").toLowerCase();

  if (userRole !== "admin" && examSet.ownerId.toString() !== userId.toString()) {
    const share = await ExamSetShare.findOne({
      examSetId,
      sharedWithUserId: userId,
      status: "ACTIVE",
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
      permission: { $in: ["VIEW", "EDIT"] },
    }).lean();

    if (!share) {
      const err = new Error("Bạn không có quyền sử dụng ExamSet này.");
      err.statusCode = 404; // Use 404 to avoid enumeration
      throw err;
    }
  }

  // 2. Check Idempotency (Fingerprint) - S4-FIX-02
  const fingerprint = generateFingerprint(userId, classId, examSetId, blueprint);

  const existingDraft = await Exam.findOne({
    createdBy: userId,
    status: "DRAFT",
    aiSourceFingerprint: fingerprint,
  });

  if (existingDraft) {
    const err = new Error("Một đề thi nháp với cấu hình tương tự đã tồn tại.");
    err.statusCode = 409;
    throw err;
  }

  // 3. Chạy Blueprint Selection Engine
  const selectedQuestions = selectQuestionsByBlueprint(examSet.questions || [], blueprint);

  // 4. Phân bổ điểm
  const questionsWithPoints = distributePoints(selectedQuestions, totalPoints);

  // 5. Chuẩn bị định dạng lưu vào Exam
  const examQuestionsFormatted = questionsWithPoints.map((q) => ({
    questionId: q.questionId || new mongoose.Types.ObjectId().toString(), // fallback if missing
    points: q.assignedPoints,
    isSnapshot: true,
    snapshotData: q, // Toàn bộ object câu hỏi
  }));

  // 6. Tạo Exam
  const newExam = new Exam({
    title,
    duration: durationMinutes,
    startTime: new Date(), // Mặc định là hiện tại, Teacher có thể sửa sau
    classId,
    createdBy: userId,
    status: "DRAFT", // Luôn là DRAFT
    isAIGenerated: true, // Được sinh từ AI Backend module
    aiSourceExamSetId: examSetId,
    aiSourceFingerprint: fingerprint,
    aiPromptUsed: `Blueprint Sinh Đề Thi`, // Just for reference
    maxScore: totalPoints,
    questions: examQuestionsFormatted,
  });

  await newExam.save();

  return newExam;
};

export default {
  generateExamFromSet,
  selectQuestionsByBlueprint, // exported for testing
  distributePoints, // exported for testing
};
