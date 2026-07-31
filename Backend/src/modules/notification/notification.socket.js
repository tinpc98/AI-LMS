// src/sockets/notification.socket.js
// Danh tính đã được xác thực JWT ở tầng handshake (socketAuthMiddleware, đăng ký toàn cục
// ở main.js) TRƯỚC KHI event "connection" này chạy — không cần (và trước đây không nên) tự
// xác thực lại qua một event riêng "AUTHENTICATE_SOCKET" sau khi đã kết nối.
//
// Trước đây, việc dùng "AUTHENTICATE_SOCKET" là dead code trên thực tế: middleware toàn cục
// đã từ chối handshake thiếu token TRƯỚC KHI client kịp gửi event xác thực đó — nghĩa là bất
// kỳ client nào kết nối không kèm token trong handshake (như hook useNotifications.ts trước
// bản sửa này) sẽ bị NGẮT KẾT NỐI ngay tại bước handshake, không bao giờ có cơ hội emit
// "AUTHENTICATE_SOCKET". Tính năng thông báo real-time vì vậy không hoạt động cho tới bản sửa
// này (đồng bộ với useNotifications.ts gửi token qua handshake giống socketClient.ts).
import { logger } from "#shared/utils/logger.js";

export default function notificationSocketHandler(io) {
  io.on("connection", (socket) => {
    if (!socket.user?.id) return;

    const roomName = `user:${socket.user.id}`;
    socket.join(roomName);
    logger.debug(`🔔 User ${socket.user.id} joined notification room: ${roomName}`);

    socket.on("disconnect", () => {
      logger.debug(`🔔 User ${socket.user.id} disconnected from notification socket`);
    });
  });
}
