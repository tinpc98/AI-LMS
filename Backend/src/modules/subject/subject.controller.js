import subjectService from "./subject.service.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

const createSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.createSubject(req.body, req.user.id);
  res.status(201).json({
    success: true,
    message: "Tạo môn học thành công",
    data: subject,
  });
});

const getSubjects = asyncHandler(async (req, res) => {
  // Nếu là student, ép filter status = ACTIVE
  const filters = { ...req.query };
  if (req.user.role === "Student") {
    filters.status = "ACTIVE";
  }

  const result = await subjectService.getSubjects(filters);
  res.status(200).json({
    success: true,
    message: "Lấy danh sách môn học thành công",
    data: result.items,
    pagination: result.pagination,
  });
});

const getSubjectById = asyncHandler(async (req, res) => {
  const subject = await subjectService.getSubjectById(req.params.id);
  
  // Sinh viên chỉ được xem subject ACTIVE
  if (req.user.role === "Student" && subject.status !== "ACTIVE") {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy môn học",
    });
  }

  res.status(200).json({
    success: true,
    message: "Lấy chi tiết môn học thành công",
    data: subject,
  });
});

const updateSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.updateSubject(req.params.id, req.body, req.user.id);
  res.status(200).json({
    success: true,
    message: "Cập nhật môn học thành công",
    data: subject,
  });
});

const activateSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.activateSubject(req.params.id, req.user.id);
  res.status(200).json({
    success: true,
    message: "Kích hoạt môn học thành công",
    data: subject,
  });
});

const archiveSubject = asyncHandler(async (req, res) => {
  const subject = await subjectService.archiveSubject(req.params.id, req.user.id);
  res.status(200).json({
    success: true,
    message: "Lưu trữ môn học thành công",
    data: subject,
  });
});

export default {
  createSubject,
  getSubjects,
  getSubjectById,
  updateSubject,
  activateSubject,
  archiveSubject,
};
