import crypto from "crypto";
import mongoose from "mongoose";
import { matchedData } from "express-validator";
import * as classRepo from "./class.repository.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";
import { Course } from "#modules/course";
import { User } from "#modules/auth";
import ClassEnrollment from "../classEnrollment/classEnrollment.model.js";
import classService from "./class.service.js";
import { attachStudentProgress } from "./classProgress.service.js";
import storageService from "#shared/services/storage.service.js";
import {
  CLASS_STORAGE_LIMIT_BYTES,
  QUOTA_WARNING_THRESHOLD,
} from "#shared/middlewares/resourceUpload.middleware.js";

// Lấy danh sách lớp học (Hỗ trợ phân trang, tìm kiếm và lọc theo vai trò)
export const ClassList = asyncHandler(async (req, res) => {
  const userId = (req.user?.id || req.user?._id || "").toString();
  const userRole = (req.user?.role || "").toLowerCase();

  // Dùng Service để build query
  const { finalQuery, skip, limitNum, pageNum, sortOption } = await classService.buildClassQueryOptions(
    req.query,
    false,
    userRole,
    userId
  );

  const [classList, total] = await Promise.all([
    classRepo.findClassesPaginated(finalQuery, { skip, limit: limitNum, sort: sortOption }),
    classRepo.countClasses(finalQuery),
  ]);

  // Bổ sung tiến độ học tập thật cho học sinh (thay cho số ngẫu nhiên phía Frontend).
  // Với giáo viên/admin, hàm này trả về danh sách nguyên trạng và không tốn query nào.
  const dataWithProgress = await attachStudentProgress(classList, { id: userId, role: userRole });

  return res.status(200).json({
    success: true,
    message: "Lấy danh sách lớp học thành công",
    data: dataWithProgress,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

//=====================================================================================

// Lấy chi tiết 1 lớp học theo ID
export const ClassListById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  const classDetail = await classRepo.findClassByIdPopulated(id);

  if (!classDetail) {
    return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
  }

  // STUDENT AUTHORIZATION
  const userRole = (req.user?.role || "").toLowerCase();
  if (userRole === "student") {
    const userId = (req.user?.id || req.user?._id || "").toString();
    const isEnrolled = await ClassEnrollment.exists({
      classId: id,
      studentId: userId,
      status: "ACTIVE"
    });
    if (!isEnrolled) {
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền xem thông tin lớp học này." });
    }
  }

  // MIGRATION PHASE 3: Lấy danh sách học sinh từ ClassEnrollment thay vì mảng students cũ
  const enrollments = await ClassEnrollment.find({ classId: id, status: "ACTIVE" })
    .populate("studentId", "fullName email avatar phone")
    .lean();

  classDetail.students = enrollments.map((e) => ({
    studentId: e.studentId,
    status: "Enrolled", // Trạng thái hiển thị trên giao diện
    joinedAt: e.createdAt,
    notes: "",
  }));
  classDetail.currentStudents = enrollments.length;
  // Ghi đè activeCount cho chắc chắn khớp với số enrollment thực tế
  classDetail.activeCount = enrollments.length;

  return res
    .status(200)
    .json({ success: true, message: "Lấy chi tiết lớp học thành công", data: classDetail });
});

//=====================================================================================
// Tạo lớp học mới (Dành cho Admin)
export const AddNewClass = asyncHandler(async (req, res) => {
  const {
    name,
    courseId,
    teacherId,
    code,
    room,
    classRoom,
    mode,
    schedule,
    startDate,
    endDate,
    capacity,
    description,
    note,
    status,
    isEnrollmentOpen,
    students,
    googleMeetLink,
    googleCalendarEventId,
    gradingWeight,
    level,
  } = req.body;

  if (!name || !courseId || !level) {
    return res.status(400).json({ success: false, message: "Vui lòng nhập tên lớp, khóa học và level" });
  }

  if (!mongoose.Types.ObjectId.isValid(courseId)) {
    return res.status(400).json({ success: false, message: "ID khóa học không hợp lệ!" });
  }

  const courseExists = await Course.findById(courseId);
  if (!courseExists) {
    return res.status(404).json({ success: false, message: "Khóa học không tồn tại" });
  }

  if (teacherId && !mongoose.Types.ObjectId.isValid(teacherId)) {
    return res.status(400).json({ success: false, message: "ID giáo viên không hợp lệ!" });
  }

  const newClassData = {
    name: name.trim(),
    code: code?.trim().toUpperCase() || `CLS-${Date.now().toString().slice(-6)}`,
    courseId,
    level,
    teacherId: teacherId || null,
    assignedBy: req.user.id || req.user._id,
    assignedAt: teacherId ? new Date() : null,
    meetingRoomId: null, // Legacy field (Deprecated) - Sprint J1
    googleMeetLink: googleMeetLink || "",
    googleCalendarEventId: googleCalendarEventId || "",
    classRoom: classRoom ?? room ?? "",
    mode: mode || "OFFLINE",
    schedule: schedule || { days: [], startTime: "", endTime: "" },
    gradingWeight: gradingWeight || { attendance: 10, assignment: 20, midterm: 30, final: 40 },
    startDate: startDate || null,
    endDate: endDate || null,
    capacity: capacity || 30,
    activeCount: Array.isArray(students) ? students.length : 0,
    students: Array.isArray(students) ? students : [],
    description: description || "",
    note: note || "",
    isEnrollmentOpen: typeof isEnrollmentOpen === "boolean" ? isEnrollmentOpen : true,
    status: status || "DRAFT",
  };

  const savedClass = await classRepo.createClass(newClassData).save();
  return res
    .status(201)
    .json({ success: true, message: "Tạo lớp học thành công", data: savedClass });
});

//=====================================================================================
// Cập nhật lớp học (Dành cho Admin)
export const UpdateClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  // matchedData() chỉ trả về các trường đã được khai báo & validate hợp lệ trong
  // updateClassValidation — chặn mass-assignment vào các trường có luồng nghiệp vụ
  // riêng (teacherId, students, isDeleted,...) mà route này không được phép ghi đè.
  const updateData = matchedData(req, { onlyValidData: true });
  if (Object.keys(updateData).length === 0) {
    return res
      .status(400)
      .json({ success: false, message: "Không có trường hợp lệ nào để cập nhật." });
  }

  const updatedClass = await classRepo.updateClassByIdPopulated(id, updateData);

  if (!updatedClass) {
    return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
  }

  return res
    .status(200)
    .json({ success: true, message: "Cập nhật lớp học thành công", data: updatedClass });
});

