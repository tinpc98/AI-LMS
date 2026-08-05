// File: src/modules/class/index.js
// PUBLIC API của module class (§3.3).
//
// Cố ý KHÔNG export: class.service, class.controller, class.validator và cả 3 file
// classProgress* — đó là nội bộ module.

export { default as Class } from "./class.model.js";
export { checkClassTeacherOwnership } from "./class.ownership.js";
export { checkClassAccess } from "./class.access.middleware.js";

// LƯU Ý NỢ KỸ THUẬT: verifyClassTeacherAccess (classAuth.helper.js) và
// checkClassTeacherOwnership (class.ownership.js) làm gần như CÙNG một việc — kiểm tra
// giáo viên có phụ trách lớp hay không — chỉ khác cách báo lỗi (ném exception vs trả
// boolean). Sự trùng lặp này có sẵn từ trước, chỉ lộ ra khi gom về một module.
// Wave 3 là wave chỉ-di-chuyển nên giữ nguyên cả hai; hợp nhất ở Wave 4.
export { verifyClassTeacherAccess } from "./classAuth.helper.js";
