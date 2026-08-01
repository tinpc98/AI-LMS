// File: src/app.js
// Tạo & cấu hình Express app — KHÔNG listen, KHÔNG kết nối DB, KHÔNG khởi tạo socket.
//
// Lợi ích trực tiếp: integration test có thể `import { createApp }` và đưa thẳng vào
// supertest mà không cần mở cổng hay chạy nền — đây đang là khoảng trống lớn nhất của
// test suite hiện tại (§2.3 kế hoạch refactor).
import express from "express";
import helmet from "helmet";
import cors from "cors";
import mongoose from "mongoose";

import { buildCorsOptions } from "./config/cors.js";
import { requestId } from "#shared/middlewares/requestId.middleware.js";
import { errorHandler, notFoundHandler } from "#shared/middlewares/errorHandler.middleware.js";
import apiRouter from "./routes/index.js";

export const createApp = () => {
  const app = express();

  app.use(requestId);
  app.use(helmet());
  app.use(cors(buildCorsOptions()));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/", (req, res) => {
    res.status(200).json({ message: "Server EduSynth AI đang hoạt động ổn định!" });
  });

  // Health check cho load balancer / container orchestrator (Docker HEALTHCHECK, K8s probe...).
  // Trả 200 khi kết nối MongoDB đang "connected" (readyState === 1), 503 nếu chưa sẵn sàng.
  app.get("/health", (req, res) => {
    const dbReady = mongoose.connection.readyState === 1;
    res.status(dbReady ? 200 : 503).json({
      status: dbReady ? "ok" : "unavailable",
      db: mongoose.STATES[mongoose.connection.readyState],
      uptime: process.uptime(),
    });
  });

  app.use("/api", apiRouter);

  // Trạm xử lý lỗi tập trung — bắt buộc đăng ký sau cùng.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export default createApp;
