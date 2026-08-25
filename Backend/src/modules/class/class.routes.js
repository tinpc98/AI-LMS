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
  OpenClass,
  CloseClass,
  ArchiveClass,
  GetClassStudents,
  AddResource,
  RemoveResource,
  ClassTrashList,
  RestoreClass,
  PermanentDeleteClass,
  UploadResource,
  GetResourceAccessUrl,
} from "./class.controller.js";
import { verifyUser } from "#modules/auth";
import { isAdmin, isTeacher } from "#shared/middlewares/rbac.middleware.js";
import { updateClassValidation } from "./class.validator.js";
import {
  resourceUpload,
  validateMagicBytes,
} from "#shared/middlewares/resourceUpload.middleware.js";
import chatRoutes from "../chat/chat.routes.js";


const route = Router();

// API Thùng rác (phải đặt trước /:id)
route.get("/trash", verifyUser, isAdmin, ClassTrashList);

// Xem danh sách và chi tiết lớp học
route.get("/", verifyUser, ClassList);
route.get("/:id", verifyUser, ClassListById);
route.get("/:id/students", verifyUser, GetClassStudents);

// Quản lý tài nguyên bài học của lớp (Giáo viên hoặc Admin)
// QUAN TRọNG: /:id/resources/upload phải đặt TRƯỚC /:id/resources/:resourceId
// để Express không nhầm 'upload' là resourceId.
route.post("/:id/resources/upload", verifyUser, isTeacher, resourceUpload.single("file"), validateMagicBytes, UploadResource);
route.post("/:id/resources", verifyUser, isTeacher, AddResource);
route.delete("/:id/resources/:resourceId", verifyUser, isTeacher, RemoveResource);

// Lấy URL đã ký để truy cập tài nguyên (Student Enrolled, Teacher, Admin)
route.get("/:classId/resources/:resourceId/access", verifyUser, GetResourceAccessUrl);

// Chat & Thảo luận lớp học
route.use("/:classId/messages", chatRoutes);


// Nhóm API quản trị dành riêng cho Admin
route.post("/", verifyUser, isAdmin, AddNewClass);
route.put("/:id", verifyUser, isAdmin, updateClassValidation, UpdateClass);
route.patch("/:id/assign-teacher", verifyUser, isAdmin, AssignTeacher);
route.patch("/:id/unassign-teacher", verifyUser, isAdmin, UnassignTeacher);

// Class Lifecycle
route.patch("/:id/open", verifyUser, isAdmin, OpenClass);
route.patch("/:id/close", verifyUser, isAdmin, CloseClass);
route.patch("/:id/archive", verifyUser, isAdmin, ArchiveClass);

// Deprecated student assignment routes
route.post("/:id/students", verifyUser, isAdmin, AssignStudent);
route.delete("/:id/students/:studentId", verifyUser, isAdmin, RemoveStudent);

route.patch("/:id/delete", verifyUser, isAdmin, DeleteClass);
route.patch("/:id/restore", verifyUser, isAdmin, RestoreClass);
route.delete("/:id/force", verifyUser, isAdmin, PermanentDeleteClass);

export default route;
