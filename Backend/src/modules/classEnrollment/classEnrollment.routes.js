import { Router } from "express";
import { verifyUser } from "#modules/auth";
import { isAdmin, isStudent } from "#shared/middlewares/rbac.middleware.js";
import {
  AssignClass,
  TransferClass,
  CompleteClassEnrollment,
  CancelClassEnrollment,
  GetClassEnrollments,
  GetMyClassEnrollments,
} from "./classEnrollment.controller.js";

const route = Router();

// Student routes
route.get("/my", verifyUser, isStudent, GetMyClassEnrollments);

// Admin routes
route.post("/", verifyUser, isAdmin, AssignClass);
route.get("/", verifyUser, isAdmin, GetClassEnrollments);
route.patch("/:id/transfer", verifyUser, isAdmin, TransferClass);
route.patch("/:id/complete", verifyUser, isAdmin, CompleteClassEnrollment);
route.patch("/:id/cancel", verifyUser, isAdmin, CancelClassEnrollment);

export default route;
