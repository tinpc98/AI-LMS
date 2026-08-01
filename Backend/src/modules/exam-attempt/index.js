// File: src/modules/exam-attempt/index.js
// PUBLIC API của module exam-attempt (§3.3).
//
// examQuestionResolver được export vì module ai (aiGrading.service) cần dựng lại danh
// sách câu hỏi của một lượt thi để chấm tự động — phụ thuộc nghiệp vụ hợp lệ giữa hai module.
//
// answerScoring.js là logic so khớp đáp án dùng để CHẤM ĐIỂM, có bộ test riêng ở
// tests/unit/answerScoring.test.js. Nội bộ module.

export { default as ExamAttempt } from "./examAttempt.model.js";
export * from "./examQuestionResolver.js";

// Socket handler nam canh nghiep vu (§3.4); infra/socket/registerHandlers.js lo dang ky.
