// File: src/modules/notification/index.js
// PUBLIC API của module notification (§3.3).
//
// notificationService được export vì module live-session bắn thông báo khi phiên học
// trực tuyến bắt đầu/kết thúc — phụ thuộc nghiệp vụ hợp lệ giữa hai module.

export { default as Notification } from "./notification.model.js";
export { default as notificationService } from "./notification.service.js";

// Socket handler nam canh nghiep vu (§3.4).
