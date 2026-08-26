// File: src/modules/class/index.js
// PUBLIC API của module class (§3.3).
//
// Cố ý KHÔNG export: class.service, class.controller, class.validator và cả 3 file
// classProgress* — đó là nội bộ module.

export { default as Class } from "./class.model.js";
export { default as CommitmentEvent, COMMITMENT_REASONS } from "./commitmentEvent.model.js";
export { checkClassTeacherOwnership } from "./class.ownership.js";
export { checkClassAccess } from "./class.access.middleware.js";

// modules/badge (learningRanking.service.js) gọi để lấy đúng danh sách bài giảng/bài tập
// của một lớp (qua Class.courseId -> Topic -> Lesson/Assignment) khi tính điểm XP.
export { resolveClassContentIds } from "./classProgress.repository.js";

// src/jobs/cohortEscalation.job.js (EduSpace mechanism design Phần B.1) cần quét buổi quá giờ
// và tự động thử kích hoạt dự bị theo lịch cron — không nằm trong module class nên phải qua
// public API này, không deep-import.
export { findOverdueSessions, escalateLevel1 } from "./escalation.service.js";

// LƯU Ý NỢ KỸ THUẬT: verifyClassTeacherAccess (classAuth.helper.js) và
// checkClassTeacherOwnership (class.ownership.js) làm gần như CÙNG một việc — kiểm tra
// giáo viên có phụ trách lớp hay không — chỉ khác cách báo lỗi (ném exception vs trả
// boolean). Sự trùng lặp này có sẵn từ trước, chỉ lộ ra khi gom về một module.
// Wave 3 là wave chỉ-di-chuyển nên giữ nguyên cả hai; hợp nhất ở Wave 4.
export { verifyClassTeacherAccess } from "./classAuth.helper.js";
