// File: src/modules/live-session/index.js
// PUBLIC API của module live-session (§3.3).
//
// validateJaasConfig được export vì src/server.js gọi nó lúc khởi động để cảnh báo nếu
// thiếu cấu hình 8x8 JaaS (tính năng tuỳ chọn, không chặn boot).
//
// vụ, không gom chung một thư mục sockets/ tách rời. Việc đăng ký handler do
// infra/socket/registerHandlers.js làm.

export { default as LiveSession } from "./liveSession.model.js";
export { validateJaasConfig } from "./jaas.controller.js";
