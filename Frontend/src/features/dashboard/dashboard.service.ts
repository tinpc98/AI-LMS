import axiosClient from "../../api/axiosClient";
import type { DashboardResponse, DashboardData, OverviewCardItem, RegistrationChartItem, CourseDistributionItem, ClassStatusItem, AIUsageItem, TodayClassRecord } from "./dashboard.types";
import { mockUsers } from "../accountManagement/account.mock";
import { mockCourses } from "../courseManagement/course.mock";
import { mockClasses } from "../classManagement/class.mock";
import { mockAILogs } from "../aiManagement/mock/aiLogs.mock";
import { mockLiveSessions } from "../classManagement/liveSessions.mock";
import { mockNotifications } from "../notifications/notifications.mock";

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

export const dashboardService = {
  async getAdminDashboard(): Promise<DashboardResponse> {
    const res = await axiosClient.get("/api/dashboard/admin");
    return res.data.data;
  },

  async getDashboardData(): Promise<DashboardData> {
    await delay(300); // Simulate network fetch

    // 1. Calculate Core Statistics
    const students = mockUsers.filter((user) => user.role === "Student");
    const teachers = mockUsers.filter((user) => user.role === "Teacher");
    const totalStudents = students.length || 1850; // Use mock count or fallback for realistic dashboard
    const totalTeachers = teachers.length || 42;
    const totalCourses = mockCourses.length || 18;
    const totalClasses = mockClasses.length || 36;
    const activeClasses = mockClasses.filter((c) => c.status === "Active").length;
    const pendingAssignments = mockClasses.filter((c) => !c.teacherId).length;
    const todayAIRequests = mockAILogs.length ? mockAILogs.length * 15 + 120 : 348;
    const liveClasses = mockLiveSessions.filter((s) => s.status === "Live").length;

    // 2. Build 8 Overview Cards
    const overviewCards: OverviewCardItem[] = [
      {
        key: "totalStudents",
        title: "Tổng Học Sinh",
        value: totalStudents,
        trend: 14.2,
        trendType: "up",
        trendLabel: "vs tháng trước",
        color: "#1677ff",
        bgColor: "#e6f4ff",
        iconName: "UserOutlined",
      },
      {
        key: "totalTeachers",
        title: "Tổng Giáo Viên",
        value: totalTeachers,
        trend: 5.0,
        trendType: "up",
        trendLabel: "vs tháng trước",
        color: "#722ed1",
        bgColor: "#f9f0ff",
        iconName: "TeamOutlined",
      },
      {
        key: "totalCourses",
        title: "Tổng Khóa Học",
        value: totalCourses,
        trend: 8.3,
        trendType: "up",
        trendLabel: "vs tháng trước",
        color: "#13c2c2",
        bgColor: "#e6fffb",
        iconName: "BookOutlined",
      },
      {
        key: "totalClasses",
        title: "Tổng Lớp Học",
        value: totalClasses,
        trend: 12.0,
        trendType: "up",
        trendLabel: "vs tháng trước",
        color: "#fa8c16",
        bgColor: "#fff7e6",
        iconName: "SolutionOutlined",
      },
      {
        key: "activeClasses",
        title: "Lớp Đang Hoạt Động",
        value: activeClasses,
        trend: 6.5,
        trendType: "up",
        trendLabel: "vs tháng trước",
        color: "#52c41a",
        bgColor: "#f6ffed",
        iconName: "CheckCircleOutlined",
      },
      {
        key: "pendingAssignments",
        title: "Chưa Phân Công GV",
        value: pendingAssignments,
        trend: -15.0,
        trendType: "down",
        trendLabel: "vs tháng trước",
        color: "#faad14",
        bgColor: "#fffbe6",
        iconName: "ClockCircleOutlined",
      },
      {
        key: "todayAIRequests",
        title: "Yêu Cầu AI Hôm Nay",
        value: todayAIRequests,
        trend: 24.8,
        trendType: "up",
        trendLabel: "vs hôm qua",
        color: "#eb2f96",
        bgColor: "#fff0f6",
        iconName: "RobotOutlined",
      },
      {
        key: "liveClasses",
        title: "Lớp Trực Tuyến Live",
        value: liveClasses,
        trend: 0,
        trendType: "up",
        trendLabel: "Đang diễn ra",
        color: "#f5222d",
        bgColor: "#fff1f0",
        iconName: "VideoCameraOutlined",
      },
    ];

    // 3. 12-Month Student Registration Analytics Data
    const registrationChart: RegistrationChartItem[] = [
      { month: "Thg 1", students: 120 },
      { month: "Thg 2", students: 145 },
      { month: "Thg 3", students: 190 },
      { month: "Thg 4", students: 230 },
      { month: "Thg 5", students: 310 },
      { month: "Thg 6", students: 450 },
      { month: "Thg 7", students: 580 },
      { month: "Thg 8", students: 510 },
      { month: "Thg 9", students: 420 },
      { month: "Thg 10", students: 380 },
      { month: "Thg 11", students: 290 },
      { month: "Thg 12", students: 340 },
    ];

    // 4. Course Distribution Data by Subject from mockCourses
    const subjectCounts: Record<string, number> = {
      Toán: 0,
      Lý: 0,
      Hóa: 0,
      Anh: 0,
    };

    mockCourses.forEach((c) => {
      const s = c.subject.toLowerCase();
      if (s.includes("math") || s.includes("toán")) subjectCounts.Toán += 1;
      else if (s.includes("phys") || s.includes("lý")) subjectCounts.Lý += 1;
      else if (s.includes("chem") || s.includes("hóa")) subjectCounts.Hóa += 1;
      else if (s.includes("eng") || s.includes("anh")) subjectCounts.Anh += 1;
      else subjectCounts.Toán += 1;
    });

    const totalSubjectCourses = Object.values(subjectCounts).reduce((a, b) => a + b, 0) || 1;
    const courseChart: CourseDistributionItem[] = [
      {
        subject: "Môn Toán",
        count: subjectCounts.Toán || 8,
        percentage: Math.round(((subjectCounts.Toán || 8) / totalSubjectCourses) * 100),
        color: "#1677ff",
      },
      {
        subject: "Môn Lý",
        count: subjectCounts.Lý || 5,
        percentage: Math.round(((subjectCounts.Lý || 5) / totalSubjectCourses) * 100),
        color: "#722ed1",
      },
      {
        subject: "Môn Hóa",
        count: subjectCounts.Hóa || 4,
        percentage: Math.round(((subjectCounts.Hóa || 4) / totalSubjectCourses) * 100),
        color: "#fa8c16",
      },
      {
        subject: "Môn Tiếng Anh",
        count: subjectCounts.Anh || 3,
        percentage: Math.round(((subjectCounts.Anh || 3) / totalSubjectCourses) * 100),
        color: "#52c41a",
      },
    ];

    // 5. Class Status Distribution Data from mockClasses
    const statusCounts = {
      Upcoming: 0,
      Active: 0,
      Completed: 0,
      Cancelled: 0,
    };

    mockClasses.forEach((c) => {
      const status = c.status === "Ready" ? "Upcoming" : c.status;
      if ((statusCounts as any)[status] !== undefined) {
        (statusCounts as any)[status] += 1;
      }
    });

    const classChart: ClassStatusItem[] = [
      {
        status: "Upcoming",
        statusLabel: "Sắp khai giảng",
        count: statusCounts.Upcoming,
        color: "#1677ff",
      },
      {
        status: "Active",
        statusLabel: "Đang hoạt động",
        count: statusCounts.Active,
        color: "#52c41a",
      },
      {
        status: "Completed",
        statusLabel: "Đã hoàn thành",
        count: statusCounts.Completed,
        color: "#faad14",
      },
      {
        status: "Cancelled",
        statusLabel: "Đã hủy",
        count: statusCounts.Cancelled,
        color: "#ff4d4f",
      },
    ];

    // 6. AI Usage Data by Feature from mockAILogs
    const aiCounts: Record<string, number> = {
      Chatbot: 0,
      Summary: 0,
      Quiz: 0,
      Exam: 0,
      Homework: 0,
    };

    mockAILogs.forEach((log) => {
      if (aiCounts[log.feature] !== undefined) {
        aiCounts[log.feature] += 1;
      }
    });

    const aiChart: AIUsageItem[] = [
      { feature: "AI Chatbot", count: (aiCounts.Chatbot || 4) * 25 + 45, fill: "#1677ff" },
      { feature: "Tóm tắt bài học", count: (aiCounts.Summary || 3) * 20 + 30, fill: "#722ed1" },
      { feature: "Tạo Quiz nhanh", count: (aiCounts.Quiz || 5) * 18 + 50, fill: "#13c2c2" },
      { feature: "Tạo Đề Thi", count: (aiCounts.Exam || 2) * 30 + 40, fill: "#eb2f96" },
      { feature: "Chấm Bài Tập", count: (aiCounts.Homework || 3) * 22 + 35, fill: "#fa8c16" },
    ];

    // 7. Today's Classes Table Data mapped from mockClasses
    const todayClasses: TodayClassRecord[] = mockClasses.map((item) => {
      const teacher = mockUsers.find((u) => u.id === item.teacherId);
      const course = mockCourses.find((c) => c.id === item.courseId);

      return {
        id: item.id,
        className: item.className,
        classCode: item.classCode,
        teacherName: teacher ? teacher.fullName : "Chưa phân công",
        teacherAvatar: teacher?.avatar,
        courseName: course ? course.courseName : "Khóa học THPT",
        time: `${item.schedule.startTime} - ${item.schedule.endTime}`,
        days: item.schedule.days.join(", "),
        currentStudents: item.currentStudents,
        maxStudents: item.maxStudents,
        learningMode: item.learningMode,
        status: (item.status === "Ready" ? "Upcoming" : item.status) as any,
      };
    });

    // 8. Recent Activities Timeline
    const activities = mockNotifications;

    return {
      totalStudents,
      totalTeachers,
      totalCourses,
      totalClasses,
      activeClasses,
      pendingAssignments,
      todayAIRequests,
      liveClasses,
      overviewCards,
      registrationChart,
      courseChart,
      classChart,
      aiChart,
      todayClasses,
      activities,
    };
  },
};
