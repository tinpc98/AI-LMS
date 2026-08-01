// File: src/modules/exam-set/examSetStatus.js
// Quy tắc trạng thái bộ đề — bộ đề ở trạng thái nào thì còn sửa được.
//
// Tách riêng ở Wave 4.1 vì đây là thứ DUY NHẤT mà cả nhóm core lẫn nhóm question đều
// cần. Nếu để nó ở một trong hai file, file kia phải import ngược lại — dễ dẫn tới phụ
// thuộc vòng khi hai file cùng lớn lên. Một file nhỏ độc lập thì cả hai cùng phụ thuộc
// vào nó, không ai phụ thuộc vào ai.

const EDITABLE_EXAM_STATUSES = ["draft"];

export const isEditableExamSetStatus = (status) => {
  return EDITABLE_EXAM_STATUSES.includes(String(status).toLowerCase());
};
