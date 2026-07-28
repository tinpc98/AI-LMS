export const isQuestionActive = (question) => {
  if (!question || typeof question !== "object") {
    return false;
  }
  if (question.isDeleted === true) {
    return false;
  }
  if (question.deletedAt !== undefined && question.deletedAt !== null) {
    return false;
  }
  return true;
};

export const normalizeQuestionPoints = (question) => {
  const points = question?.points;
  if (typeof points !== "number" || !Number.isFinite(points) || points < 0) {
    return 0;
  }
  return points;
};

export const recalculateExamSetMetrics = (examSet) => {
  const questions = Array.isArray(examSet.questions) ? examSet.questions : [];
  const validQuestions = questions.filter(isQuestionActive);

  examSet.questionCount = validQuestions.length;
  examSet.totalPoints = validQuestions.reduce((sum, question) => {
    return sum + normalizeQuestionPoints(question);
  }, 0);

  return {
    questionCount: examSet.questionCount,
    totalPoints: examSet.totalPoints,
  };
};
