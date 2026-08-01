// File: src/services/classProgressCalculator.js
// Module tính tiến độ học tập THUẦN — không phụ thuộc Mongoose/req/res, chỉ nhận và trả
// plain object. Tách riêng theo đúng khuôn mẫu đã có ở gradeCalculator.js (PR-09) để có
// thể unit test toàn bộ nhánh biên mà không cần DB.
//
// Công thức (chốt với PO ngày 2026-07-31 — "Hybrid granular 50/50"):
//   thành phần bài giảng  = tổng lessonProgress.progress / (số bài giảng đang mở × 100)
//   thành phần bài tập    = số bài đã nộp / tổng số bài tập
//   tiến độ               = trung bình các thành phần CÓ dữ liệu, quy về thang 0-100
//
// Vì sao lấy trung bình các thành phần "có dữ liệu" thay vì cứng 0.5/0.5:
// lớp chỉ có bài giảng mà không có bài tập sẽ vĩnh viễn kẹt ở tối đa 50% nếu nhân cứng
// hệ số. Lấy trung bình theo số thành phần hiện diện chính là 50/50 đã được chuẩn hoá lại,
// và tự động thành 100/0 khi lớp chỉ có một loại nội dung.

const clampRatio = (value) => {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return value > 1 ? 1 : value;
};

/**
 * Tính tiến độ của MỘT học sinh trong MỘT lớp.
 *
 * @param {Object} input
 * @param {number} input.totalLessons        Số bài giảng đang mở của lớp (đã loại soft-delete/unpublished).
 * @param {number} input.lessonProgressSum   Tổng field `progress` (0-100) của học sinh trên các bài giảng đó.
 * @param {number} input.totalAssignments    Tổng số bài tập đang hoạt động của lớp.
 * @param {number} input.submittedAssignments Số bài tập học sinh đã nộp (không tính withdrawn).
 * @returns {number|null} Tiến độ 0-100 đã làm tròn, hoặc `null` khi lớp chưa có nội dung nào
 *                        để tính — chủ ý trả null thay vì 0 để tầng UI hiển thị "—" chứ không
 *                        khẳng định sai rằng học sinh đạt 0%.
 */
export const computeClassProgress = ({
  totalLessons = 0,
  lessonProgressSum = 0,
  totalAssignments = 0,
  submittedAssignments = 0,
} = {}) => {
  const components = [];

  if (totalLessons > 0) {
    // Bài giảng học sinh chưa từng mở không có document LessonProgress, nên không đóng góp
    // vào tử số nhưng VẪN nằm ở mẫu số — đây chính là chỗ analytics.service.js đang tính sai
    // (nó lấy mẫu số là số document progress, khiến học sinh mở 2/10 bài mà xong cả 2 ra 100%).
    components.push(clampRatio(lessonProgressSum / (totalLessons * 100)));
  }

  if (totalAssignments > 0) {
    components.push(clampRatio(submittedAssignments / totalAssignments));
  }

  if (components.length === 0) return null;

  const average = components.reduce((sum, value) => sum + value, 0) / components.length;
  return Math.round(average * 100);
};

/**
 * Dựng bản đồ tiến độ cho nhiều lớp cùng lúc từ các số liệu đã gom sẵn.
 * Tách riêng để tầng repository chỉ lo truy vấn, còn phần ghép số nằm ở đây và test được.
 *
 * @param {string[]} classIds
 * @param {Object} totals - { [classId]: { totalLessons, lessonProgressSum, totalAssignments, submittedAssignments } }
 * @returns {Map<string, number|null>}
 */
export const buildProgressMap = (classIds = [], totals = {}) => {
  const map = new Map();
  for (const classId of classIds) {
    const key = String(classId);
    map.set(key, computeClassProgress(totals[key]));
  }
  return map;
};
