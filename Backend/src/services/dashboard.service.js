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
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);
    oneYearAgo.setHours(0, 0, 0, 0);

    // Chạy song song tất cả các query đếm & aggregation – không await tuần tự
    const [
      totalUsers,
      activeTeachers,
      activeStudents,
      totalClasses,
      totalCourses,
      // Các query bổ sung cho UI
      activeClasses,
      assignedClasses,
      unassignedClasses,
      classStatusChart,
      courseDistribution,
      recentClasses,
      recentUsers,
      rawStudentReg
    ] = await Promise.all([
      // Tổng người dùng chưa bị xóa mềm (mọi role)
      User.countDocuments({ isDeleted: false }),

      // Giáo viên đang hoạt động
      User.countDocuments({ role: "Teacher", status: "Active", isDeleted: false }),

      // Học sinh đang hoạt động
      User.countDocuments({ role: "Student", status: "Active", isDeleted: false }),

      // Tổng lớp học chưa bị xóa mềm
      classModel.countDocuments({ isDeleted: false }),

      // Tổng khóa học chưa bị xóa mềm
      Course.countDocuments({ isDeleted: false }),

      // PART 1: KPI Metrics bổ sung
      // Theo schema của classModel, trạng thái "Ongoing" tương đương với "Active" ở UI
      classModel.countDocuments({ status: "Ongoing", isDeleted: false }),
      
      // Lớp đã được phân công giáo viên
      classModel.countDocuments({ teacherId: { $ne: null }, isDeleted: false }),
      
      // Lớp chưa được phân công giáo viên
      classModel.countDocuments({ teacherId: null, isDeleted: false }),

      // PART 2: Class Status Summary
      classModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $project: { _id: 0, status: "$_id", count: 1 } }
      ]),

      // PART 3: Course Distribution
      classModel.aggregate([
        { $match: { isDeleted: false } },
        { $group: { _id: "$courseId", classCount: { $sum: 1 } } },
        {
          $lookup: {
            from: "courses", // mongoose auto-pluralizes "Course" to "courses"
            localField: "_id",
            foreignField: "_id",
            as: "courseInfo"
          }
        },
        { $unwind: "$courseInfo" },
        // Lọc bỏ những course đã bị xóa mềm
        { $match: { "courseInfo.isDeleted": false } },
        {
          $project: {
            _id: 0,
            courseId: "$_id",
            courseName: "$courseInfo.courseName",
            subject: "$courseInfo.subject",
            classCount: 1
          }
        },
        { $sort: { classCount: -1 } }
      ]),

      // PART 4: Recent Classes (Lấy 5 lớp mới nhất)
      // Dùng aggregation để xử lý thêm trường studentCount một cách chính xác
      classModel.aggregate([
        { $match: { isDeleted: false } },
        { $sort: { createdAt: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: "users",
            localField: "teacherId",
            foreignField: "_id",
            as: "teacher"
          }
        },
        { $unwind: { path: "$teacher", preserveNullAndEmptyArrays: true } },
        {
          $lookup: {
            from: "courses",
            localField: "courseId",
            foreignField: "_id",
            as: "course"
          }
        },
        { $unwind: { path: "$course", preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            studentCount: "$currentStudents"
          }
        },
        {
          $project: {
            className: 1,
            classCode: 1,
            currentStudents: 1,
            maxStudents: 1,
            status: 1,
            createdAt: 1,
            teacher: {
              fullName: 1,
              email: 1
            },
            course: {
              courseName: 1
            },
            studentCount: 1
          }
        }
      ]),

      // PART 5: Recent Users (Lấy 5 người dùng mới nhất)
      User.find({ isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("fullName email avatar role status createdAt")
        .lean(),

      // PART 6: Student Registration Chart (Raw Aggregation)
      User.aggregate([
        {
          $match: {
            role: "Student",
            isDeleted: false,
            createdAt: { $gte: oneYearAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" }
            },
            count: { $sum: 1 }
          }
        }
      ])
    ]);

    // PROCESS STUDENT REGISTRATION CHART
    const monthsName = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const studentRegistrationChart = [];
    
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const y = d.getFullYear();
      const m = d.getMonth() + 1; // 1-12
      
      const found = rawStudentReg.find(item => item._id.year === y && item._id.month === m);
      studentRegistrationChart.push({
        month: monthsName[m - 1],
        count: found ? found.count : 0
      });
    }

    // PART 6: Thông tin sức khỏe hệ thống – giữ nguyên
    const systemHealth = {
      status: mongoose.connection.readyState === 1 ? "HEALTHY" : "DEGRADED",
      dbConnection: resolveDbStatus(mongoose.connection.readyState),
      uptimeSeconds: Math.floor(process.uptime()),
    };

    return {
      // Giữ nguyên các field cũ
      totalUsers,
      activeTeachers,
      activeStudents,
      totalClasses,
      totalCourses,
      systemHealth,
      // Các field bổ sung mới
      activeClasses,
      assignedClasses,
      unassignedClasses,
      classStatusChart,
      courseDistribution,
      recentClasses,
      recentUsers,
      studentRegistrationChart
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
