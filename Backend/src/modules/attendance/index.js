// File: src/modules/attendance/index.js
// PUBLIC API của module attendance (§3.3).
//
// attendanceService được export vì module live-session gọi markAttendance() khi học sinh
// tham gia phiên học trực tuyến — điểm danh tự động. Đây là phụ thuộc nghiệp vụ hợp lệ
// giữa hai module, đi qua public API.
// Controller và routes là nội bộ module.

export { default as Attendance } from "./attendance.model.js";
export { default as attendanceService } from "./attendance.service.js";
