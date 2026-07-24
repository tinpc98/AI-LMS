import { Router } from "express";
import {
  AddNewClass,
  ClassList,
  ClassListById,
  DeleteClass,
  JoinClass,
  UpdateClass,
} from "../controllers/class.controller.js";
import { verifyUser, isTeacher } from "../middlewares/auth.middlewares.js";
const route = Router();

// Nhóm API Học sinh & Giáo viên đều dùng được
route.get("/", verifyUser, ClassList);
route.get("/:id", verifyUser, ClassListById);
route.post("/join", verifyUser, JoinClass);

// Nhóm API chỉ dành riêng cho Giáo viên
route.post("/", verifyUser, isTeacher, AddNewClass);
route.put("/:id", verifyUser, isTeacher, UpdateClass);
route.delete("/:id", verifyUser, isTeacher, DeleteClass);
export default route;
