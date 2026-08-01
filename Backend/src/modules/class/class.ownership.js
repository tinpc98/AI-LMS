// File: src/modules/class/class.ownership.js
// Kiểm tra quyền sở hữu lớp học của Giáo viên (hoặc Admin).
//
// Tách từ shared/middlewares/ownership.middleware.js ở Wave 3.2. Nó đọc model Class nên
// là logic của module class, không phải hạ tầng dùng chung — để ở shared/ sẽ vi phạm
// no-shared-to-modules ngay khi class.model.js chuyển vào đây.
//
// 11 nơi khác đang dùng hàm này, tất cả đi qua public API #modules/class.
import ClassModel from "./class.model.js";

export const checkClassTeacherOwnership = async (classId, userId, userRole) => {
  if (!classId) return false;
  const role = (userRole || "").toLowerCase();
  if (role === "admin") return true;
  if (role !== "teacher") return false;

  const targetClass = await ClassModel.findById(classId);
  if (!targetClass) return false;

  return targetClass.teacherId?.toString() === userId?.toString();
};
