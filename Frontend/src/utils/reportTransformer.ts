import { mockUsers } from "../features/accountManagement/account.mock";
import { mockCourses } from "../features/courseManagement/course.mock";
import { mockClasses } from "../features/classManagement/class.mock";
import { mockAILogs } from "../features/aiManagement/mock/aiLogs.mock";
import { mockLiveSessions } from "../features/classManagement/liveSessions.mock";

export type DateFilterType = "today" | "7days" | "30days" | "thisMonth" | "thisYear" | "custom";

export interface DateRangeState {
  filterType: DateFilterType;
  startDate?: string;
  endDate?: string;
}

// 1. OVERVIEW REPORT TRANSFORMER
export const transformOverviewReport = (filter: DateRangeState) => {
  const students = mockUsers.filter((u) => u.role === "Student");
  const teachers = mockUsers.filter((u) => u.role === "Teacher");
  const totalStudents = students.length;
  const totalCourses = mockCourses.length;
  const totalClasses = mockClasses.length;
  const totalTeachers = teachers.length;

  const averageScore = 8.35;
  const attendanceRate = 94.6;

  // Student growth chart
  const studentGrowth = [
    { month: "Thg 1", students: 120, target: 100 },
    { month: "Thg 2", students: 145, target: 130 },
    { month: "Thg 3", students: 190, target: 170 },
    { month: "Thg 4", students: 230, target: 210 },
    { month: "Thg 5", students: 310, target: 260 },
    { month: "Thg 6", students: 450, target: 350 },
    { month: "Thg 7", students: 580, target: 450 },
    { month: "Thg 8", students: 510, target: 480 },
    { month: "Thg 9", students: 420, target: 400 },
    { month: "Thg 10", students: 380, target: 360 },
    { month: "Thg 11", students: 290, target: 300 },
    { month: "Thg 12", students: 340, target: 320 },
  ];

  // Course enrollment
  const courseEnrollments = mockCourses.map((c) => {
    const relatedClasses = mockClasses.filter((cls) => cls.courseId === c.id);
    const count = relatedClasses.reduce((acc, curr) => acc + curr.currentStudents, 0) || 25;
    return {
      courseName: c.courseName,
      enrollments: count,
    };
  });

  // Class performance
  const classPerformance = mockClasses.map((cls) => ({
    className: cls.className,
    averageScore: cls.status === "Active" ? 8.4 : cls.status === "Completed" ? 8.7 : 7.9,
  }));

  return {
    kpis: {
      totalStudents,
      totalCourses,
      totalClasses,
      totalTeachers,
      averageScore,
      attendanceRate,
    },
    studentGrowth,
    courseEnrollments,
    classPerformance,
  };
};

// 2. STUDENT REPORT TRANSFORMER
export const transformStudentReport = (filter: DateRangeState) => {
  const students = mockUsers.filter((u) => u.role === "Student");
  const totalStudents = students.length || 185;
  const activeStudents = students.filter((s) => s.status === "Active").length || 162;
  const newStudents = 34;
  const completedCourses = 42;

  // Student registration trend
  const registrationTrend = [
    { month: "Thg 1", count: 18 },
    { month: "Thg 2", count: 24 },
    { month: "Thg 3", count: 32 },
    { month: "Thg 4", count: 28 },
    { month: "Thg 5", count: 45 },
    { month: "Thg 6", count: 60 },
    { month: "Thg 7", count: 52 },
  ];

  // Students by course
  const studentsByCourse = mockCourses.map((c) => ({
    name: c.courseName,
    students: Math.floor(Math.random() * 40) + 20,
  }));

  // Students by class
  const studentsByClass = mockClasses.map((cls) => ({
    name: cls.className,
    count: cls.currentStudents,
  }));

  // Table data derived from mockUsers (Students) and mockClasses
  const tableData = students.map((s, index) => {
    const cls = mockClasses[index % mockClasses.length];
    const course = mockCourses.find((c) => c.id === cls?.courseId) || mockCourses[0];

    return {
      key: s.id,
      name: s.fullName,
      email: s.email,
      className: cls?.className || "Toán 12 K25",
      courseName: course?.courseName || "Chương trình THPT",
      progress: (index * 17 + 45) % 100,
      avgScore: Number((7.2 + ((index * 3) % 25) / 10).toFixed(1)),
      status: s.status,
    };
  });

  return {
    stats: {
      totalStudents,
      newStudents,
      activeStudents,
      completedCourses,
    },
    registrationTrend,
    studentsByCourse,
    studentsByClass,
    tableData,
  };
};

