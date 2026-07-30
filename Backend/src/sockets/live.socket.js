import { checkSocketLiveClassAccess } from "../services/socketLiveAccess.service.js";
import LiveSession from "../models/liveSession.model.js";

/**
 * Socket.IO Handler cho Module Học Trực Tuyến (Live Session)
 * Lưu ý: middleware xác thực JWT handshake (socketAuthMiddleware) được đăng ký TOÀN CỤC
 * một lần duy nhất ở main.js — áp dụng cho mọi socket, không chỉ riêng module Live Session.
 */
export default function liveSocketHandler(io) {
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

        // Bổ sung Track Participant Join
        if (socket.user.role === "Student") {
          const activeSession = await LiveSession.findOne({ classId, status: "Live", isDeleted: false });
          if (activeSession) {
            socket.liveSessionId = activeSession._id;
            socket.joinTime = new Date();
            
            // Upsert participant
            const participantExists = activeSession.participants.some(
              (p) => p.studentId.toString() === socket.user.id.toString()
            );

            if (!participantExists) {
              await LiveSession.updateOne(
                { _id: activeSession._id },
                {
                  $push: {
                    participants: {
                      studentId: socket.user.id,
                      joinTime: socket.joinTime,
                      status: "Present"
                    }
                  }
                }
              );
            }
            
            // Lấy lại đếm số lượng participant hiện tại
            const updatedSession = await LiveSession.findById(activeSession._id).select("participants").lean();
            const activeCount = updatedSession.participants.filter(p => !p.leaveTime).length;
            
            // Broadcast realtime
            io.to(roomName).emit("LIVE_PARTICIPANTS_UPDATED", {
              classId,
              sessionId: activeSession._id,
              activeCount
            });
          }
        }

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

        // Bổ sung Track Participant Leave
        if (socket.user && socket.user.role === "Student" && socket.liveSessionId && socket.joinTime) {
          const leaveTime = new Date();
          const durationSeconds = Math.floor((leaveTime.getTime() - socket.joinTime.getTime()) / 1000);
          
          await LiveSession.updateOne(
            { _id: socket.liveSessionId, "participants.studentId": socket.user.id },
            {
              $set: {
                "participants.$.leaveTime": leaveTime
              },
              $inc: {
                "participants.$.durationSeconds": durationSeconds
              }
            }
          );
          
          const updatedSession = await LiveSession.findById(socket.liveSessionId).select("participants").lean();
          const activeCount = updatedSession.participants.filter(p => !p.leaveTime).length;
          
          if (classId) {
             io.to(`room_class_${classId}`).emit("LIVE_PARTICIPANTS_UPDATED", {
              classId,
              sessionId: socket.liveSessionId,
              activeCount
            });
          }

          // Xóa biến tạm
          delete socket.liveSessionId;
          delete socket.joinTime;
        }

        if (typeof ack === "function") {
          ack({ success: true, data: { classId } });
        }
      } catch (err) {
        console.error("[LIVE_SOCKET] LEAVE_CLASS_ROOM Error:", err.message);
        if (typeof ack === "function") {
          ack({ success: false, code: "SOCKET_INTERNAL_ERROR", message: "Lỗi khi rời room lớp học." });
        }
      }
    });

    // 3. EVENT: Disconnect
    socket.on("disconnect", async () => {
      if (socket.user && socket.user.role === "Student" && socket.liveSessionId && socket.joinTime) {
        try {
          const leaveTime = new Date();
          const durationSeconds = Math.floor((leaveTime.getTime() - socket.joinTime.getTime()) / 1000);
          
          await LiveSession.updateOne(
            { _id: socket.liveSessionId, "participants.studentId": socket.user.id },
            {
              $set: {
                "participants.$.leaveTime": leaveTime
              },
              $inc: {
                "participants.$.durationSeconds": durationSeconds
              }
            }
          );
          
          const updatedSession = await LiveSession.findById(socket.liveSessionId).select("participants classId").lean();
          if (updatedSession) {
            const activeCount = updatedSession.participants.filter(p => !p.leaveTime).length;
            io.to(`room_class_${updatedSession.classId}`).emit("LIVE_PARTICIPANTS_UPDATED", {
              classId: updatedSession.classId,
              sessionId: socket.liveSessionId,
              activeCount
            });
          }
        } catch (error) {
          console.error("[LIVE_SOCKET] Disconnect Attendance Track Error:", error.message);
        }
      }
    });
  });
}
