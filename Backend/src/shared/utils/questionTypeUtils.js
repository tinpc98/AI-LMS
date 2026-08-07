/**
 * questionTypeUtils.js
 * Utility to classify question types consistently across backend.
 */

export const normalizeQuestionType = (type) => {
  if (!type) return "UNKNOWN";
  const t = type.toLowerCase();
  
  if (t === "mcq" || t === "multiple_choice" || t === "single_choice") return "CHOICE";
  if (t === "essay" || t === "free_text") return "ESSAY";
  if (t === "true_false") return "TRUE_FALSE";
  if (t === "short_answer") return "SHORT_ANSWER";
  
  return "UNKNOWN";
};
