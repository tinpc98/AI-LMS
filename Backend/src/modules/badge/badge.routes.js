// File: src/modules/badge/badge.routes.js
// Nhánh /ranking, /badges, /activities của tiền tố /api/learning.
//
// Tách từ learning.routes.js ở Wave 3.2 — xem ghi chú ở
// modules/lesson/lessonProgress.routes.js: cả hai router vẫn mount cùng tiền tố
// /api/learning nên URL bên ngoài không đổi.
import { Router } from "express";
import {
  getClassRanking,
  getStudentRanking,
  getMyBadges,
  getMyActivities,
} from "./badge.controller.js";
import { verifyUser } from "#modules/auth";
import { checkClassAccess } from "#modules/class";

const router = Router();

router.use(verifyUser);

// Ranking
// BUG ĐÃ SỬA: trước đây chỉ yêu cầu đăng nhập, không kiểm người gọi có thuộc lớp :classId hay
// không — bất kỳ ai đăng nhập cũng xem được họ tên/email/điểm XP của mọi học sinh trong lớp
// bất kỳ. checkClassAccess (đã có sẵn, dùng ở module class/chat) đọc classId từ req.params nên
// áp thẳng được ở đây (Admin: toàn quyền; Teacher: phải phụ trách lớp; Student: phải đang
// ACTIVE trong lớp).
router.get("/ranking/class/:classId", checkClassAccess, getClassRanking);
// getStudentRanking lấy classId từ query string (không phải :param) nên checkClassAccess không
// áp trực tiếp được — kiểm quyền riêng ngay trong controller (xem badge.controller.js).
router.get("/ranking/student/:studentId", getStudentRanking);

// Gamification
router.get("/badges", getMyBadges);
router.get("/activities", getMyActivities);

export default router;
