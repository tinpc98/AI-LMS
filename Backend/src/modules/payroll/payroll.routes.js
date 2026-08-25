import { Router } from "express";
import {
  calculatePayroll,
  confirmPayroll,
  payPayroll,
  getMyPayrolls,
  getAllPayrolls,
  createPayrollConfig,
  getPayrollConfigs,
  createPayrollPeriod,
  getPayrollPeriods,
} from "./payroll.controller.js";
import { verifyUser } from "#modules/auth/index.js";
import { isTeacher, isAdmin } from "#shared/middlewares/rbac.middleware.js";

const router = Router();

// ==========================
// TEACHER ROUTES
// ==========================
router.get("/my", verifyUser, isTeacher, getMyPayrolls);

// ==========================
// ADMIN ROUTES
// ==========================
// Payrolls
router.get("/", verifyUser, isAdmin, getAllPayrolls);
router.post("/:id/confirm", verifyUser, isAdmin, confirmPayroll);
router.post("/:id/pay", verifyUser, isAdmin, payPayroll);

// Configs
router.post("/config", verifyUser, isAdmin, createPayrollConfig);
router.get("/config", verifyUser, isAdmin, getPayrollConfigs);

// Periods
router.post("/periods", verifyUser, isAdmin, createPayrollPeriod);
router.get("/periods", verifyUser, isAdmin, getPayrollPeriods);
router.post("/periods/:id/calculate", verifyUser, isAdmin, calculatePayroll);

export default router;
