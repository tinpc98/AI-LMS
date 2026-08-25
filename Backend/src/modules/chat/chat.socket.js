import mongoose from "mongoose";
import { Class } from "#modules/class";
import { logger } from "#shared/utils/logger.js";
import ClassEnrollment from "../classEnrollment/classEnrollment.model.js";

const checkSocketChatAccess = async (user, classId) => {
  if (!user || !user.id || !user.role) {
    return { allowed: false, message: "Chưa xác thực" };
  }

  if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
    return { allowed: false, message: "classId không hợp lệ" };
  }

  const targetClass = await Class.findOne({ _id: classId, isDeleted: false })
    .select("_id teacherId students className")
    .lean();

  if (!targetClass) {
    return { allowed: false, message: "Lớp học không tồn tại" };
  }

  const role = user.role.toLowerCase();

  if (role === "admin") {
    return { allowed: true, targetClass, accessType: "admin" };
  }

  if (role === "teacher") {
    const isOwner = targetClass.teacherId && targetClass.teacherId.toString() === user.id;
    if (!isOwner) {
      return { allowed: false, message: "Bạn không quản lý lớp này" };
    }
    return { allowed: true, targetClass, accessType: "teacher" };
  }

  if (role === "student") {
    const isEnrolled = await ClassEnrollment.exists({
      classId,
      studentId: user.id,
      status: "ACTIVE"
    });
    if (!isEnrolled) {
      return { allowed: false, message: "Bạn không thuộc lớp học này hoặc đã bị chuyển" };
    }
    return { allowed: true, targetClass, accessType: "student" };
  }

  return { allowed: false, message: "Vai trò không hợp lệ" };
};

export default function chatSocketHandler(io) {
  io.on("connection", (socket) => {
    // 1. Tham gia phòng chat
    socket.on("JOIN_CHAT_ROOM", async (payload, ack) => {
      try {
        const { classId } = payload || {};
        const accessCheck = await checkSocketChatAccess(socket.user, classId);

        if (!accessCheck.allowed) {
          if (typeof ack === "function") {
            ack({ success: false, message: accessCheck.message });
          }
          return;
        }

        const roomName = `chat_class_${classId}`;
        await socket.join(roomName);
        
        // Lưu thông tin vào socket để xử lý khi disconnect
        socket.chatRooms = socket.chatRooms || new Set();
        socket.chatRooms.add(roomName);

        if (typeof ack === "function") {
          ack({ success: true, room: roomName });
        }
      } catch (error) {
        console.error("[CHAT_SOCKET] JOIN_CHAT_ROOM Error:", error.message);
        if (typeof ack === "function") {
          ack({ success: false, message: "Lỗi hệ thống" });
        }
      }
    });

    // 2. Rời phòng chat
    socket.on("LEAVE_CHAT_ROOM", async (payload, ack) => {
      try {
        const { classId } = payload || {};
        if (classId) {
          const roomName = `chat_class_${classId}`;
          await socket.leave(roomName);
          if (socket.chatRooms) {
            socket.chatRooms.delete(roomName);
          }
        }
        if (typeof ack === "function") {
          ack({ success: true });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ success: false, message: "Lỗi hệ thống" });
        }
      }
    });

    // 3. Đang gõ tin nhắn
    socket.on("TYPING_START", (payload) => {
      const { classId } = payload || {};
      if (classId && socket.chatRooms?.has(`chat_class_${classId}`)) {
        socket.to(`chat_class_${classId}`).emit("CHAT_USER_TYPING", {
          classId,
          userId: socket.user.id,
          userName: socket.user.name || socket.user.fullName,
          isTyping: true,
        });
      }
    });

    socket.on("TYPING_END", (payload) => {
      const { classId } = payload || {};
      if (classId && socket.chatRooms?.has(`chat_class_${classId}`)) {
        socket.to(`chat_class_${classId}`).emit("CHAT_USER_TYPING", {
          classId,
          userId: socket.user.id,
          isTyping: false,
        });
      }
    });
  });
}