// 3. COURSE REPORT TRANSFORMER
export const transformCourseReport = (filter: DateRangeState) => {
  const totalCourses = mockCourses.length;
  const activeCourses = mockCourses.filter((c) => c.status === "Published").length;
  const completedCourses = mockCourses.filter((c) => c.status === "Closed").length;

  const popularity = mockCourses.map((c) => ({
    name: c.courseName,
    rating: 4.8,
    enrollments: c.subject === "Mathematics" ? 140 : 95,
  }));

  const enrollmentComparison = mockCourses.map((c) => ({
    subject: c.subject,
    students: c.tuitionFee > 2000000 ? 120 : 85,
  }));

  const completionRateData = [
    { name: "Đã hoàn thành", value: 68, color: "#52c41a" },
    { name: "Đang học", value: 24, color: "#1677ff" },
    { name: "Bảo lưu/Hủy", value: 8, color: "#ff4d4f" },
  ];

  const tableData = mockCourses.map((c, index) => {
    const teacher = mockUsers.find((u) => u.role === "Teacher");
    const count = 35 + index * 12;

    return {
      key: c.id,
      courseName: c.courseName,
      subject: c.subject,
      teacherName: teacher ? teacher.fullName : "Trần Thị Bình",
      studentsCount: count,
      completionRate: 85 - index * 5,
      avgScore: Number((8.1 + (index % 3) * 0.4).toFixed(1)),
    };
  });

  return {
    stats: {
      totalCourses,
      activeCourses,
      completedCourses,
    },
    popularity,
    enrollmentComparison,
    completionRateData,
    tableData,
  };
};

// 4. TEACHER REPORT TRANSFORMER
export const transformTeacherReport = (filter: DateRangeState) => {
  const teachers = mockUsers.filter((u) => u.role === "Teacher");
  const totalTeachers = teachers.length || 4;
  const activeTeachers = teachers.filter((t) => t.status === "Active").length || 3;
  const avgTeachingHours = 38.5;

  const rankingData = teachers.map((t, index) => ({
    name: t.fullName,
    hours: 32 + index * 8,
    rating: Number((4.7 + (index % 3) * 0.1).toFixed(1)),
  }));

  const tableData = teachers.map((t, index) => {
    const teacherClasses = mockClasses.filter((c) => c.teacherId === t.id);
    const totalStudentsInClasses = teacherClasses.reduce((acc, curr) => acc + curr.currentStudents, 0);

    return {
      key: t.id,
      name: t.fullName,
      email: t.email,
      phone: t.phone,
      classesCount: teacherClasses.length || 2,
      studentsCount: totalStudentsInClasses || 42,
      avgScore: Number((8.2 + (index % 4) * 0.3).toFixed(1)),
      performance: index === 0 ? "Xuất sắc" : index === 1 ? "Tốt" : "Khá",
    };
  });

  return {
    stats: {
      totalTeachers,
      activeTeachers,
      avgTeachingHours,
    },
    rankingData,
    tableData,
  };
};

// 5. CLASS REPORT TRANSFORMER
export const transformClassReport = (filter: DateRangeState) => {
  const totalClasses = mockClasses.length;
  const activeClasses = mockClasses.filter((c) => c.status === "Active").length;
  const avgStudentsPerClass = Math.round(
    mockClasses.reduce((acc, curr) => acc + curr.currentStudents, 0) / (totalClasses || 1),
  );

  const tableData = mockClasses.map((cls) => {
    const teacher = mockUsers.find((u) => u.id === cls.teacherId);
    return {
      key: cls.id,
      className: cls.className,
      classCode: cls.classCode,
      teacherName: teacher ? teacher.fullName : "Chưa phân công",
      currentStudents: cls.currentStudents,
      maxStudents: cls.maxStudents,
      attendanceRate: cls.status === "Active" ? 95.2 : 91.5,
      avgScore: cls.learningMode === "Offline" ? 8.5 : 8.1,
      learningMode: cls.learningMode,
      status: cls.status,
    };
  });

  return {
    stats: {
      totalClasses,
      activeClasses,
      avgStudentsPerClass,
    },
    tableData,
  };
};

// 6. ATTENDANCE REPORT TRANSFORMER
export const transformAttendanceReport = (filter: DateRangeState) => {
  const attendanceRate = 95.4;
  const presentCount = 1420;
  const absentCount = 68;

  const attendanceTrend = [
    { day: "Thứ 2", rate: 96.5 },
    { day: "Thứ 3", rate: 94.8 },
    { day: "Thứ 4", rate: 97.2 },
    { day: "Thứ 5", rate: 95.0 },
    { day: "Thứ 6", rate: 93.6 },
    { day: "Thứ 7", rate: 96.0 },
    { day: "Chủ nhật", rate: 98.1 },
  ];

  const attendanceByClass = mockClasses.map((cls) => ({
    name: cls.classCode,
    present: Math.round(cls.currentStudents * 0.94),
    absent: Math.round(cls.currentStudents * 0.06),
  }));

  const tableData = mockUsers
    .filter((u) => u.role === "Student")
    .map((s, index) => {
      const cls = mockClasses[index % mockClasses.length];
      const presentDays = 28 - (index % 3);
      const absentDays = index % 3;
      const rate = Number(((presentDays / (presentDays + absentDays)) * 100).toFixed(1));

      return {
        key: s.id,
        studentName: s.fullName,
        className: cls?.className || "Toán 12 K25",
        presentDays,
        absentDays,
        attendanceRate: rate,
      };
    });

  return {
    stats: {
      attendanceRate,
      presentCount,
      absentCount,
    },
    attendanceTrend,
    attendanceByClass,
    tableData,
  };
};