//=====================================================================================
// Phân công Giáo viên cho lớp học (Dành cho Admin)
export const AssignTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { teacherId } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
    return res.status(400).json({ success: false, message: "ID giáo viên không hợp lệ" });
  }

  // Validate Class Status before assigning
  const targetClass = await classRepo.findClassById(id);
  if (!targetClass) {
    return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
  }

  const allowedStatuses = ["DRAFT", "OPEN", "FULL"];
  if (!allowedStatuses.includes(targetClass.status)) {
    return res.status(400).json({
      success: false,
      message: `Không thể phân công giáo viên cho lớp học đang ở trạng thái: ${targetClass.status}`,
    });
  }

  // Fix: MongoDB is case-sensitive, User role enum is "Teacher" (PascalCase)
  const teacherExists = await User.findOne({ _id: teacherId, role: "Teacher", isDeleted: false });
  if (!teacherExists) {
    return res.status(400).json({ success: false, message: "Giáo viên không hợp lệ" });
  }

  const updatedClass = await classRepo.updateClassByIdPopulated(id, {
    teacherId,
    assignedBy: req.user.id || req.user._id,
    assignedAt: new Date(),
  });

  if (!updatedClass) {
    return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
  }

  return res
    .status(200)
    .json({ success: true, message: "Phân công giáo viên thành công", data: updatedClass });
});

