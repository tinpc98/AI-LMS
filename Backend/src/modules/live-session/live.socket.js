import { checkSocketLiveClassAccess } from "./socketLiveAccess.service.js";
import { logger } from "#shared/utils/logger.js";
import ClassSession from "../classSession/classSession.model.js";
import Attendance from "../attendance/attendance.model.js";

/**
 * Đóng ĐÚNG khoảng join-leave mà socket NÀY đã mở (khớp theo joinAt chính xác của socket này,
 * không phải "khoảng nào đang mở" chung chung) — nếu học sinh mở 2 thiết bị cùng lúc, mỗi
 * thiết bị có 1 khoảng riêng; đóng nhầm khoảng của thiết bị KHÁC khi 1 thiết bị ngắt kết nối
 * sẽ làm sai dữ liệu của thiết bị còn lại đang online. Dùng chung cho cả LEAVE_CLASS_ROOM lẫn
 * disconnect vì logic hệt nhau.
 */
async function closeAttendanceSession({ sessionId, studentId, joinTime, io, classId }) {
  const leaveTime = new Date();

  await ClassSession.updateOne(
    { _id: sessionId, "rawParticipants.studentId": studentId },
    {
      $set: { "rawParticipants.$.leaveTime": leaveTime },
      $inc: {
        "rawParticipants.$.durationSeconds": Math.floor(
          (leaveTime.getTime() - joinTime.getTime()) / 1000
        ),
      },
    }
  );

  await Attendance.updateOne(
    { sessionId, studentId },
    { $set: { "evidence.sessions.$[elem].leaveAt": leaveTime } },
    { arrayFilters: [{ "elem.joinAt": joinTime, "elem.leaveAt": null }] }
  );

  const updatedSession = await ClassSession.findById(sessionId)
    .select("rawParticipants classId")
    .lean();
  if (updatedSession && io) {
    const activeCount = updatedSession.rawParticipants.filter((p) => !p.leaveTime).length;
    const targetClassId = classId || updatedSession.classId;
    io.to(`room_class_${targetClassId}`).emit("LIVE_PARTICIPANTS_UPDATED", {
      classId: targetClassId,
      sessionId,
      activeCount,
    });
  }
}

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
        if (socket.user.role === "student" || socket.user.role === "Student") {
          const activeSession = await ClassSession.findOne({
            classId,
            status: "IN_PROGRESS",
            isDeleted: false,
          });
          if (activeSession) {
            socket.liveSessionId = activeSession._id;
            socket.joinTime = new Date();

            // Upsert participant
            const participantExists = activeSession.rawParticipants.some(
              (p) => p.studentId.toString() === socket.user.id.toString()
            );

            if (!participantExists) {
              await ClassSession.updateOne(
                { _id: activeSession._id },
                {
                  $push: {
                    rawParticipants: {
                      studentId: socket.user.id,
                      joinTime: socket.joinTime,
                    },
                  },
                }
              );
            }

            // BUG ĐÃ SỬA: trước đây $set thẳng "evidence.firstJoinAt" trên MỌI lần join, kể cả
            // lần thứ 2/3 (rớt mạng vào lại) — ghi đè mất mốc vào lần ĐẦU TIÊN thật, làm sai
            // first_join_delay (dùng để phân biệt PRESENT/LATE). Và cộng dồn onlineDurationSeconds
            // qua $inc theo từng phiên riêng sẽ đếm TRÙNG nếu học sinh mở 2 thiết bị cùng lúc —
            // 2 khoảng thời gian chồng lấn cộng lại thành gấp đôi. Sửa bằng cách lưu THÔ từng
            // khoảng join-leave vào evidence.sessions[]; firstJoinAt/tổng thời gian tham dự được
            // TÍNH LẠI từ dữ liệu thô này (union các khoảng, không cộng dồn) ở thời điểm chốt sổ
            // — xem attendanceEvidence.js#computeUnionSeconds/computeFirstJoinAt.
            const existingAttendance = await Attendance.findOne({
              sessionId: activeSession._id,
              studentId: socket.user.id,
            })
              .select("evidence.sessions")
              .lean();
            const isRejoin = (existingAttendance?.evidence?.sessions || []).length > 0;

            await Attendance.updateOne(
              { sessionId: activeSession._id, studentId: socket.user.id },
              {
                $push: { "evidence.sessions": { joinAt: socket.joinTime, leaveAt: null } },
                ...(isRejoin ? { $inc: { "evidence.rejoinCount": 1 } } : {}),
              }
            );

            // Lấy lại đếm số lượng participant hiện tại
            const updatedSession = await ClassSession.findById(activeSession._id)
              .select("rawParticipants")
              .lean();
            const activeCount = updatedSession.rawParticipants.filter((p) => !p.leaveTime).length;

            // Broadcast realtime
            io.to(roomName).emit("LIVE_PARTICIPANTS_UPDATED", {
              classId,
              sessionId: activeSession._id,
              activeCount,
            });
          }
        }

        logger.debug(`📡 [SOCKET_JOINED] Client ${userLogName} đã join room: ${roomName}`);

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
          logger.debug(`🚪 [SOCKET_LEFT] Client ${userLogName} đã rời room: ${roomName}`);
        }

        // Bổ sung Track Participant Leave
        if (
          socket.user &&
          (socket.user.role === "student" || socket.user.role === "Student") &&
          socket.liveSessionId &&
          socket.joinTime
        ) {
          await closeAttendanceSession({
            sessionId: socket.liveSessionId,
            studentId: socket.user.id,
            joinTime: socket.joinTime,
            io,
            classId,
          });

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
          ack({
            success: false,
            code: "SOCKET_INTERNAL_ERROR",
            message: "Lỗi khi rời room lớp học.",
          });
        }
      }
    });

    // 3. EVENT: Disconnect
    socket.on("disconnect", async () => {
      if (
        socket.user &&
        (socket.user.role === "student" || socket.user.role === "Student") &&
        socket.liveSessionId &&
        socket.joinTime
      ) {
        try {
          await closeAttendanceSession({
            sessionId: socket.liveSessionId,
            studentId: socket.user.id,
            joinTime: socket.joinTime,
            io,
          });
        } catch (error) {
          console.error("[LIVE_SOCKET] Disconnect Attendance Track Error:", error.message);
        }
      }
    });
  });
}
