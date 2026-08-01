// File: src/modules/lesson/index.js
// PUBLIC API của module lesson (§3.3).
//
// LessonProgress được export vì module khác cần đọc tiến độ học: modules/class dùng để
// tính progress của lớp, và learning.controller (gamification) dùng để cập nhật tiến độ.
//
// Phần gamification (learning.routes/controller, ranking, badge, learningActivity) CỐ Ý
// không gom vào đây: learning.routes.js đang trộn hai nhóm endpoint khác nhau —
// /progress/* thuộc lesson, còn /ranking, /badges, /activities thuộc module badge theo
// §2.1. Tách đôi router đó là thay đổi hành vi, không thuộc phạm vi wave chỉ-di-chuyển;
// xử lý khi migrate module badge.

// CỐ Ý KHÔNG export router ở đây — xem ghi chú "vì sao" ở src/routes/index.js.
// Tóm tắt: re-export router khiến việc import module để lấy MODEL lại kéo theo cả
// controller của nó, sinh vòng phụ thuộc xuyên module.
export { default as Lesson } from "./lesson.model.js";
export { default as LessonProgress } from "./lessonProgress.model.js";
