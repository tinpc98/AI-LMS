// File: src/modules/grade/index.js
// PUBLIC API của module grade (§3.3).
//
// gradeCalculator.js là module tính điểm THUẦN (không phụ thuộc Mongoose), có bộ unit
// test riêng ở tests/unit/gradeCalculator.test.js. Nó là nội bộ module — bên ngoài chỉ
// cần model Grade.

export { default as Grade } from "./grade.model.js";
