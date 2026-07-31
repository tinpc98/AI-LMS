import { Router } from "express";
import {
  AddNewClass,
  ClassList,
  ClassListById,
  DeleteClass,
  UpdateClass,
  AssignTeacher,
  UnassignTeacher,
  AssignStudent,
  RemoveStudent,
  UpdateStudentStatus,
  AddResource,
  RemoveResource,
  ClassTrashList,
  RestoreClass,
  PermanentDeleteClass,
} from "./class.controller.js";
import { verifyUser } from "#modules/auth";
import { isAdmin, isTeacher } from "#shared/middlewares/rbac.middleware.js";
import { updateClassValidation } from "./class.validator.js";

const route = Router();

// API Thùng rác (phải đặt trước /:id)
route.get("/trash", verifyUser, isAdmin, ClassTrashList);

// Xem danh sách và chi tiết lớp học
route.get("/", verifyUser, ClassList);
route.get("/:id", verifyUser, ClassListById);

// Quản lý tài nguyên bài học của lớp (Giáo viên hoặc Admin)
route.post("/:id/resources", verifyUser, isTeacher, AddResource);
route.delete("/:id/resources/:resourceId", verifyUser, isTeacher, RemoveResource);

// Nhóm API quản trị dành riêng cho Admin
route.post("/", verifyUser, isAdmin, AddNewClass);
route.put("/:id", verifyUser, isAdmin, updateClassValidation, UpdateClass);
route.patch("/:id/assign-teacher", verifyUser, isAdmin, AssignTeacher); // PATCH: chỉ update 2-3 field
route.patch("/:id/unassign-teacher", verifyUser, isAdmin, UnassignTeacher); // Gỡ giáo viên
route.post("/:id/students", verifyUser, isAdmin, AssignStudent);
route.delete("/:id/students/:studentId", verifyUser, isAdmin, RemoveStudent);
route.patch("/:id/students/:studentId/status", verifyUser, isTeacher, UpdateStudentStatus); // Admin hoặc Teacher
route.patch("/:id/delete", verifyUser, isAdmin, DeleteClass); // PATCH: soft delete (flag update)
route.patch("/:id/restore", verifyUser, isAdmin, RestoreClass);
route.delete("/:id/force", verifyUser, isAdmin, PermanentDeleteClass);

export default route;
