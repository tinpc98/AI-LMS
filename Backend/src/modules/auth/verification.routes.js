// File: src/modules/auth/verification.routes.js
// Routes cho EduSpace mechanism design Phần C.1/C.2 — mounted dưới /verification.
import { Router } from "express";
import { verifyUser } from "./auth.middleware.js";
import { isAdmin, isTeacher } from "#shared/middlewares/rbac.middleware.js";
import {
  getL3Eligibility,
  promoteToL3,
  vouchForTeacher,
  suspendTeacherVouchers,
  getMyVerificationStatus,
  getMyCoTaughtColleagues,
} from "./verification.controller.js";

const router = Router();

// Tự xem trạng thái của chính mình — đặt trước "/:id/..." dù không trùng shape, để rõ ràng đây
// là nhóm "self-service" tách biệt với nhóm thao tác trên người khác (Admin) ở dưới.
router.get("/me", verifyUser, isTeacher, getMyVerificationStatus);
router.get("/me/co-taught-colleagues", verifyUser, isTeacher, getMyCoTaughtColleagues);

router.get("/:id/l3-eligibility", verifyUser, isAdmin, getL3Eligibility);
router.post("/:id/promote-l3", verifyUser, isAdmin, promoteToL3);
// Bảo lãnh: chỉ Teacher (chính họ phải là L3 — service tự kiểm, không cần rbac tách riêng vì
// "phải là L3" là điều kiện NGHIỆP VỤ có thể đổi theo dữ liệu, khác "phải là Teacher" vốn cố
// định theo role).
router.post("/vouch", verifyUser, isTeacher, vouchForTeacher);
router.post("/:id/suspend-vouchers", verifyUser, isAdmin, suspendTeacherVouchers);

export default router;
