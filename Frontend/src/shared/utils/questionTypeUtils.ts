export const getQuestionType = (type: string | undefined): "choice" | "short_answer" | "essay" | "unknown" => {
  if (!type) return "unknown";
  const t = type.toLowerCase();
  if (["essay", "free_text"].includes(t)) return "essay";
  if (t === "short_answer") return "short_answer";
  if (["mcq", "multiple_choice", "single_choice", "true_false"].includes(t)) return "choice";
  return "unknown";
};

export const isChoiceQuestion = (type: string | undefined): boolean => {
  return getQuestionType(type) === "choice";
};

export const isEssayQuestion = (type: string | undefined): boolean => {
  return getQuestionType(type) === "essay";
};

export const isShortAnswerQuestion = (type: string | undefined): boolean => {
  return getQuestionType(type) === "short_answer";
};

export const getQuestionTypeLabel = (type: string | undefined): string => {
  const t = getQuestionType(type);
  if (t === "essay") return "Tự luận";
  if (t === "short_answer") return "Điền từ";
  return "Trắc nghiệm";
};
