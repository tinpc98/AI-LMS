// File: src/config/env.js
// Xác thực các biến môi trường bắt buộc ngay khi ứng dụng khởi động (fail-fast).

const REQUIRED_ENV_VARS = ["JWT_SECRET", "MONGO_URI"];

export const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ FATAL: Thiếu biến môi trường bắt buộc: ${missing.join(", ")}`);
    process.exit(1);
  }

  if (!process.env.FRONTEND_ORIGINS && process.env.NODE_ENV === "production") {
    console.error("❌ FATAL: Biến môi trường FRONTEND_ORIGINS chưa được cấu hình!");
    process.exit(1);
  }

  console.log("✅ [Env Validation] Tất cả biến môi trường bắt buộc đã được cấu hình.");
};

// Development fallback: chỉ cho phép localhost – KHÔNG dùng wildcard "*"
export const getAllowedOrigins = () =>
  (process.env.FRONTEND_ORIGINS || "http://localhost:5173,http://127.0.0.1:5173")
    .split(",")
    .map((u) => u.trim())
    .filter(Boolean);
