import "dotenv/config";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import cors from "cors"; // Thêm thư viện cấu hình cho phép Frontend gọi API
import mongoose from "mongoose";
import { connectDB } from "./src/config/database.js";
import { validateEnv, getAllowedOrigins } from "./src/config/env.js";
import { requestId } from "./src/middlewares/requestId.middlewares.js";
import { errorHandler, notFoundHandler } from "./src/middlewares/errorHandler.middlewares.js";
import socketHandler from "./src/sockets/exam.socket.js"; // 3. Import bộ xử lý Real-time
import liveSocketHandler from "./src/sockets/live.socket.js"; // Import xử lý Socket phòng học online
import { createServer } from "http";
import { Server } from "socket.io";
// Import Routers hiện có & mới
import UserRouter from "./src/routers/user.routes.js";
import ClassRouter from "./src/routers/class.routes.js";
import LessonRouter from "./src/routers/lesson.routes.js";
import assignmentRouter from "./src/routers/assignment.routes.js";
import QuestionRouter from "./src/routers/question.routes.js";
import ExamRouter from "./src/routers/exam.routes.js";
import ExamAttemptRouter from "./src/routers/examAttempt.routes.js";
import LiveRouter from "./src/routers/live.routes.js";
import AttendanceRouter from "./src/routers/attendance.routes.js";
import GradeRouter from "./src/routers/grade.routes.js";
import AnnouncementRouter from "./src/routers/announcement.routes.js";
import CourseRouter from "./src/routers/course.routes.js";
import DashboardRouter from "./src/routers/dashboard.routes.js";
import ReportRouter from "./src/routers/report.routes.js";
import NotificationRouter from "./src/routers/notification.routes.js";
import LearningRouter from "./src/routers/learning.routes.js";
import AnalyticsRouter from "./src/routers/analytics.routes.js";
import ExamSetRouter from "./src/routers/examSet.routes.js";
import AISummaryRouter from "./src/routers/aiSummary.routes.js";
import AIQuestionRouter from "./src/routers/aiQuestion.routes.js";
import AIGradingRouter from "./src/routers/aiGrading.routes.js";
import AIKnowledgeRouter from "./src/routers/aiKnowledge.routes.js";
import AIChatRouter from "./src/routers/aiChat.routes.js";
import { initCronJobs } from "./src/cron/cron.setup.js";
import aiUsageService from "./src/ai/services/aiUsage.service.js";
import FolderRouter from "./src/routers/folder.routes.js";

import { validateJaasConfig } from "./src/controllers/jaas.controller.js";

// Kích hoạt cấu hình file .env – phải gọi TRƯỚC khi đọc bất kỳ biến môi trường nào
dotenv.config();

// Kiểm tra các biến môi trường bắt buộc (Fail-fast nếu thiếu)
validateEnv();

// Kiểm tra cấu hình 8x8 JaaS khi khởi động (tính năng tùy chọn, chỉ cảnh báo nếu thiếu)
validateJaasConfig();

const app = express();
const port = process.env.PORT || 5000;

// ── CORS: Strict origin whitelist ──────────────────────────────────────────
const allowedOrigins = getAllowedOrigins();

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Origin không được phép bởi CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Cấu hình Middleware
app.use(requestId);
app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// KHỞI TẠO HTTP SERVER & SOCKET.IO
// ==========================================
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: corsOptions, // Đồng bộ cấu hình CORS của Express sang Socket.io
});

app.set("io", io); // Lưu io instance để gọi từ các controllers

// Kích hoạt luồng lắng nghe sự kiện Real-time
socketHandler(io);
liveSocketHandler(io);
import notificationSocketHandler from "./src/sockets/notification.socket.js";
notificationSocketHandler(io);

// ==========================================
// ĐĂNG KÝ CÁC API ROUTES
// ==========================================
app.use("/api/auth", UserRouter);
app.use("/api/users", UserRouter);
app.use("/api/classes", ClassRouter);
app.use("/api/courses", CourseRouter);
app.use("/api/dashboard", DashboardRouter);
app.use("/api/reports", ReportRouter);
app.use("/api/lessons", LessonRouter);
app.use("/api/lesson", LessonRouter); // Deprecated alias for backward compatibility
app.use("/api/assignments", assignmentRouter);
app.use("/api/attendances", AttendanceRouter);
app.use("/api/grades", GradeRouter);
app.use("/api/announcements", AnnouncementRouter);
app.use("/api/notifications", NotificationRouter); // Bulk & inbox endpoints
app.use("/api/learning", LearningRouter); // Gamification & Analytics
app.use("/api/analytics", AnalyticsRouter); // Dashboard Analytics

