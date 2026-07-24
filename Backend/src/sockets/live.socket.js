export default function liveSocketHandler(io) {
  io.on("connection", (socket) => {
    // 1. Tham gia phòng Socket theo Lớp học
    socket.on("JOIN_CLASS_ROOM", ({ classId, userId, role }) => {
      if (!classId) return;
      const roomName = `room_class_${classId}`;
      socket.join(roomName);
      socket.classRoom = roomName;
      socket.userId = userId;
      socket.role = role;
      console.log(`📡 Client ${socket.id} (${role || "User"}) đã tham gia socket room lớp học: ${roomName}`);
    });

    // 2. Rời phòng lớp học
    socket.on("LEAVE_CLASS_ROOM", ({ classId }) => {
      if (!classId) return;
      const roomName = `room_class_${classId}`;
      socket.leave(roomName);
      console.log(`🚪 Client ${socket.id} đã rời socket room lớp học: ${roomName}`);
    });
  });
}
