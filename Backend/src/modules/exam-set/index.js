// File: src/modules/exam-set/index.js
// PUBLIC API của module exam-set (§3.3). Module cuối cùng được migrate ở Wave 3.2.
//
// NỢ KỸ THUẬT LỚN NHẤT CÒN LẠI: examSet.service.js hiện 2.478 dòng — god service của
// dự án. §4.1 của kế hoạch chỉ định chẻ nó thành 7 service (core / question / version /
// share / import / metrics / access) ở Wave 4, theo thứ tự an toàn: share trước (đã có
// 5 file test bảo vệ), rồi version, import, metrics, question, access, phần còn lại là core.
// Wave 3 chỉ di chuyển, tuyệt đối không đụng vào nội dung file đó.
//
// Cũng ghi nhận: examSet.model.js import examSet.metrics.js (một service) — đây là vi
// phạm no-model-to-upper-layer duy nhất còn lại trong toàn bộ codebase. Model gọi ngược
// lên service là đảo chiều phụ thuộc, sửa ở Wave 4 cùng lúc với việc chẻ god service.

export { default as ExamSet } from "./examSet.model.js";
export { default as ExamSetShare } from "./examSetShare.model.js";
