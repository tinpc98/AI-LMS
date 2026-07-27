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
import ExamSetRouter from "./src/routers/examSet.routes.js";

// Kích hoạt cấu hình file .env
dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Lấy danh sách origin từ
//  biến môi trường FRONTEND_ORIGINS (comma-separated).
// Ví dụ: FRONTEND_ORIGINS=http://localhost:5173,http://localhost:5174
const allowedOrigins = (
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
app.use("/api/lesson", LessonRouter);
app.use("/api/assignments", assignmentRouter);
app.use("/api/attendances", AttendanceRouter);
app.use("/api/grades", GradeRouter);
app.use("/api/announcements", AnnouncementRouter);
app.use("/api/notifications", AnnouncementRouter);

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
    });
  })
  .catch((error) => {
    console.error("❌ Kết nối Database thất bại! Chi tiết lỗi:", error.message);
    process.exit(1);
  });
