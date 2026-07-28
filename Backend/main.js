import dotenv from "dotenv";
import express from "express";
import cors from "cors"; // Thêm thư viện cấu hình cho phép Frontend gọi API
import { connectDB } from "./src/config/database.js";
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
import ExamSetRouter from "./src/routers/examSet.routes.js";
import { initCronJobs } from "./src/cron/cron.setup.js";
import aiUsageService from "./src/ai/services/aiUsage.service.js";

// Kích hoạt cấu hình file .env – phải gọi TRƯỚC khi đọc bất kỳ biến môi trường nào
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// ── CORS: Strict origin whitelist ──────────────────────────────────────────
// Biến FRONTEND_ORIGINS là BẮT BUỘC trong môi trường production.
// Định dạng: chuỗi các origin cách nhau bởi dấu phẩy.
// Ví dụ: FRONTEND_ORIGINS=https://app.example.com,https://admin.example.com
if (!process.env.FRONTEND_ORIGINS && process.env.NODE_ENV === "production") {
  console.error("❌ FATAL: Biến môi trường FRONTEND_ORIGINS chưa được cấu hình!");
  process.exit(1);
}

const allowedOrigins = (
  // Development fallback: chỉ cho phép localhost – KHÔNG dùng wildcard "*"
  process.env.FRONTEND_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173"
)
  .split(",")
  .map((u) => u.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Origin không được phép bởi CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
};

// Cấu hình Middleware
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

// ==========================================
// ĐĂNG KÝ CÁC API ROUTES
// ==========================================
app.use("/api/auth", UserRouter);
app.use("/api/users", UserRouter);
app.use("/api/classes", ClassRouter);
app.use("/api/courses", CourseRouter);
app.use("/api/dashboard", DashboardRouter);
app.use("/api/reports", ReportRouter);
app.use("/api/lesson", LessonRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/attendances", AttendanceRouter);
app.use("/api/grades", GradeRouter);
app.use("/api/announcements", AnnouncementRouter);
app.use("/api/notifications", NotificationRouter); // Bulk & inbox endpoints

// Routes Module Thi trực tuyến & Live
app.use("/api/questions", QuestionRouter);
app.use("/api/exams", ExamRouter);
app.use("/api/exam-attempts", ExamAttemptRouter);
app.use("/api/exam-sets", ExamSetRouter);
app.use("/api/live", LiveRouter);

app.get("/", (req, res) => {
  res
    .status(200)
    .json({ message: "Server EduSynth AI đang hoạt động ổn định!" });
});

// ==========================================
// TRẠM XỬ LÝ LỖI TẬP TRUNG (ERROR HANDLING)
// ==========================================
// Xử lý lỗi 404 cho các đường dẫn không tồn tại
app.use((req, res) => {
  res
    .status(404)
    .json({ message: "Đường dẫn API này không tồn tại trên hệ thống!" });
});

// Global Error Handler: Trạm bắt lỗi 500 (Phải đặt ở cuối cùng)
app.use((err, req, res, next) => {
  console.error("🔥 Lỗi hệ thống:", err.stack);
  res.status(500).json({
    message: err.message || "Đã xảy ra lỗi nội bộ trên Server!",
    error: process.env.NODE_ENV === "development" ? err.stack : {},
  });
});

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
