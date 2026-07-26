import { Router } from "express";
import {
  AddNewClass,
  ClassList,
  ClassListById,
  DeleteClass,
  UpdateClass,
} from "../controllers/class.controller.js";
import { verifyUser, isAdmin } from "../middlewares/auth.middlewares.js";
const route = Router();

// Nhóm API Học sinh & Giáo viên & Admin xem danh sách lớp được phân công
route.get("/", verifyUser, ClassList);
route.get("/:id", verifyUser, ClassListById);

// Nhóm API chỉ dành riêng cho Quản trị viên (Admin)
route.post("/", verifyUser, isAdmin, AddNewClass);
route.put("/:id", verifyUser, isAdmin, UpdateClass);
route.delete("/:id", verifyUser, isAdmin, DeleteClass);

export default route;

