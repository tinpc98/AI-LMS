import { Router } from "express";
import {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  getCourseTrash,
  restoreCourse,
  permanentDeleteCourse,
} from "../controllers/course.controller.js";
import { verifyUser } from "#modules/auth";
import { isAdmin } from "#shared/middlewares/rbac.middleware.js";

const router = Router();

// ===== Static routes =====
router.get("/trash", verifyUser, isAdmin, getCourseTrash);

// ===== CRUD =====
router.get("/", verifyUser, getCourses);
router.post("/", verifyUser, isAdmin, createCourse);

router.patch("/:id/restore", verifyUser, isAdmin, restoreCourse);
router.delete("/:id/force", verifyUser, isAdmin, permanentDeleteCourse);

router.get("/:id", verifyUser, getCourseById);
router.put("/:id", verifyUser, isAdmin, updateCourse);
router.delete("/:id", verifyUser, isAdmin, deleteCourse);

export default router;
