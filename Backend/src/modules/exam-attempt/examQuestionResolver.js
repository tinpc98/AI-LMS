import mongoose from "mongoose";
import { Question } from "#modules/question";

/**
 * Lấy danh sách câu hỏi đã được chuẩn hóa (kết hợp cả legacy db và snapshot uuid).
 * @param {Object} exam - Exam document (cần populate nếu dùng legacy, nhưng resolver này hỗ trợ tự query bổ sung).
 * @param {Array} targetQuestionIds - Mảng các ID cần query (tùy chọn, dùng để filter).
 * @returns {Promise<Map>} Map với key là questionId (string), value là thông tin câu hỏi.
 */
export const resolveExamQuestions = async (exam, targetQuestionIds = null) => {
  if (!exam || !exam.questions) return new Map();

  const questionMap = new Map();
  const legacyQuestionIdsToFetch = new Set();
  const examQuestionsConfig = new Map();

  // 1. Phân loại câu hỏi thành snapshot hoặc legacy
  for (const q of exam.questions) {
    if (!q || !q.questionId) continue;

    // Normalize ID an toàn: xử lý populated document
    let rawId = q.questionId;
    if (rawId && typeof rawId === "object" && rawId._id) {
      rawId = rawId._id;
    }
    const qIdStr = rawId.toString();

    // Nếu có filter targetQuestionIds, bỏ qua những câu không nằm trong filter
    if (targetQuestionIds && !targetQuestionIds.includes(qIdStr)) {
      continue;
    }

    examQuestionsConfig.set(qIdStr, q);

    if (q.isSnapshot && q.snapshotData) {
      // Câu hỏi Snapshot
      const data = q.snapshotData;
      questionMap.set(qIdStr, {
        _id: qIdStr,
        questionId: qIdStr,
        source: "snapshot",
        type: data.type || "multiple_choice",
        content: data.content,
        options: data.options || [],
        correctAnswer: data.correctAnswer,
        acceptedAnswers: data.acceptedAnswers || [],
        suggestedAnswer: data.suggestedAnswer,
        rubric: data.rubric,
        points: q.points || 1, // Lấy trọng số từ exam
      });
    } else {
      // Câu hỏi Legacy, nếu được truyền sẵn (populate) thì dùng, ngược lại query
      if (typeof q.questionId === "object" && q.questionId.content) {
        const legacyData = q.questionId;
        questionMap.set(qIdStr, {
          _id: qIdStr,
          questionId: qIdStr,
          source: "legacy",
          type: legacyData.type,
          content: legacyData.content,
          options: legacyData.options || [],
          correctAnswer: legacyData.correctAnswer,
          acceptedAnswers: legacyData.acceptedAnswers || [],
          suggestedAnswer: legacyData.suggestedAnswer,
          rubric: legacyData.rubric,
          points: q.points || 1,
        });
      } else {
        legacyQuestionIdsToFetch.add(qIdStr);
      }
    }
  }

  // 2. Tải các câu hỏi Legacy chưa được populate
  if (legacyQuestionIdsToFetch.size > 0) {
    // S5-FIX-09: Lọc các ID hợp lệ để tránh Mongoose CastError 500
    const validLegacyIds = Array.from(legacyQuestionIdsToFetch).filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );

    if (validLegacyIds.length > 0) {
      const legacyQuestions = await Question.find({
        _id: { $in: validLegacyIds },
      }).lean();

      for (const lq of legacyQuestions) {
        const qIdStr = lq._id.toString();
        const config = examQuestionsConfig.get(qIdStr);
        questionMap.set(qIdStr, {
          _id: qIdStr,
          questionId: qIdStr,
          source: "legacy",
          type: lq.type,
          content: lq.content,
          options: lq.options || [],
          correctAnswer: lq.correctAnswer,
          acceptedAnswers: lq.acceptedAnswers || [],
          suggestedAnswer: lq.suggestedAnswer,
          rubric: lq.rubric,
          points: config?.points || 1,
        });
      }
    }
  }

  return questionMap;
};