//=====================================================================================
// Thêm học sinh vào lớp (Dành cho Admin)
export const AssignStudent = asyncHandler(async (req, res) => {
  return res.status(410).json({
    success: false,
    message: "Route này đã bị loại bỏ (Deprecated). Vui lòng sử dụng ClassEnrollment API (/api/class-enrollments) để thêm học sinh vào lớp.",
  });
});

//=====================================================================================
// Xóa / Gỡ học sinh khỏi lớp (Dành cho Admin)
export const RemoveStudent = asyncHandler(async (req, res) => {
  return res.status(410).json({
    success: false,
    message: "Route này đã bị loại bỏ (Deprecated). Vui lòng sử dụng ClassEnrollment API (/api/class-enrollments) để quản lý học sinh trong lớp.",
  });
});

//=====================================================================================
// Thêm tài nguyên bài học vào lớp học (Dành cho Giáo viên / Admin)
export const AddResource = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, type, url } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  if (!title || !url) {
    return res
      .status(400)
      .json({ success: false, message: "Tiêu đề và URL tài nguyên là bắt buộc" });
  }

  const targetClass = await classRepo.findClassById(id);
  if (!targetClass) {
    return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
  }

  const validTypes = ["Document", "Video", "Link", "Other"];
  const resourceType = validTypes.includes(type) ? type : "Document";

  const userId = req.user.id || req.user._id;

  targetClass.resources.push({
    title: title.trim(),
    description: description?.trim() || "",
    type: resourceType,
    url: url.trim(),
    uploadedBy: userId,
    uploadedAt: new Date(),
  });

  await targetClass.save();

  return res
    .status(200)
    .json({ success: true, message: "Thêm tài nguyên thành công", data: targetClass });
});

//=====================================================================================
// Xóa tài nguyên bài học (Dành cho Teacher/Admin)
export const RemoveResource = asyncHandler(async (req, res) => {
  const { id, resourceId } = req.params;

  if (
    !id ||
    !mongoose.Types.ObjectId.isValid(id) ||
    !resourceId ||
    !mongoose.Types.ObjectId.isValid(resourceId)
  ) {
    return res
      .status(400)
      .json({ success: false, message: "ID lớp học hoặc ID tài nguyên không hợp lệ!" });
  }

  const isAuthorized = await classService.checkClassTeacherOwnership(
    id,
    req.user?.id || req.user?._id,
    req.user?.role
  );
  if (!isAuthorized) {
    return res
      .status(403)
      .json({ success: false, message: "Bạn không có quyền xóa tài nguyên của lớp học này!" });
  }

  const targetClass = await classRepo.findClassById(id);
  if (!targetClass) {
    return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
  }

  const resource = targetClass.resources.find(
    (r) => r._id && r._id.toString() === resourceId.toString()
  );

  // Nếu là file upload (có publicId), xóa trên Cloudinary trước.
  // Thất bại Cloudinary: ghi log, vẫn xóa DB — không chặn người dùng vì lỗi ngoài.
  if (resource?.publicId) {
    const deleted = await storageService.deleteFile(resource.publicId, {
      resourceType: resource.resourceType || "raw",
      storageType: resource.storageType || "authenticated",
    });
    if (!deleted) {
      console.error(
        `[RemoveResource] Xóa file Cloudinary thất bại. publicId: "${resource.publicId}" ` +
          `(classId: ${id}, resourceId: ${resourceId}) — cần dọn dẹp thủ công.`
      );
    }
  }

  targetClass.resources = targetClass.resources.filter(
    (r) => r._id && r._id.toString() !== resourceId.toString()
  );

  await targetClass.save();

  return res
    .status(200)
    .json({ success: true, message: "Xóa tài nguyên thành công", data: targetClass });
});

