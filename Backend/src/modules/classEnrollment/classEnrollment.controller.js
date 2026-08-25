import { asyncHandler } from "#shared/utils/asyncHandler.js";
import classEnrollmentService from "./classEnrollment.service.js";
import mongoose from "mongoose";

export const AssignClass = asyncHandler(async (req, res) => {
  const { enrollmentId, classId } = req.body;
  const adminId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(enrollmentId) || !mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({ success: false, message: "ID không hợp lệ" });
  }

  const result = await classEnrollmentService.assignClass({ enrollmentId, classId, adminId });
  
  return res.status(201).json({
    success: true,
    message: "Xếp lớp thành công",
    data: result,
  });
});

export const TransferClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { targetClassId } = req.body;
  const adminId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(targetClassId)) {
    return res.status(400).json({ success: false, message: "ID không hợp lệ" });
  }

  const result = await classEnrollmentService.transferClass({ classEnrollmentId: id, targetClassId, adminId });
  
  return res.status(200).json({
    success: true,
    message: "Chuyển lớp thành công",
    data: result,
  });
});

export const CompleteClassEnrollment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID không hợp lệ" });
  }

  const result = await classEnrollmentService.completeClassEnrollment({ classEnrollmentId: id, adminId });
  
  return res.status(200).json({
    success: true,
    message: "Đánh dấu hoàn thành lớp học thành công",
    data: result,
  });
});

export const CancelClassEnrollment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id || req.user._id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID không hợp lệ" });
  }

  const result = await classEnrollmentService.cancelClassEnrollment({ classEnrollmentId: id, adminId });
  
  return res.status(200).json({
    success: true,
    message: "Đã hủy lớp học thành công",
    data: result,
  });
});

export const GetClassEnrollments = asyncHandler(async (req, res) => {
  const filters = {
    studentId: req.query.studentId,
    classId: req.query.classId,
    enrollmentId: req.query.enrollmentId,
    status: req.query.status,
  };

  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const result = await classEnrollmentService.getClassEnrollments(filters, { skip, limit });

  return res.status(200).json({
    success: true,
    message: "Lấy danh sách ClassEnrollment thành công",
    data: result.data,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    }
  });
});

export const GetMyClassEnrollments = asyncHandler(async (req, res) => {
  const studentId = req.user.id || req.user._id;
  
  const filters = {
    studentId,
    status: req.query.status,
  };

  const limit = parseInt(req.query.limit) || 10;
  const page = parseInt(req.query.page) || 1;
  const skip = (page - 1) * limit;

  const result = await classEnrollmentService.getClassEnrollments(filters, { skip, limit });

  return res.status(200).json({
    success: true,
    message: "Lấy danh sách lớp học của bạn thành công",
    data: result.data,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages
    }
  });
});
