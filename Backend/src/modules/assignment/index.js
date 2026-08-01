// File: src/modules/assignment/index.js
// PUBLIC API của module assignment (§3.3).
//
// VÌ SAO SUBMISSION NẰM TRONG ĐÂY thay vì là module riêng như §2.1 đề xuất:
// hiện KHÔNG tồn tại tầng riêng cho submission. assignment.repository.js có 15 tham
// chiếu Assignment và 13 tham chiếu Submission — một repository phục vụ cả hai; service
// và controller cũng vậy (nộp bài, chấm điểm, rút bài đều nằm trong assignment.*).
//
// Tách submission thành module riêng đòi hỏi chẻ đôi repository/service/controller —
// đó là refactor logic, thuộc Wave 4, KHÔNG phải thao tác di chuyển của Wave 3. Tạo một
// thư mục modules/submission/ chỉ chứa mỗi file model trong khi toàn bộ logic của nó nằm
// ở module khác thì chỉ là bắt chước hình thức, không phải ranh giới module thật.
//
// ĐIỀU KIỆN ĐỂ TÁCH (làm ở Wave 4): chẻ assignment.repository.js thành
// assignment.repository.js + submission.repository.js, rồi mới tách service/controller.
//
// canViewSubmission cố ý KHÔNG export: nó chỉ được assignment.routes.js dùng, tức nội bộ.

export { default as Assignment } from "./assignment.model.js";
export { default as Submission } from "./submission.model.js";
