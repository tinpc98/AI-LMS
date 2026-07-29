import mongoose from "mongoose";
import User from "../models/user.models.js";
import classModel from "../models/class.model.js";
import Course from "../models/course.model.js";

/**
 * Chuyển đổi readyState của Mongoose sang chuỗi có ý nghĩa.
 * 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
const resolveDbStatus = (readyState) => {
  const stateMap = {
    0: "DISCONNECTED",
    1: "CONNECTED",
    2: "CONNECTING",
    3: "DISCONNECTING",
  };
  return stateMap[readyState] ?? "UNKNOWN";
};

class DashboardService {
  /**
   * Tổng hợp toàn bộ số liệu thống kê cho Admin Dashboard.
   * Tất cả các truy vấn được thực thi đồng thời bằng Promise.all()
   * để đạt hiệu năng tối ưu.
   *
   * @returns {Promise<Object>} Object chứa các metrics của hệ thống.
   */
  async getAdminMetrics() {
    // Chạy song song tất cả các query đếm – không await tuần tự
    const [
      totalUsers,
      activeTeachers,
      activeStudents,
      totalClasses,
      totalCourses,
    ] = await Promise.all([
      // Tổng người dùng chưa bị xóa mềm (mọi role)
      User.countDocuments({ isDeleted: false }),

      // Giáo viên đang hoạt động
      // Lưu ý: role dùng PascalCase ("Teacher") theo enum của User model
      User.countDocuments({ role: "Teacher", status: "Active", isDeleted: false }),

      // Học sinh đang hoạt động
      User.countDocuments({ role: "Student", status: "Active", isDeleted: false }),

      // Tổng lớp học chưa bị xóa mềm
      // softDeletePlugin tự động filter isDeleted: false trên find/countDocuments
      // nên chỉ cần gọi countDocuments({}) cũng đúng; truyền tường minh cho rõ ràng
      classModel.countDocuments({ isDeleted: false }),

      // Tổng khóa học chưa bị xóa mềm
      Course.countDocuments({ isDeleted: false }),
    ]);

    // Thông tin sức khỏe hệ thống – lấy từ runtime, không cần DB query
    const systemHealth = {
      status: mongoose.connection.readyState === 1 ? "HEALTHY" : "DEGRADED",
      dbConnection: resolveDbStatus(mongoose.connection.readyState),
      uptimeSeconds: Math.floor(process.uptime()),
    };

    return {
      totalUsers,
      activeTeachers,
      activeStudents,
      totalClasses,
      totalCourses,
      systemHealth,
    };
  }
}

export default new DashboardService();
