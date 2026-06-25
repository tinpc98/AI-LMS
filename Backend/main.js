import dotenv from "dotenv";
import express from "express";
import cors from "cors"; // Thêm thư viện cấu hình cho phép Frontend gọi API
import { connectDB } from "./src/config/database.js";
import UserRouter from "./src/routers/user.routes.js";

// Kích hoạt cấu hình file .env
dotenv.config();

const app = express();
const port = process.env.PORT || 5000; // Linh hoạt lấy port từ .env, nếu không có sẽ dùng 5000

// Lấy danh sách origin từ biến môi trường FRONTEND_ORIGINS (comma-separated).
// Ví dụ: FRONTEND_ORIGINS=http://localhost:5173,http://localhost:5174
const allowedOrigins = (process.env.FRONTEND_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173')
  .split(',')
  .map((u) => u.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, cb) => {
      // Nếu origin không cung cấp (ví dụ Postman, same-origin), cho phép
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Origin không được phép bởi CORS'));
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Cấu hình đọc dữ liệu JSON gửi lên từ Body (bắt buộc phải có để đọc req.body)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", UserRouter);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Server EduSynth AI đang hoạt động ổn định!" });
});

// Xử lý lỗi 404 cho các đường dẫn không tồn tại
app.use((req, res) => {
  res.status(404).json({ message: "Đường dẫn API này không tồn tại trên hệ thống!" });
});

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`==================================================`);
      console.log(`🚀 Server đang chạy ngon lành tại cổng: ${port}`);
      console.log(`🔗 Endpoint test: http://localhost:${port}/api/auth/register`);
      console.log(`==================================================`);
    });
  })
  .catch((error) => {
    console.error("❌ Kết nối Database thất bại! Chi tiết lỗi:", error.message);
    process.exit(1); // Dừng ứng dụng ngay lập tức nếu database lỗi
  });