app.use("/api/folders", FolderRouter);

// Routes Module Thi trực tuyến & Live
app.use("/api/questions", QuestionRouter);
app.use("/api/exams", ExamRouter);
app.use("/api/exam-attempts", ExamAttemptRouter);
app.use("/api/exam-sets", ExamSetRouter);
app.use("/api/live", LiveRouter);

// AI Module Routes
app.use("/api/ai/lectures", AISummaryRouter);
app.use("/api/ai/lectures/:lessonId/question-sets", AIQuestionRouter);
app.use("/api/ai/exam-attempts", AIGradingRouter);
app.use("/api/ai/lessons", AIKnowledgeRouter);
app.use("/api/ai/chat", AIChatRouter);

app.get("/", (req, res) => {
  res
    .status(200)
    .json({ message: "Server EduSynth AI đang hoạt động ổn định!" });
});

// Health check cho load balancer / container orchestrator (Docker HEALTHCHECK, K8s probe...)
// Trả 200 khi kết nối MongoDB đang "connected" (readyState === 1), 503 nếu chưa sẵn sàng.
app.get("/health", (req, res) => {
  const dbReady = mongoose.connection.readyState === 1;
  res.status(dbReady ? 200 : 503).json({
    status: dbReady ? "ok" : "unavailable",
    db: mongoose.STATES[mongoose.connection.readyState],
    uptime: process.uptime(),
  });
});

// ==========================================
// TRẠM XỬ LÝ LỖI TẬP TRUNG (ERROR HANDLING)
// ==========================================
// Xử lý lỗi 404 cho các đường dẫn không tồn tại
app.use(notFoundHandler);

// Global Error Handler (Phải đặt ở cuối cùng)
app.use(errorHandler);

// ==========================================
// KHỞI CHẠY SERVER
// ==========================================
connectDB()
  .then(() => {
    httpServer.listen(port, () => {
      console.log(`==================================================`);
      console.log(`🚀 Server HTTP & Socket đang chạy tại cổng: ${port}`);
      console.log(`🔗 Endpoint test: http://localhost:${port}`);
      console.log(`==================================================`);

      // Khởi tạo các cron job nền của hệ thống
      // Đặt runImmediately=false (mặc định) để cron chỉ chạy theo lịch
      initCronJobs();

      // Đảm bảo cấu hình AIConfig đã được lưu sẵn trong DB
      aiUsageService.getOrCreateConfig()
        .then(() => console.log("🤖 AI Core Foundation: Đã đồng bộ cấu hình AIConfig"))
        .catch((err) => console.error("⚠️ AI Core Foundation Config Init Error:", err.message));
    });
  })
  .catch((error) => {
    console.error("❌ Kết nối Database thất bại! Chi tiết lỗi:", error.message);
    process.exit(1);
  });

// ==========================================
// GRACEFUL SHUTDOWN
// ==========================================
// Khi container/orchestrator gửi SIGTERM (hoặc Ctrl+C gửi SIGINT), dừng nhận request mới,
// đóng Socket.io + kết nối MongoDB rồi mới thoát tiến trình — tránh cắt ngang request/transaction
// đang xử lý dở. Nếu quá 10s không đóng xong (request treo), buộc thoát để tránh container "hang".
let isShuttingDown = false;

const shutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n🛑 Nhận tín hiệu ${signal}, đang tắt server một cách an toàn...`);

  const forceExitTimer = setTimeout(() => {
    console.error("⚠️ Tắt server quá hạn 10s, buộc thoát tiến trình.");
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  io.close();

  httpServer.close(async (err) => {
    if (err) {
      console.error("❌ Lỗi khi đóng HTTP server:", err.message);
    }

    try {
      await mongoose.connection.close();
      console.log("✅ Đã đóng kết nối MongoDB.");
    } catch (dbCloseError) {
      console.error("❌ Lỗi khi đóng kết nối MongoDB:", dbCloseError.message);
    }

    clearTimeout(forceExitTimer);
    console.log("✅ Server đã tắt hoàn toàn.");
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
