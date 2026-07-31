// File: src/services/classProgress.service.js
// Ghép tầng truy vấn (classProgress.repository.js) với công thức thuần
// (classProgressCalculator.js). Tầng controller chỉ gọi hàm này, không tự truy vấn.
import { collectProgressTotals } from "../repositories/classProgress.repository.js";
import { buildProgressMap } from "./classProgressCalculator.js";

/**
 * Tính tiến độ của một học sinh trên danh sách lớp.
 *
 * @param {string} studentId
 * @param {Array<string|ObjectId>} classIds
 * @returns {Promise<Map<string, number|null>>} classId (chuỗi) -> tiến độ 0-100 hoặc null.
 */
export const getStudentProgressByClass = async (studentId, classIds = []) => {
  if (!studentId || classIds.length === 0) return new Map();
  const totals = await collectProgressTotals(studentId, classIds);
  return buildProgressMap(classIds, totals);
};

/**
 * Gắn field `progress` vào từng phần tử của danh sách lớp đã lấy từ DB.
 *
 * Chỉ dùng cho học sinh: với giáo viên/admin, "tiến độ của tôi trong lớp" không có ý nghĩa
 * nên trả về danh sách nguyên trạng, tránh tốn thêm 4 query cho mỗi lần liệt kê lớp.
 *
 * @param {Array<Object>} classList - kết quả .lean() từ classModel.
 * @param {Object} viewer - { id, role }
 * @returns {Promise<Array<Object>>}
 */
export const attachStudentProgress = async (classList = [], viewer = {}) => {
  const role = String(viewer.role || "").toLowerCase();
  if (role !== "student" || !viewer.id || classList.length === 0) return classList;

  const classIds = classList.map((item) => item._id).filter(Boolean);
  const progressMap = await getStudentProgressByClass(viewer.id, classIds);

  return classList.map((item) => ({
    ...item,
    // null = lớp chưa có bài giảng/bài tập nào để tính; tầng UI hiển thị "—".
    progress: progressMap.has(String(item._id)) ? progressMap.get(String(item._id)) : null,
  }));
};

export default { getStudentProgressByClass, attachStudentProgress };
