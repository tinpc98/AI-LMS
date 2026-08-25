import payrollService from "./payroll.service.js";
import TeacherPayrollConfig from "./payrollConfig.model.js";
import PayrollPeriod from "./payrollPeriod.model.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

// =======================
// PAYROLL CONTROLLERS
// =======================

export const calculatePayroll = asyncHandler(async (req, res) => {
  const { id } = req.params; // payrollPeriodId
  const adminId = req.user.id || req.user._id;
  const result = await payrollService.calculatePayroll(id, adminId);
  return res.status(200).json({ success: true, message: result.message });
});

export const confirmPayroll = asyncHandler(async (req, res) => {
  const { id } = req.params; // payrollId
  const adminId = req.user.id || req.user._id;
  const result = await payrollService.confirmPayroll(id, adminId);
  return res.status(200).json({ success: true, data: result });
});

export const payPayroll = asyncHandler(async (req, res) => {
  const { id } = req.params; // payrollId
  const adminId = req.user.id || req.user._id;
  const result = await payrollService.payPayroll(id, adminId);
  return res.status(200).json({ success: true, data: result });
});

export const getMyPayrolls = asyncHandler(async (req, res) => {
  const teacherId = req.user.id || req.user._id;
  const result = await payrollService.getMyPayrolls(teacherId, req.query);
  return res.status(200).json({ success: true, ...result });
});

export const getAllPayrolls = asyncHandler(async (req, res) => {
  const result = await payrollService.getAllPayrolls(req.query);
  return res.status(200).json({ success: true, ...result });
});

// =======================
// PAYROLL CONFIG CONTROLLERS (ADMIN)
// =======================

export const createPayrollConfig = asyncHandler(async (req, res) => {
  const config = await TeacherPayrollConfig.create(req.body);
  return res.status(201).json({ success: true, data: config });
});

export const getPayrollConfigs = asyncHandler(async (req, res) => {
  const filter = { isDeleted: false };
  if (req.query.teacherId) filter.teacherId = req.query.teacherId;
  
  const configs = await TeacherPayrollConfig.find(filter)
    .populate("teacherId", "fullName email")
    .sort({ createdAt: -1 });
  return res.status(200).json({ success: true, data: configs });
});

// =======================
// PAYROLL PERIOD CONTROLLERS (ADMIN)
// =======================

export const createPayrollPeriod = asyncHandler(async (req, res) => {
  const period = await PayrollPeriod.create(req.body);
  return res.status(201).json({ success: true, data: period });
});

export const getPayrollPeriods = asyncHandler(async (req, res) => {
  const periods = await PayrollPeriod.find({ isDeleted: false }).sort({ startDate: -1 });
  return res.status(200).json({ success: true, data: periods });
});
