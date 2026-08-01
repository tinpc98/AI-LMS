// File: src/config/cors.js
// Cấu hình CORS dùng chung cho cả Express và Socket.io — tách ra từ main.js (Wave 2.4)
// để hai nơi không thể trôi lệch khỏi nhau.
import { getAllowedOrigins } from "./env.js";

export const buildCorsOptions = () => {
  const allowedOrigins = getAllowedOrigins();

  return {
    origin: (origin, cb) => {
      // Không có Origin: request cùng gốc, curl/Postman, health check của orchestrator.
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error("Origin không được phép bởi CORS"));
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  };
};

export default buildCorsOptions;