//=====================================================================================
// Xóa lớp học (Dành cho Admin)
export const DeleteClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  const userId = req.user?.id || req.user?._id;
  const deleteClass = await classRepo.softDeleteClass(id, userId);

  if (!deleteClass) {
    return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
  }
  return res
    .status(200)
    .json({ success: true, message: "Xóa lớp học thành công", data: deleteClass });
});

//=====================================================================================
// Lấy danh sách lớp học trong thùng rác (isDeleted = true)
export const ClassTrashList = asyncHandler(async (req, res) => {
  const userId = (req.user?.id || req.user?._id || "").toString();
  const userRole = (req.user?.role || "").toLowerCase();

  // Dùng Service để build query cho Trash (truyền isTrash = true)
  const { finalQuery, skip, limitNum, pageNum, sortOption } = await classService.buildClassQueryOptions(
    req.query,
    true,
    userRole,
    userId
  );

  const [classList, total] = await Promise.all([
    classRepo.findClassesPaginated(finalQuery, {
      skip,
      limit: limitNum,
      sort: sortOption,
      withDeleted: true,
    }),
    classRepo.countClasses(finalQuery, { withDeleted: true }),
  ]);

  return res.status(200).json({
    success: true,
    message: "Lấy danh sách thùng rác thành công",
    data: classList,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    },
  });
});

//=====================================================================================
// Phục hồi lớp học từ thùng rác (Dành cho Admin)
export const RestoreClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  const restoredClass = await classRepo.restoreClass(id);

  if (!restoredClass) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy lớp học trong thùng rác",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Phục hồi lớp học thành công",
    data: restoredClass,
  });
});

//=====================================================================================
// Xóa vĩnh viễn lớp học (Dành cho Admin)
export const PermanentDeleteClass = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  const deleted = await classRepo.permanentlyDeleteClass(id);

  if (!deleted) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy lớp học trong thùng rác để xóa vĩnh viễn",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Xóa vĩnh viễn lớp học thành công",
  });
});

//=====================================================================================
// Gỡ Giáo viên khỏi lớp học (Dành cho Admin)
export const UnassignTeacher = asyncHandler(async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  // Validate Class Status before unassigning
  const targetClass = await classRepo.findClassById(id);
  if (!targetClass) {
    return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
  }

  const allowedStatuses = ["Draft", "Ready", "Ongoing"];
  if (!allowedStatuses.includes(targetClass.status)) {
    return res.status(400).json({
      success: false,
      message: `Không thể gỡ phân công giáo viên cho lớp học đang ở trạng thái: ${targetClass.status}`,
    });
  }

  const updatedClass = await classRepo.updateClassByIdPopulated(id, {
    $set: {
      teacherId: null,
      assignedBy: null,
      assignedAt: null,
    },
  });

  if (!updatedClass) {
    return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
  }

  return res
    .status(200)
    .json({ success: true, message: "Gỡ giáo viên khỏi lớp học thành công", data: updatedClass });
});

