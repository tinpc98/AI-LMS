// File: src/infra/socket/registerHandlers.js
// Nơi DUY NHẤT gom và đăng ký socket handler (§3.4).
//
// Trước đây ba handler nằm chung ở src/sockets/, tách rời khỏi nghiệp vụ chúng phục vụ.
// Nay mỗi handler nằm cạnh module của nó (exam.socket.js trong exam-attempt,
// live.socket.js trong live-session, notification.socket.js trong notification), còn file
// này chỉ đóng vai trò lắp ráp — giống vai trò của src/routes/index.js với router.
//
// File này là COMPOSITION ROOT của socket, tương đương vai trò của src/routes/index.js
// với router — và vì cùng lý do, nó trỏ THẲNG vào *.socket.js chứ không qua index.js.
//
// Lý do: nếu index.js của module re-export socket handler thì một file nội bộ module
// (vd socketExamAccess.service.js) import public API của chính mình sẽ tạo vòng tự thân
// index.js -> exam.socket.js -> index.js. Đã xảy ra thật ở Wave 3.4 và chỉ rule
// no-circular phát hiện, test vẫn xanh. Đây là đúng bài học đã rút ra với router.
import socketAuthMiddleware from "./socketAuth.middleware.js";
import examSocketHandler from "#modules/exam-attempt/exam.socket.js";
import liveSocketHandler from "#modules/live-session/live.socket.js";
import notificationSocketHandler from "#modules/notification/notification.socket.js";

export const registerSocketHandlers = (io) => {
  // Xác thực JWT handshake cho MỌI kết nối Socket.io, đăng ký tường minh ở đây thay vì
  // phụ thuộc ngầm vào thứ tự import của từng module socket — đảm bảo không handler nào
  // có thể vô tình bỏ sót bước xác thực.
  io.use(socketAuthMiddleware);

  examSocketHandler(io);
  liveSocketHandler(io);
  notificationSocketHandler(io);
};

export default registerSocketHandlers;
