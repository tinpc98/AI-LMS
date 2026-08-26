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

// TÍNH NĂNG MỚI (mục 5): awardXpService được các module khác gọi khi có 1 kết quả đã xác minh
// (lesson/lessonProgress, attendance...). Chỉ import learningActivity.model.js + xp.js (thuần,
// không phụ thuộc module khác) nên an toàn để export ở barrel — không kéo theo phụ thuộc xuyên
// module ẩn như bài học "over-eager barrel export" ở topic/index.js.
export {
  awardXpService,
  getLifetimeXpService,
  resolveActiveClassIdForStudent,
} from "./xp.service.js";
export { XP_TABLE } from "./xp.js";

// TÍNH NĂNG MỚI (mục 4): các module khác gọi khi có 1 sự kiện có thể liên quan tới badge. Chỉ
// import learningActivity.model.js + gamification.service.js (không phụ thuộc module khác) nên
// an toàn để export ở barrel.
export {
  checkAndAwardGettingStartedBadge,
  checkAndAwardPerfectScoreBadge,
  checkAndAwardConquerorBadge,
  checkAndAwardPersistentBadge,
  checkAndAwardDiligentBadge,
  checkAndAwardOnTimeBadge,
} from "./badgeAward.service.js";
