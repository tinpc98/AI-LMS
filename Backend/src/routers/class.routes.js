import { Router } from "express";
import {
  AddNewClass,
  ClassList,
  ClassListById,
  DeleteClass,
  UpdateClass,
  AssignTeacher,
  AssignStudent,
  RemoveStudent,
  AddResource,
  RemoveResource,
} from "../controllers/class.controller.js";
import { verifyUser, isAdmin, isTeacher } from "../middlewares/auth.middlewares.js";

const route = Router();

// Xem danh sách và chi tiết lớp học
route.get("/", verifyUser, ClassList);
route.get("/:id", verifyUser, ClassListById);

// Quản lý tài nguyên bài học của lớp (Giáo viên hoặc Admin)
route.post("/:id/resources", verifyUser, isTeacher, AddResource);
route.delete("/:id/resources/:resourceId", verifyUser, isTeacher, RemoveResource);

// Nhóm API quản trị dành riêng cho Admin
route.post("/", verifyUser, isAdmin, AddNewClass);
route.put("/:id", verifyUser, isAdmin, UpdateClass);
route.put("/:id/assign-teacher", verifyUser, isAdmin, AssignTeacher);
route.post("/:id/students", verifyUser, isAdmin, AssignStudent);
route.delete("/:id/students/:studentId", verifyUser, isAdmin, RemoveStudent);
route.delete("/:id", verifyUser, isAdmin, DeleteClass);

export default route;
