// File: src/modules/auth/index.js
// PUBLIC API của module auth (§3.3). Module khác chỉ được import qua file này,
// không thọc thẳng vào file nội bộ — rule no-cross-module-internals sẽ enforce
// điều đó ở Wave 3.6.
//
// Cố ý KHÔNG export auth.service / auth.controller: đó là nội bộ module. Bên ngoài
// chỉ cần model User (để populate/tham chiếu), verifyUser (bảo vệ route), và hai
// router để composition root mount.

export { default as User } from "./user.model.js";
export { verifyUser } from "./auth.middleware.js";
