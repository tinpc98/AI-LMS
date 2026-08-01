// File: src/modules/question/index.js
// PUBLIC API của module question (§3.3).
// Chỉ export model — service/controller/routes là nội bộ module.

export { default as Question } from "./question.model.js";

// Lõi validation câu hỏi được dùng lại bởi module exam-set: câu hỏi trong một bộ đề
// CHÍNH LÀ câu hỏi, nên quy tắc kiểm tra loại/điểm/rubric phải dùng chung một nguồn.
// Trước Wave 3.2 chúng nằm chung file god validators.js nên quan hệ này bị che khuất.
export {
  QUESTION_TYPES,
  DIFFICULTY_LEVELS,
  validateScore,
  validatePoints,
  validateRubricPayload,
  runCreateTypeSpecificValidators,
  runUpdateTypeSpecificValidators,
} from "./question.validator.js";
