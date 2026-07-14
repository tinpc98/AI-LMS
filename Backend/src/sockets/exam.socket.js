// src/sockets/exam.socket.js
import ExamAttempt from "../models/examAttempt.model.js";

export default function socketHandler(io) {
  io.on("connection", (socket) => {
    console.log(`🟢 Client kết nối thành công: ${socket.id}`);

    // ==========================================
    // 1. NGHIỆP VỤ VÀO PHÒNG THI (JOIN ROOM)
    // ==========================================
    // Frontend (cả GV và HS) khi vừa vào trang chi tiết Đề thi phải gọi event này ngay
    socket.on(
      "JOIN_EXAM_ROOM",
      ({ examId, attemptId, userId, role, fullName }) => {
        const roomName = `room_exam_${examId}`;

        // Cho user vào đúng phòng của kỳ thi đó
        socket.join(roomName);

        // Gắn dữ liệu tạm thời vào chính instance của socket này để dùng lại sau
        socket.userId = userId;
        socket.attemptId = attemptId; // Quan trọng: Cần id này để ghi log
        socket.role = role;
        socket.fullName = fullName;
        socket.examRoom = roomName;

        console.log(`👤 ${fullName} (${role}) đã tham gia phòng: ${roomName}`);
      },
    );

    // ==========================================
    // 2. NGHIỆP VỤ BẮT ĐẦU THI
    // ==========================================
    socket.on("TEACHER_START_EXAM", () => {
      // Bảo mật 1 lớp: Chỉ account có role TEACHER mới được phát lệnh này
      if (socket.role !== "TEACHER") return;

      // Broadcast sự kiện 'EXAM_STARTED' tới TOÀN BỘ học sinh trong phòng đó
      io.to(socket.examRoom).emit("EXAM_STARTED", {
        message: "Kỳ thi chính thức bắt đầu!",
        timestamp: new Date(),
      });
      console.log(`📢 Giáo viên ${socket.fullName} đã phát lệnh BẮT ĐẦU THI.`);
    });

    // ==========================================
    // 3. NGHIỆP VỤ BÁO ĐỘNG GIAN LẬN (ANTI-CHEAT) - ĐÃ FIX CHUẨN THỰC CHIẾN
    // ==========================================
    socket.on("STUDENT_CHEAT_DETECTED", async ({ cheatType }) => {
      // Chặn nếu không phải học sinh hoặc thiếu attemptId
      if (socket.role !== "STUDENT" || !socket.attemptId) return;

      try {
        // Ghi log vào Database siêu tốc độ bằng $inc và $push
        await ExamAttempt.findByIdAndUpdate(socket.attemptId, {
          $inc: { cheatCount: 1 },
          $push: {
            cheatLogs: {
              cheatType: cheatType,
              timestamp: new Date(),
            },
          },
        });

        // Hệ thống phát cảnh báo này tới phòng hiện tại để GV thấy
        io.to(socket.examRoom).emit("CHEAT_WARNING_ALERT", {
          studentId: socket.userId,
          studentName: socket.fullName,
          cheatType: cheatType, // VD: 'TAB_SWITCH', 'COPY_ATTEMPT'
          time: new Date(),
        });

        console.log(
          `🚨 Đã ghi log gian lận vào DB: ${socket.fullName} - Lỗi: ${cheatType}`,
        );
      } catch (error) {
        console.error("❌ Lỗi khi ghi log gian lận vào DB:", error);
      }
    });

    // ==========================================
    // 4. XỬ LÝ NGẮT KẾT NỐI (RỚT MẠNG)
    // ==========================================
    socket.on("disconnect", () => {
      console.log(
        `🔴 Client ngắt kết nối: ${socket.id} (${socket.fullName || "Unknown"})`,
      );
      // Tùy chọn: Báo cho GV biết có HS vừa rớt mạng
      if (socket.role === "STUDENT" && socket.examRoom) {
        io.to(socket.examRoom).emit("STUDENT_DISCONNECTED", {
          studentName: socket.fullName,
        });
      }
    });
  });
}
