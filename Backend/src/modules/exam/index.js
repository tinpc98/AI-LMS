// File: src/modules/exam/index.js
// PUBLIC API của module exam (§3.3).
// Chỉ export model — service/controller là nội bộ module.

export { default as Exam } from "./exam.model.js";

// Quy tắc vòng đời kỳ thi. Export ra ngoài vì HAI nơi cần dùng CHUNG một quy tắc: controller
// (để tính trạng thái hiển thị) và cron job ở tầng jobs/ (để ghi xuống DB). Hai nơi tự tính
// theo hai cách là chắc chắn có ngày lệch nhau.
export {
  isExamExpired,
  resolveDisplayStatus,
  closeExpiredExams,
  findClosedExamIds,
} from "./examLifecycle.service.js";