// 7. EXAM REPORT TRANSFORMER
export const transformExamReport = (filter: DateRangeState) => {
  const totalExams = 18;
  const totalAttempts = 640;
  const avgScore = 7.85;
  const passRate = 89.2;

  const scoreDistribution = [
    { range: "< 5.0 (Yếu)", count: 24, fill: "#ff4d4f" },
    { range: "5.0 - 6.5 (TB)", count: 110, fill: "#faad14" },
    { range: "6.5 - 8.0 (Khá)", count: 280, fill: "#1677ff" },
    { range: "8.0 - 10.0 (Giỏi)", count: 220, fill: "#52c41a" },
  ];

  const examPerformance = mockCourses.map((c) => ({
    courseName: c.subject,
    avgScore: c.subject === "Mathematics" ? 8.2 : c.subject === "Physics" ? 7.6 : 7.9,
  }));

  const tableData = [
    {
      key: "ex-1",
      examName: "Thi thử THPT QG 2026 - Đợt 1 Môn Toán",
      className: "Toán 12 K25 - Sáng",
      studentsCount: 30,
      avgScore: 8.4,
      passRate: 93.3,
    },
    {
      key: "ex-2",
      examName: "Kiểm tra 45 phút Dao động cơ Vật lý 12",
      className: "Lý 12 VIP",
      studentsCount: 20,
      avgScore: 7.9,
      passRate: 85.0,
    },
    {
      key: "ex-3",
      examName: "Đề rèn luyện Este - Lipit Hóa Học 12",
      className: "Hóa 12 Nâng cao",
      studentsCount: 16,
      avgScore: 8.1,
      passRate: 87.5,
    },
    {
      key: "ex-4",
      examName: "Thi thử Đọc hiểu & Viết Tiếng Anh 12",
      className: "Anh 12 7.0+",
      studentsCount: 21,
      avgScore: 7.6,
      passRate: 90.5,
    },
  ];

  return {
    stats: {
      totalExams,
      totalAttempts,
      avgScore,
      passRate,
    },
    scoreDistribution,
    examPerformance,
    tableData,
  };
};

// 8. AI ANALYTICS TRANSFORMER
export const transformAIAnalyticsReport = (filter: DateRangeState) => {
  const chatRequests = mockAILogs.filter((l) => l.feature === "Chatbot").length * 35 + 140;
  const summaryGenerated = mockAILogs.filter((l) => l.feature === "Summary").length * 28 + 95;
  const questionsGenerated = mockAILogs.filter((l) => l.feature === "Quiz").length * 40 + 180;
  const examGenerated = mockAILogs.filter((l) => l.feature === "Exam").length * 20 + 65;

  const usageTrend = [
    { date: "10/07", requests: 120 },
    { date: "13/07", requests: 185 },
    { date: "16/07", requests: 240 },
    { date: "19/07", requests: 310 },
    { date: "22/07", requests: 290 },
    { date: "25/07", requests: 380 },
  ];

  const featureComparison = [
    { feature: "AI Chatbot", count: chatRequests, fill: "#1677ff" },
    { feature: "Tóm tắt bài học", count: summaryGenerated, fill: "#722ed1" },
    { feature: "Tạo Quiz nhanh", count: questionsGenerated, fill: "#13c2c2" },
    { feature: "Tạo Đề Thi", count: examGenerated, fill: "#eb2f96" },
  ];

  const tableData = [
    {
      key: "ai-f1",
      feature: "AI Chatbot gia sư 24/7",
      usageCount: chatRequests,
      usersCount: 145,
      successRate: 99.2,
    },
    {
      key: "ai-f2",
      feature: "Tóm tắt bài giảng & tài liệu",
      usageCount: summaryGenerated,
      usersCount: 98,
      successRate: 98.5,
    },
    {
      key: "ai-f3",
      feature: "Sinh câu hỏi & Quiz trắc nghiệm",
      usageCount: questionsGenerated,
      usersCount: 112,
      successRate: 97.8,
    },
    {
      key: "ai-f4",
      feature: "Sinh đề thi thử chuẩn cấu trúc",
      usageCount: examGenerated,
      usersCount: 45,
      successRate: 96.4,
    },
  ];

  return {
    stats: {
      chatRequests,
      summaryGenerated,
      questionsGenerated,
      examGenerated,
    },
    usageTrend,
    featureComparison,
    tableData,
  };
};