//=====================================================================================
// Upload tài liệu lên Cloudinary (Dành cho Teacher/Admin phụ trách lớp)
// POST /api/classes/:id/resources/upload
export const UploadResource = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, description, type } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  // req.file đã được multer + validateMagicBytes xác nhận hợp lệ trước khi vào đây.
  if (!req.file) {
    return res.status(400).json({ success: false, message: "Chưa có file được tải lên." });
  }

  if (!title || !title.trim()) {
    return res.status(400).json({ success: false, message: "Tiêu đề tài liệu là bắt buộc." });
  }

  // Kiểm tra quyền: phải là giáo viên phụ trách LỚP NÀY hoặc admin
  const userId = req.user?.id || req.user?._id;
  const isAuthorized = await classService.checkClassTeacherOwnership(id, userId, req.user?.role);
  if (!isAuthorized) {
    return res
      .status(403)
      .json({ success: false, message: "Bạn không có quyền tải tài liệu lên lớp học này!" });
  }

  const targetClass = await classRepo.findClassById(id);
  if (!targetClass) {
    return res.status(404).json({ success: false, message: "Lớp học không tồn tại." });
  }

  // Kiểm tra hạn mức lớp
  const currentUsage = targetClass.resources.reduce((sum, r) => sum + (r.bytes || 0), 0);
  const newFileSize = req.file.size;
  const projectedUsage = currentUsage + newFileSize;

  if (projectedUsage > CLASS_STORAGE_LIMIT_BYTES) {
    const usedMB = (currentUsage / (1024 * 1024)).toFixed(1);
    const limitMB = (CLASS_STORAGE_LIMIT_BYTES / (1024 * 1024 * 1024)).toFixed(0);
    const availableMB = ((CLASS_STORAGE_LIMIT_BYTES - currentUsage) / (1024 * 1024)).toFixed(1);
    return res.status(400).json({
      success: false,
      message: `Lớp đã vượt quá hạn mức lưu trữ. Đã dùng: ${usedMB} MB / ${limitMB} GB. Còn trống: ${availableMB} MB.`,
      storageUsed: currentUsage,
      storageLimit: CLASS_STORAGE_LIMIT_BYTES,
    });
  }

  // Upload lên Cloudinary
  let uploadResult;
  try {
    uploadResult = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      {
        folder: `eduspace/classes/${id}`,
        resourceType: "raw",
      }
    );
  } catch (uploadError) {
    throw uploadError; // Let asyncHandler handle it
  }

  try {
    // Xác định loại tài nguyên dựa trên type do client gửi hoặc MIME đã phát hiện
    const validTypes = ["Document", "Video", "Link", "Other"];
    const detectedExt = req.file.detectedExt || "";
    const nameExt =
      req.file.originalname && req.file.originalname.includes(".")
        ? req.file.originalname.split(".").pop().toLowerCase()
        : "";
    const resolvedFormat = (detectedExt || nameExt || uploadResult.format || "").toLowerCase() || null;

    let resourceTypeLabel = "Document";
    if (validTypes.includes(type)) {
      resourceTypeLabel = type;
    } else if (["jpg", "jpeg", "png", "webp", "gif"].includes(resolvedFormat || "")) {
      resourceTypeLabel = "Other";
    }

    const newResource = {
      title: title.trim(),
      description: description?.trim() || "",
      type: resourceTypeLabel,
      url: null,               // Không có URL ngoài, dùng publicId
      publicId: uploadResult.publicId,
      storageType: "authenticated",
      resourceType: uploadResult.resourceType,
      format: resolvedFormat,
      bytes: uploadResult.bytes,
      originalFilename: req.file.originalname,
      uploadedBy: userId,
      uploadedAt: new Date(),
    };

    targetClass.resources.push(newResource);
    await targetClass.save();

    // Tính quota sau upload
    const usageAfter = projectedUsage;
    const isNearQuota = usageAfter / CLASS_STORAGE_LIMIT_BYTES >= QUOTA_WARNING_THRESHOLD;

    const response = {
      success: true,
      message: "Tải tài liệu lên thành công!",
      data: targetClass.resources[targetClass.resources.length - 1],
      storageUsed: usageAfter,
      storageLimit: CLASS_STORAGE_LIMIT_BYTES,
    };

    if (isNearQuota) {
      response.warning = `Lớp đã dùng ${((usageAfter / CLASS_STORAGE_LIMIT_BYTES) * 100).toFixed(1)}% dung lượng. Vui lòng xóa bớt tài liệu cũ để tránh hết quota.`;
    }

    return res.status(201).json(response);
  } catch (error) {
    if (uploadResult?.publicId) {
      try {
        await storageService.deleteFile(uploadResult.publicId, uploadResult.resourceType || "raw");
      } catch (cleanupError) {
        console.error(`[UploadResource] Rollback Cloudinary failed for publicId: ${uploadResult.publicId}`, cleanupError);
      }
    }
    throw error;
  }
});

