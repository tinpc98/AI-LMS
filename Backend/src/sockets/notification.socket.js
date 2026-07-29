// src/sockets/notification.socket.js
import jwt from "jsonwebtoken";

export default function notificationSocketHandler(io) {
  io.on("connection", (socket) => {
    // Client gọi event này ngay sau khi connect và gửi kèm JWT token
    socket.on("AUTHENTICATE_SOCKET", (data) => {
      try {
        const token = data?.token;
        if (!token) {
          return socket.emit("AUTHENTICATE_FAILED", { message: "No token provided" });
        }

        // Verify token
        const secret = process.env.JWT_SECRET || "default_secret";
        const decoded = jwt.verify(token, secret);

        const userId = decoded.id || decoded._id;
        if (!userId) {
          return socket.emit("AUTHENTICATE_FAILED", { message: "Invalid token payload" });
        }

        const roomName = `user:${userId}`;
        socket.join(roomName);
        socket.userId = userId; // Gắn userId vào socket instance

        console.log(`🔔 User ${userId} joined notification room: ${roomName}`);
        socket.emit("AUTHENTICATE_SUCCESS", { message: "Joined user room successfully" });
      } catch (error) {
        console.error("❌ Notification Socket Auth Error:", error.message);
        socket.emit("AUTHENTICATE_FAILED", { message: "Token verification failed" });
      }
    });

    socket.on("disconnect", () => {
      if (socket.userId) {
        console.log(`🔔 User ${socket.userId} disconnected from notification socket`);
      }
    });
  });
}
