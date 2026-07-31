// src/sockets/exam.socket.js
import ExamAttempt from "./examAttempt.model.js";
import { checkSocketExamAccess } from "./socketExamAccess.service.js";

// Whitelist các loại hành vi gian lận hợp lệ — chặn client gửi giá trị tùy ý vào DB.
const ALLOWED_CHEAT_TYPES = [
  "TAB_SWITCH",
  "COPY_ATTEMPT",
  "PASTE_ATTEMPT",
  "FULLSCREEN_EXIT",
  "DEVTOOLS_OPEN",
  "MULTIPLE_FACES",
  "NO_FACE_DETECTED",
  "RIGHT_CLICK",
  "WINDOW_BLUR",
];

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log(`🟢 Client kết nối thành công: ${socket.id}`);

    // ==========================================
    // 1. NGHIỆP VỤ VÀO PHÒNG THI (JOIN ROOM)
    // ==========================================
    // BẢO MẬT: không tin userId/role/fullName do client tự khai — danh tính lấy từ
    // socket.user (đã xác thực JWT qua socketAuthMiddleware, đăng ký toàn cục ở main.js).
    socket.on("JOIN_EXAM_ROOM", async ({ examId, attemptId }, ack) => {
      try {
        const accessCheck = await checkSocketExamAccess(socket.user, { examId, attemptId });

        if (!accessCheck.allowed) {
          console.warn(
            `🔒 [EXAM_SOCKET_ACCESS_DENIED] ${socket.user?.name || socket.id} bị chặn join phòng thi (${examId}): ${accessCheck.message}`
          );
          if (typeof ack === "function") {
            ack({ success: false, code: accessCheck.code, message: accessCheck.message });
          }
          return;
        }

        const roomName = `room_exam_${examId}`;
        socket.join(roomName);

        // Gắn dữ liệu đã được kiểm chứng vào chính instance của socket này để dùng lại sau
        socket.userId = socket.user.id;
        socket.attemptId = accessCheck.attempt?._id?.toString() || null;
        socket.role = socket.user.role; // đã lowercase & server-verified (vd "teacher", "student")
        socket.fullName = socket.user.name;
        socket.examRoom = roomName;

        console.log(`👤 ${socket.fullName} (${socket.role}) đã tham gia phòng: ${roomName}`);

        if (typeof ack === "function") {
          ack({ success: true, data: { room: roomName, accessType: accessCheck.accessType } });
        }
      } catch (error) {
        console.error("[EXAM_SOCKET] JOIN_EXAM_ROOM Error:", error.message);
        if (typeof ack === "function") {
          ack({
            success: false,
            code: "SOCKET_INTERNAL_ERROR",
            message: "Lỗi hệ thống khi tham gia phòng thi.",
          });
        }
      }
    });

    // ==========================================
    // 2. NGHIỆP VỤ BẮT ĐẦU THI
    // ==========================================
    socket.on("TEACHER_START_EXAM", () => {
      // Bảo mật: role lấy từ socket.user đã xác thực (gán ở JOIN_EXAM_ROOM), không phải client tự khai
      if (socket.role !== "teacher" || !socket.examRoom) return;

      io.to(socket.examRoom).emit("EXAM_STARTED", {
        message: "Kỳ thi chính thức bắt đầu!",
        timestamp: new Date(),
      });
      console.log(`📢 Giáo viên ${socket.fullName} đã phát lệnh BẮT ĐẦU THI.`);
    });

    // ==========================================
    // 3. NGHIỆP VỤ BÁO ĐỘNG GIAN LẬN (ANTI-CHEAT)
    // ==========================================
    socket.on("STUDENT_CHEAT_DETECTED", async ({ cheatType }) => {
      // Chặn nếu không phải học sinh hoặc thiếu attemptId (đã được xác minh sở hữu ở JOIN_EXAM_ROOM)
      if (socket.role !== "student" || !socket.attemptId) return;

      if (typeof cheatType !== "string" || !ALLOWED_CHEAT_TYPES.includes(cheatType)) {
        console.warn(
          `⚠️ [EXAM_SOCKET] cheatType không hợp lệ từ ${socket.fullName}: ${JSON.stringify(cheatType)}`
        );
        return;
      }

      try {
        // Ràng buộc thêm studentId dù attemptId đã được xác minh sở hữu ở JOIN_EXAM_ROOM (defense-in-depth)
        await ExamAttempt.findOneAndUpdate(
          { _id: socket.attemptId, studentId: socket.userId },
          {
            $inc: { cheatCount: 1 },
            $push: {
              cheatLogs: {
                cheatType,
                timestamp: new Date(),
              },
            },
          }
        );

        // Hệ thống phát cảnh báo này tới phòng hiện tại để GV thấy
        io.to(socket.examRoom).emit("CHEAT_WARNING_ALERT", {
          studentId: socket.userId,
          studentName: socket.fullName,
          cheatType,
          time: new Date(),
        });

        console.log(`🚨 Đã ghi log gian lận vào DB: ${socket.fullName} - Lỗi: ${cheatType}`);
      } catch (error) {
        console.error("❌ Lỗi khi ghi log gian lận vào DB:", error);
      }
    });

    // ==========================================
    // 4. XỬ LÝ NGẮT KẾT NỐI (RỚT MẠNG)
    // ==========================================
    socket.on("disconnect", () => {
      console.log(`🔴 Client ngắt kết nối: ${socket.id} (${socket.fullName || "Unknown"})`);
      // Tùy chọn: Báo cho GV biết có HS vừa rớt mạng
      if (socket.role === "student" && socket.examRoom) {
        io.to(socket.examRoom).emit("STUDENT_DISCONNECTED", {
          studentName: socket.fullName,
        });
      }
    });
  });
}
