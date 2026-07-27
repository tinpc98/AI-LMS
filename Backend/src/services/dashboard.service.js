import mongoose from "mongoose";
import User from "../models/user.models.js";
import classModel from "../models/class.model.js";
import Course from "../models/course.model.js";
import Submission from "../models/submission.model.js";
import Exam from "../models/exam.model.js";
import gradeService from "./grade.service.js";

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

  /**
   * Tổng hợp số liệu thống kê cho Teacher Dashboard.
   *
   * @param {string} teacherId - ID của giáo viên
   * @returns {Promise<Object>} Object chứa các metrics của giáo viên.
   */
  async getTeacherMetrics(teacherId) {
    // 1. Lấy danh sách ID các lớp học mà giáo viên này phụ trách
    const activeClasses = await classModel.find({ teacherId, isDeleted: false }).select("_id").lean();
    const classIds = activeClasses.map((cls) => cls._id);

    // 2. Chạy song song các query thống kê phụ thuộc vào classIds
    const [pendingGradingSubmissions, upcomingExams] = await Promise.all([
      // Tổng số bài nộp chờ chấm điểm
      Submission.countDocuments({
        classId: { $in: classIds },
        isDeleted: false,
        $or: [{ status: "submitted" }, { grade: null }]
      }),

      // Các kỳ thi sắp diễn ra (startTime trong tương lai)
      Exam.countDocuments({
        classId: { $in: classIds },
        isDeleted: false,
        startTime: { $gt: new Date() }
      })
    ]);

    return {
      assignedClassesCount: classIds.length,
      pendingGradingSubmissions,
      upcomingExams,
    };
  }

  /**
   * Tổng hợp số liệu thống kê cho Student Dashboard.
   *
   * @param {string} studentId - ID của học sinh
   * @returns {Promise<Object>} Object chứa các metrics của học sinh.
   */
  async getStudentMetrics(studentId) {
    // 1. Lấy danh sách ID các lớp học mà học sinh đã tham gia
    const activeClasses = await classModel.find({ "students.studentId": studentId, isDeleted: false }).select("_id").lean();
    const classIds = activeClasses.map((cls) => cls._id);

    // 2. Tính số lượng bài tập chờ nộp (pendingAssignmentsCount)
    // - Bài tập thuộc các lớp học đang tham gia
    // - Hạn nộp trong tương lai (dueDate/deadline > now)
    // - Học sinh CHƯA nộp bài (không có trong collection Submission)
    const assignments = await Assignment.find({ 
      classId: { $in: classIds }, 
      isDeleted: false, 
      deadline: { $gt: new Date() } 
    }).select("_id").lean();
    
    const assignmentIds = assignments.map(a => a._id);
    
    const submissions = await Submission.find({ 
      studentId, 
      assignmentId: { $in: assignmentIds }, 
      isDeleted: false 
    }).select("assignmentId").lean();
    
    const submittedAssignmentIds = submissions.map(s => s.assignmentId.toString());
    const pendingAssignmentsCount = assignmentIds.filter(id => !submittedAssignmentIds.includes(id.toString())).length;

    // 3. Lấy danh sách kỳ thi sắp tới (giới hạn 5)
    const upcomingExams = await Exam.find({ 
      classId: { $in: classIds }, 
      isDeleted: false, 
      startTime: { $gt: new Date() } 
    })
      .select("title startTime duration classId")
      .limit(5)
      .lean();

    // 4. Tính điểm GPA trung bình qua các lớp học
    let totalGpa = 0;
    let validGpaCount = 0;

    await Promise.all(classIds.map(async (classId) => {
      try {
        const result = await gradeService.calculateStudentGPA(studentId, classId);
        if (result && result.gpa !== null) {
          totalGpa += result.gpa;
          validGpaCount++;
        }
      } catch (error) {
        // Bỏ qua nếu có lỗi tính GPA cho lớp học (ví dụ: lớp chưa cài đặt trọng số)
      }
    }));

    const gpaAverage = validGpaCount > 0 ? Number((totalGpa / validGpaCount).toFixed(2)) : 0;

    return {
      enrolledClassesCount: classIds.length,
      pendingAssignmentsCount,
      upcomingExams,
      gpaAverage,
    };
  }
}

export default new DashboardService();
