// File: src/routes/index.js
// NƠI DUY NHẤT khai báo sơ đồ mount API — gỡ khỏi main.js (Wave 2.4).
// Trước đây 24 router được mount rải rác giữa phần khởi tạo socket và phần error handler,
// khiến không nhìn được toàn cảnh URL của hệ thống ở một chỗ.
import express from "express";

// File này là COMPOSITION ROOT — nơi duy nhất được phép trỏ thẳng vào file router của
// module thay vì đi qua public API index.js.
//
// VÌ SAO phải như vậy: nếu index.js re-export cả router thì việc một module import
// module khác chỉ để lấy MODEL sẽ kéo theo luôn router -> controller của module đó.
// Điều này đã tạo ra vòng phụ thuộc thật ở Wave 3.2:
//   class/classProgress.repository -> #modules/lesson -> lesson.routes -> lesson.controller
//   -> #modules/class -> class.routes -> class.controller -> classProgress.service -> ...
// Toàn bộ 371 test vẫn pass với vòng này; chỉ rule no-circular (mức error) phát hiện.
//
// Vì thế: index.js của module chỉ export domain API (model, helper), còn việc lắp router
// do file này làm. Rule no-cross-module-internals có ngoại lệ riêng cho composition root.
import authRoutes from "#modules/auth/auth.routes.js";
import userRoutes from "#modules/auth/user.routes.js";
import classRoutes from "#modules/class/class.routes.js";
import lessonRoutes from "#modules/lesson/lesson.routes.js";
import assignmentRoutes from "#modules/assignment/assignment.routes.js";
import assignmentAttemptRoutes from "#modules/assignment/assignmentAttempt.routes.js";
import attendanceRoutes from "#modules/attendance/attendance.routes.js";
import gradeRoutes from "#modules/grade/grade.routes.js";
import examRoutes from "#modules/exam/exam.routes.js";
import examAttemptRoutes from "#modules/exam-attempt/examAttempt.routes.js";
import questionRoutes from "#modules/question/question.routes.js";
import announcementRoutes from "#modules/announcement/announcement.routes.js";
import chatGlobalRoutes from "#modules/chat/chatGlobal.routes.js";
import courseRoutes from "#modules/course/course.routes.js";
import folderRoutes from "#modules/folder/folder.routes.js";
import notificationRoutes from "#modules/notification/notification.routes.js";
import liveRoutes from "#modules/live-session/live.routes.js";
import lessonProgressRoutes from "#modules/lesson/lessonProgress.routes.js";
import badgeRoutes from "#modules/badge/badge.routes.js";
import aiRoutes from "#modules/ai/ai.routes.js";
import examSetRoutes from "#modules/exam-set/examSet.routes.js";
import enrollmentRoutes from "#modules/enrollment/enrollment.routes.js";
import subjectRoutes from "#modules/subject/subject.routes.js";
import classEnrollmentRoutes from "#modules/classEnrollment/classEnrollment.routes.js";
import paymentRoutes from "#modules/payment/payment.routes.js";
import teacherAttendanceRoutes from "#modules/teacherAttendance/teacherAttendance.routes.js";
import payrollRoutes from "#modules/payroll/payroll.routes.js";
import performanceRoutes from "#modules/performance/performance.routes.js";

// Tầng đọc tổng hợp — KHÔNG phải module nghiệp vụ. Xem src/reporting/README.md.
import analyticsRoutes from "../reporting/analytics.routes.js";
import dashboardRoutes from "../reporting/dashboard.routes.js";
import reportRoutes from "../reporting/report.routes.js";
import { validatePagination } from "#shared/middlewares/pagination.middleware.js";

const router = express.Router();
router.use(validatePagination);

// ── Người dùng & xác thực ────────────────────────────────────────────────────
// /auth  = đăng nhập + hồ sơ của chính mình (login, me)
// /users = quản trị người dùng, toàn bộ yêu cầu quyền Admin
router.use("/auth", authRoutes);
router.use("/users", userRoutes);

// ── Lớp học & nội dung giảng dạy ────────────────────────────────────────────
import classSessionRoutes from "#modules/classSession/classSession.routes.js";
router.use("/classes/:classId/sessions", classSessionRoutes);
router.use("/sessions", classSessionRoutes);

router.use("/classes", classRoutes);
router.use("/subjects", subjectRoutes);
router.use("/courses", courseRoutes);
router.use("/enrollments", enrollmentRoutes);
router.use("/class-enrollments", classEnrollmentRoutes);
router.use("/payments", paymentRoutes);
router.use("/teacher-attendance", teacherAttendanceRoutes);
router.use("/payrolls", payrollRoutes);
router.use("/lessons", lessonRoutes);
router.use("/assignments", assignmentRoutes);
router.use("/assignment-attempts", assignmentAttemptRoutes);
router.use("/attendances", attendanceRoutes);
router.use("/grades", gradeRoutes);
router.use("/announcements", announcementRoutes);
router.use("/messages", chatGlobalRoutes);
router.use("/notifications", notificationRoutes);
router.use("/folders", folderRoutes);
router.use("/performance", performanceRoutes);

// ── Thống kê & báo cáo ───────────────────────────────────────────────────────
router.use("/dashboard", dashboardRoutes);
router.use("/reports", reportRoutes);
// /api/learning phục vụ hai module: tiến độ bài giảng (lesson) và xếp hạng/huy hiệu
// (badge). Trước Wave 3.2 chúng nằm chung một router. Mount cả hai ở CÙNG tiền tố nên
// URL bên ngoài không đổi — Express khớp lần lượt cho tới khi gặp route trùng.
router.use("/learning", lessonProgressRoutes);
router.use("/learning", badgeRoutes);
router.use("/analytics", analyticsRoutes);

// ── Thi trực tuyến & lớp học trực tuyến ─────────────────────────────────────
router.use("/questions", questionRoutes);
router.use("/exams", examRoutes);
router.use("/exam-attempts", examAttemptRoutes);
router.use("/exam-sets", examSetRoutes);
router.use("/live", liveRoutes);

// ── AI ───────────────────────────────────────────────────────────────────────
router.use("/ai", aiRoutes);

export default router;
