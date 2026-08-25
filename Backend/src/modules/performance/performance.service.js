import StudentPerformance from "./studentPerformance.model.js";
import PerformanceEvidence from "./performanceEvidence.model.js";
import Question from "../question/question.model.js";
import Topic from "../topic/topic.model.js";
import { evaluateWeaknessService } from "./weakness.service.js";

// Các ngưỡng Performance được config cứng (Constants) như thiết kế MVP
export const PERFORMANCE_THRESHOLDS = {
  MASTERED: 85,
  PROFICIENT: 70,
  DEVELOPING: 50,
  FOUNDATIONAL: 0,
};

export const getMasteryLevel = (accuracy) => {
  if (accuracy >= PERFORMANCE_THRESHOLDS.MASTERED) return "MASTERED";
  if (accuracy >= PERFORMANCE_THRESHOLDS.PROFICIENT) return "PROFICIENT";
  if (accuracy >= PERFORMANCE_THRESHOLDS.DEVELOPING) return "DEVELOPING";
  return "FOUNDATIONAL";
};

export const processAttemptPerformanceService = async (attempt, attemptType) => {
  if (!attempt.studentId) return;

  const validQuestions = attempt.questions.filter(aq => aq.isCorrect !== null && aq.isCorrect !== undefined);
  if (validQuestions.length === 0) return;

  const questionIds = validQuestions.map(aq => aq.questionId);

  // 1. Check existing evidence in bulk
  const existingEvidences = await PerformanceEvidence.find({
    studentId: attempt.studentId,
    sourceType: attemptType,
    sourceId: attempt._id,
    questionId: { $in: questionIds }
  }).lean();
  
  const existingQIds = new Set(existingEvidences.map(e => e.questionId.toString()));

  // 2. Fetch missing Questions in bulk
  const questionsToProcess = validQuestions.filter(aq => !existingQIds.has(aq.questionId.toString()));
  if (questionsToProcess.length === 0) return;

  const qIdsToProcess = questionsToProcess.map(aq => aq.questionId);
  const questionsDb = await Question.find({ _id: { $in: qIdsToProcess } }, "topicId").lean();
  
  const topicIds = [...new Set(questionsDb.map(q => q.topicId).filter(Boolean))];
  const topicsDb = await Topic.find({ _id: { $in: topicIds } }, "courseId").lean();
  
  const topicMap = new Map();
  topicsDb.forEach(t => topicMap.set(t._id.toString(), t.courseId));
  
  const questionMap = new Map();
  questionsDb.forEach(q => {
    if (q.topicId) {
      const courseId = topicMap.get(q.topicId.toString());
      if (courseId) {
        questionMap.set(q._id.toString(), { topicId: q.topicId, courseId });
      }
    }
  });

  const topicStatsMap = new Map();
  const evidencesToCreate = [];

  for (const aq of questionsToProcess) {
    const meta = questionMap.get(aq.questionId.toString());
    if (!meta) continue;

    const { topicId, courseId } = meta;

    evidencesToCreate.push({
      studentId: attempt.studentId,
      courseId,
      topicId,
      sourceType: attemptType,
      sourceId: attempt._id,
      questionId: aq.questionId,
      isCorrect: aq.isCorrect,
    });

    const key = `${courseId.toString()}_${topicId.toString()}`;
    if (!topicStatsMap.has(key)) {
      topicStatsMap.set(key, { courseId, topicId, total: 0, correct: 0 });
    }

    const stat = topicStatsMap.get(key);
    stat.total += 1;
    if (aq.isCorrect) {
      stat.correct += 1;
    }
  }

  if (evidencesToCreate.length > 0) {
    await PerformanceEvidence.insertMany(evidencesToCreate);
  }

  // Cập nhật StudentPerformance
  const now = new Date();
  const updatedPerformances = [];

  for (const [_, stat] of topicStatsMap) {
    const filter = {
      studentId: attempt.studentId,
      courseId: stat.courseId,
      topicId: stat.topicId,
    };

    let perf = await StudentPerformance.findOneAndUpdate(
      filter,
      {
        $inc: {
          totalQuestions: stat.total,
          answeredQuestions: stat.total,
          correctAnswers: stat.correct,
          incorrectAnswers: stat.total - stat.correct,
          totalAttempts: 1, // Đếm tổng số submit qua các topic
        },
        $set: {
          lastAttemptAt: now,
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Tính lại accuracy và masteryLevel
    const accuracy = perf.answeredQuestions > 0 ? (perf.correctAnswers / perf.answeredQuestions) * 100 : 0;
    perf.accuracy = parseFloat(accuracy.toFixed(2));
    perf.masteryLevel = getMasteryLevel(perf.accuracy);
    await perf.save();

    updatedPerformances.push(perf);
  }

  // Kích hoạt Weakness Detector
  for (const perf of updatedPerformances) {
    await evaluateWeaknessService(perf);
  }
};
