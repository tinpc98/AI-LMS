// File: src/modules/classSession/index.js
// PUBLIC API của module classSession (§3.3).
//
// File này trước đây bị thiếu dù package.json "imports" đã khai báo #modules/classSession trỏ
// tới nó — vô hại vì không ai import bare specifier, chỉ dùng qua wildcard #modules/classSession/*.
// Tạo lại khi class/escalation.service.js (EduSpace mechanism design Phần B.1) cần import
// ClassSession đúng ranh giới module (no-cross-module-internals), không đi vòng qua deep path.

export { default as ClassSession } from "./classSession.model.js";
