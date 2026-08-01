// File: src/modules/badge/index.js
// PUBLIC API của module badge (§3.3).
//
// LearningActivity được export vì modules/lesson ghi nhật ký hoạt động khi học sinh xem
// hoặc hoàn thành bài giảng — phụ thuộc nghiệp vụ hợp lệ lesson -> badge.
//
// badge.routes.js KHÔNG export ở đây: composition root src/routes/index.js trỏ thẳng vào
// nó, đúng nguyên tắc đã chốt ở Wave 3.4 (index.js không re-export thứ mà file nội bộ
// module cũng cần).

export { default as StudentBadge } from "./studentBadge.model.js";
export { default as LearningActivity } from "./learningActivity.model.js";

// learningRankingService được export vì analytics.controller (tầng đọc tổng hợp, chưa
// migrate) cần bảng xếp hạng lớp để dựng báo cáo.
export { default as learningRankingService } from "./learningRanking.service.js";
