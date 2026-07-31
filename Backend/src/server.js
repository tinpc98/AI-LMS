// File: src/server.js
// Bootstrap tiến trình: kiểm tra env -> kết nối DB -> dựng HTTP + Socket.io -> cron
// -> lắng nghe cổng -> đăng ký graceful shutdown.
//
// Tách khỏi app.js để phần cấu hình Express có thể được import trong test mà không
// kéo theo kết nối DB hay mở cổng (Wave 2.4).
import "dotenv/config";
import mongoose from "mongoose";
import { createServer } from "http";
import { Server } from "socket.io";

import { createApp } from "./app.js";
import { connectDB } from "./config/database.js";
import { validateEnv } from "./config/env.js";
import { buildCorsOptions } from "./config/cors.js";
import { validateJaasConfig } from "./controllers/jaas.controller.js";
import socketAuthMiddleware from "./middlewares/socketAuth.middleware.js";
import examSocketHandler from "./sockets/exam.socket.js";
import liveSocketHandler from "./sockets/live.socket.js";
import notificationSocketHandler from "./sockets/notification.socket.js";
import { initCronJobs } from "./cron/cron.setup.js";
import aiUsageService from "./ai/services/aiUsage.service.js";
import aiKnowledgeIndexingService from "./ai/services/aiKnowledgeIndexing.service.js";

const SHUTDOWN_TIMEOUT_MS = 10_000;

const registerSocketHandlers = (io) => {
  // Xác thực JWT handshake cho MỌI kết nối Socket.io, đăng ký tường minh ở đây thay vì
  // phụ thuộc ngầm vào thứ tự import của từng module socket — đảm bảo không handler nào
  // có thể vô tình bỏ sót bước xác thực.
  io.use(socketAuthMiddleware);

  examSocketHandler(io);
  liveSocketHandler(io);
  notificationSocketHandler(io);
};

// Các tác vụ nền chạy sau khi server đã lắng nghe. Lỗi ở đây chỉ cảnh báo, không chặn boot.
const runPostBootChecks = () => {
  initCronJobs();

  aiUsageService
    .getOrCreateConfig()
    .then(() => console.log("🤖 AI Core Foundation: Đã đồng bộ cấu hình AIConfig"))
    .catch((err) => console.error("⚠️ AI Core Foundation Config Init Error:", err.message));

  // Cảnh báo (không chặn boot) nếu AI_EMBEDDING_DIMENSIONS lệch với dữ liệu RAG đã index.
  aiKnowledgeIndexingService
    .checkEmbeddingConfigConsistency()
    .catch((err) => console.error("⚠️ RAG Config Check Error:", err.message));
};

// Khi container/orchestrator gửi SIGTERM (hoặc Ctrl+C gửi SIGINT), dừng nhận request mới,
// đóng Socket.io + kết nối MongoDB rồi mới thoát — tránh cắt ngang request/transaction đang
// xử lý dở. Quá SHUTDOWN_TIMEOUT_MS mà chưa đóng xong thì buộc thoát để container không treo.
const registerGracefulShutdown = ({ httpServer, io }) => {
  let isShuttingDown = false;

  const shutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n🛑 Nhận tín hiệu ${signal}, đang tắt server một cách an toàn...`);

    const forceExitTimer = setTimeout(() => {
      console.error("⚠️ Tắt server quá hạn 10s, buộc thoát tiến trình.");
      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);
    forceExitTimer.unref();

    io.close();

    httpServer.close(async (err) => {
      if (err) console.error("❌ Lỗi khi đóng HTTP server:", err.message);

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
};

export const startServer = async () => {
  // Fail-fast nếu thiếu biến môi trường bắt buộc.
  validateEnv();
  // Cấu hình 8x8 JaaS là tuỳ chọn — chỉ cảnh báo nếu thiếu.
  validateJaasConfig();

  const port = process.env.PORT || 5000;
  const app = createApp();
  const httpServer = createServer(app);
  const io = new Server(httpServer, { cors: buildCorsOptions() });

  // Lưu io instance để các controller gọi qua req.app.get("io").
  app.set("io", io);
  registerSocketHandlers(io);

  try {
    await connectDB();
  } catch (error) {
    console.error("❌ Kết nối Database thất bại! Chi tiết lỗi:", error.message);
    process.exit(1);
  }

  httpServer.listen(port, () => {
    console.log(`==================================================`);
    console.log(`🚀 Server HTTP & Socket đang chạy tại cổng: ${port}`);
    console.log(`🔗 Endpoint test: http://localhost:${port}`);
    console.log(`==================================================`);

    runPostBootChecks();
  });

  registerGracefulShutdown({ httpServer, io });

  return { app, httpServer, io };
};

export default startServer;