//=====================================================================================
// Lấy URL đã ký để xem tài liệu (Student Enrolled, Teacher phụ trách, Admin)
// GET /api/classes/:classId/resources/:resourceId/access
export const GetResourceAccessUrl = asyncHandler(async (req, res) => {
  const { classId, resourceId } = req.params;

  if (!classId || !mongoose.Types.ObjectId.isValid(classId)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }
  if (!resourceId || !mongoose.Types.ObjectId.isValid(resourceId)) {
    return res.status(400).json({ success: false, message: "ID tài nguyên không hợp lệ!" });
  }

  // Quan trọng: tìm lớp từ classId do client gửi, rồi XÁC NHẬN resource thật sự thuộc lớp đó.
  // Nếu không làm bước này, sinh viên có thể gửi classId của lớp mình + resourceId của lớp khác.
  const targetClass = await classRepo.findClassById(classId);
  if (!targetClass) {
    return res.status(404).json({ success: false, message: "Lớp học không tồn tại." });
  }

  const resource = targetClass.resources.find(
    (r) => r._id && r._id.toString() === resourceId.toString()
  );

  if (!resource) {
    return res.status(404).json({
      success: false,
      message: "Tài nguyên không tồn tại trong lớp học này.",
    });
  }

  // Nếu là liên kết ngoài (không có publicId), trả thẳng URL — không cần ký
  if (!resource.publicId) {
    return res.status(200).json({
      success: true,
      data: {
        signedUrl: resource.url,
        expiresAt: null,
        isExternal: true,
      },
    });
  }

  // Kiểm tra quyền
  const userId = (req.user?.id || req.user?._id || "").toString();
  const userRole = (req.user?.role || "").toLowerCase();

  let isAuthorized = false;

  if (userRole === "admin") {
    isAuthorized = true;
  } else if (userRole === "teacher") {
    isAuthorized = targetClass.teacherId?.toString() === userId;
  } else if (userRole === "student") {
    // Chỉ sinh viên có trạng thái ACTIVE mới được xem
    isAuthorized = await ClassEnrollment.exists({
      classId,
      studentId: userId,
      status: "ACTIVE"
    });
  }

  if (!isAuthorized) {
    return res.status(403).json({
      success: false,
      message: "Bạn không có quyền xem tài nguyên này.",
    });
  }

  // Sinh URL đã ký, hiệu lực 2 giờ
  const { signedUrl, expiresAt } = storageService.getSignedUrl(resource.publicId, {
    resourceType: resource.resourceType || "raw",
    durationSeconds: 7200,
  });

  return res.status(200).json({
    success: true,
    data: { signedUrl, expiresAt, isExternal: false },
  });
});

//=====================================================================================
export const GetClassStudents = asyncHandler(async (req, res) => {
  return res.status(410).json({
    success: false,
    message: "Route này đã bị loại bỏ (Deprecated). Vui lòng lấy danh sách học sinh thông qua ClassEnrollment API (/api/class-enrollments).",
  });
});

//=====================================================================================
// Lifecycle hooks
const updateClassLifecycleStatus = async (req, res, targetStatus) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  const targetClass = await classRepo.findClassById(id);
  if (!targetClass) {
    return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
  }

  targetClass.status = targetStatus;
  await targetClass.save();

  return res.status(200).json({ success: true, message: `Cập nhật trạng thái thành ${targetStatus} thành công`, data: targetClass });
};

export const OpenClass = asyncHandler(async (req, res) => {
  return updateClassLifecycleStatus(req, res, "OPEN");
});

export const CloseClass = asyncHandler(async (req, res) => {
  return updateClassLifecycleStatus(req, res, "CLOSED");
});

export const ArchiveClass = asyncHandler(async (req, res) => {
  return updateClassLifecycleStatus(req, res, "ARCHIVED");
});
