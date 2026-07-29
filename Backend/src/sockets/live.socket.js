import socketAuthMiddleware from "../middlewares/socketAuth.middleware.js";
import { checkSocketLiveClassAccess } from "../services/socketLiveAccess.service.js";

/**
 * Socket.IO Handler cho Module Học Trực Tuyến (Live Session)
 */
export default function liveSocketHandler(io) {
  // Gắn Middleware xác thực Socket Handshake JWT
  io.use(socketAuthMiddleware);

  io.on("connection", (socket) => {
    const userLogName = socket.user ? `${socket.user.name} (${socket.user.role})` : socket.id;

    // 1. EVENT: Tham Gia Socket Room Lớp Học
    socket.on("JOIN_CLASS_ROOM", async (payload, ack) => {
      try {
        const { classId } = payload || {};

        // BẢO MẬT KHÔNG TIN IDENTITY CLIENT: Dùng danh tính socket.user từ Handshake Token
        const accessCheck = await checkSocketLiveClassAccess(socket.user, classId);

        if (!accessCheck.allowed) {
          console.warn(
            `🔒 [SOCKET_ACCESS_DENIED] ${userLogName} bị chặn join classRoom (${classId}): ${accessCheck.message}`
          );
          if (typeof ack === "function") {
            ack({
              success: false,
              code: accessCheck.code,
              message: accessCheck.message,
              details: null,
            });
          }
          return;
        }

        const roomName = `room_class_${classId}`;
        await socket.join(roomName);
        socket.classRoom = roomName;

        console.log(`📡 [SOCKET_JOINED] Client ${userLogName} đã join room: ${roomName}`);

        if (typeof ack === "function") {
          ack({
            success: true,
            data: {
              classId,
              room: roomName,
              accessType: accessCheck.accessType,
            },
          });
        }
      } catch (err) {
        console.error("[LIVE_SOCKET] JOIN_CLASS_ROOM Error:", err.message);
        if (typeof ack === "function") {
          ack({
            success: false,
            code: "SOCKET_INTERNAL_ERROR",
            message: "Lỗi hệ thống khi tham gia room lớp học.",
          });
        }
      }
    });

    // 2. EVENT: Rời Socket Room Lớp Học
    socket.on("LEAVE_CLASS_ROOM", async (payload, ack) => {
      try {
        const { classId } = payload || {};
        if (classId) {
          const roomName = `room_class_${classId}`;
          await socket.leave(roomName);
          console.log(`🚪 [SOCKET_LEFT] Client ${userLogName} đã rời room: ${roomName}`);
        }
        if (typeof ack === "function") {
          ack({ success: true, data: { classId } });
        }
      } catch (err) {
        if (typeof ack === "function") {
          ack({ success: false, code: "SOCKET_INTERNAL_ERROR", message: "Lỗi khi rời room lớp học." });
        }
      }
    });
  });
}
