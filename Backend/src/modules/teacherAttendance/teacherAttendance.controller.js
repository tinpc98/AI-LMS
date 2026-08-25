import mongoose from "mongoose";
import teacherAttendanceService from "./teacherAttendance.service.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

export const getMyAttendance = asyncHandler(async (req, res) => {
  const teacherId = req.user.id || req.user._id;
  const result = await teacherAttendanceService.getMyAttendance(teacherId, req.query);

  return res.status(200).json({
    success: true,
    message: "Lấy danh sách điểm danh thành công",
    data: result.items,
    pagination: result.pagination,
  });
});

export const getAllAttendanceAdmin = asyncHandler(async (req, res) => {
  const result = await teacherAttendanceService.getAllAttendance(req.query);

  return res.status(200).json({
    success: true,
    message: "Lấy danh sách điểm danh giáo viên thành công",
    data: result.items,
    pagination: result.pagination,
  });
});

export const confirmAttendance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const teacherId = req.user.id || req.user._id;

  const result = await teacherAttendanceService.confirmAttendance(id, teacherId);

  return res.status(200).json({
    success: true,
    message: "Xác nhận điểm danh thành công",
    data: result,
  });
});

export const overrideAttendanceAdmin = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id || req.user._id;
  const payload = req.body; // status, note, unlock

  const result = await teacherAttendanceService.overrideAttendance(id, adminId, payload);

  return res.status(200).json({
    success: true,
    message: "Ghi đè điểm danh thành công",
    data: result,
  });
});
