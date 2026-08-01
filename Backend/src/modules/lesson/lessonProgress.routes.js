// File: src/modules/lesson/lessonProgress.routes.js
// Nhánh /progress/* của tiền tố /api/learning.
//
// Tách từ learning.routes.js ở Wave 3.2. Router cũ mount ở /api/learning và phục vụ cả
// tiến độ bài giảng lẫn xếp hạng/huy hiệu. Nay chẻ làm hai theo module, nhưng CẢ HAI vẫn
// được mount ở /api/learning trong src/routes/index.js — Express khớp lần lượt nên URL
// bên ngoài KHÔNG đổi một ký tự nào. Đây là điều kiện để việc chẻ này vẫn nằm trong
// phạm vi wave chỉ-di-chuyển.
import { Router } from "express";
import { getStudentProgress, updateLessonProgress } from "./lessonProgress.controller.js";
import { verifyUser } from "#modules/auth";

const router = Router();

router.use(verifyUser);

router.get("/progress/class/:classId", getStudentProgress);
router.post("/progress", updateLessonProgress);

export default router;
