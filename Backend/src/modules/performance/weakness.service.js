import Weakness from "./weakness.model.js";

// Constants for minimum evidence
export const MIN_QUESTIONS = 5;

// Constants for Severity Thresholds
export const SEVERITY_THRESHOLDS = {
  LOW: 70, // 70% -> 84%
  MEDIUM: 50, // 50% -> 69%
  HIGH: 30, // 30% -> 49%
  CRITICAL: 0, // < 30%
};

const determineSeverity = (accuracy) => {
  if (accuracy >= SEVERITY_THRESHOLDS.LOW) return "LOW";
  if (accuracy >= SEVERITY_THRESHOLDS.MEDIUM) return "MEDIUM";
  if (accuracy >= SEVERITY_THRESHOLDS.HIGH) return "HIGH";
  return "CRITICAL";
};

export const evaluateWeaknessService = async (performance) => {
  // Bỏ qua nếu chưa đủ data (MIN_QUESTIONS)
  if (performance.answeredQuestions < MIN_QUESTIONS) return;

  // Nếu accuracy >= 85 (MASTERED), không tính là Weakness (hoặc chuyển thành IMPROVED nếu đã tồn tại)
  if (performance.accuracy >= 85) {
    const existingWeakness = await Weakness.findOne({
      studentId: performance.studentId,
      courseId: performance.courseId,
      topicId: performance.topicId,
    });
    
    if (existingWeakness) {
      await Weakness.findByIdAndDelete(existingWeakness._id);
    }
    return;
  }

  const weaknessScore = parseFloat((100 - performance.accuracy).toFixed(2));
  const severity = determineSeverity(performance.accuracy);

  const filter = {
    studentId: performance.studentId,
    courseId: performance.courseId,
    topicId: performance.topicId,
  };

  const update = {
    weaknessScore,
    accuracy: performance.accuracy,
    attemptCount: performance.totalAttempts,
    correctCount: performance.correctAnswers,
    incorrectCount: performance.incorrectAnswers,
    severity,
    evidence: `Student scored ${performance.accuracy}% on this topic across ${performance.answeredQuestions} questions.`,
    lastCalculatedAt: new Date(),
  };

  await Weakness.findOneAndUpdate(
    filter,
    update,
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};
