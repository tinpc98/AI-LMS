// server.js
import express from "express";
import { createServer } from "http"; // Module có sẵn của Node.js
import { Server } from "socket.io";
import socketHandler from "./sockets/exam.socket.js"; // Tách riêng logic ra file khác cho sạch

const app = express();
const httpServer = createServer(app);

// Khởi tạo Socket.io với cấu hình CORS cho phép Frontend gọi vào
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Trong thực tế thì thay bằng Domain Frontend (VD: http://localhost:3000)
    methods: ["GET", "POST"],
  },
});

// Chuyển instance io sang file handler để xử lý
socketHandler(io);

// Lưu ý: Dùng httpServer.listen thay vì app.listen
httpServer.listen(5000, () => {
  console.log("🚀 Server HTTP & Socket.io đang chạy tại port 5000");
});
