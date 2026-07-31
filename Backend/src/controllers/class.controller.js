import crypto from "crypto";
import mongoose from "mongoose";
import { matchedData } from "express-validator";
import classModel from "../models/class.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.model.js";
import classService from "../services/class.service.js";
import { attachStudentProgress } from "../services/classProgress.service.js";

// Lấy danh sách lớp học (Hỗ trợ phân trang, tìm kiếm và lọc theo vai trò)
export const ClassList = async (req, res) => {
  try {
    const userId = (req.user?.id || req.user?._id || "").toString();
    const userRole = (req.user?.role || "").toLowerCase();

    // Dùng Service để build query
    const { finalQuery, skip, limitNum, pageNum, sortOption } = 
      classService.buildClassQueryOptions(req.query, false, userRole, userId);

    const [classList, total] = await Promise.all([
      classModel
        .find(finalQuery)
        .populate("teacherId", "fullName email avatar phone teachingSubjects")
        .populate("assignedBy", "fullName email")
        .populate("courseId", "courseName subject grade status description")
        .populate("students.studentId", "fullName email avatar phone")
        .populate("resources.uploadedBy", "fullName email")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      classModel.countDocuments(finalQuery),
    ]);

    // Bổ sung tiến độ học tập thật cho học sinh (thay cho số ngẫu nhiên phía Frontend).
    // Với giáo viên/admin, hàm này trả về danh sách nguyên trạng và không tốn query nào.
    const dataWithProgress = await attachStudentProgress(classList, { id: userId, role: userRole });

    return res.status(200).json({ success: true, message: "Lấy danh sách lớp học thành công",
      data: dataWithProgress,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("[ClassController] ClassList Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Lỗi nội bộ trên Server khi lấy danh sách lớp học" });
  }
};

//=====================================================================================

// Lấy chi tiết 1 lớp học theo ID
export const ClassListById = async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  try {
    const classDetail = await classModel
      .findById(id)
      .populate("teacherId", "fullName email phone avatar teachingSubjects")
      .populate("assignedBy", "fullName email")
      .populate("students.studentId", "fullName email phone avatar")
      .populate("resources.uploadedBy", "fullName email")
      .populate("courseId", "courseName subject grade status description")
      .lean();

    if (!classDetail) {
      return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
    }

    // STUDENT AUTHORIZATION
    const userRole = (req.user?.role || "").toLowerCase();
    if (userRole === "student") {
      const userId = (req.user?.id || req.user?._id || "").toString();
      const isEnrolled = (classDetail.students || []).some(
        (s) => s.studentId && (s.studentId._id || s.studentId).toString() === userId
      );
      if (!isEnrolled) {
        return res.status(403).json({ success: false, message: "Bạn không có quyền xem thông tin lớp học này." });
      }
    }

    return res.status(200).json({ success: true, message: "Lấy chi tiết lớp học thành công", data: classDetail });
  } catch (error) {
    console.error("[ClassController] ClassListById Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Lỗi khi tải chi tiết lớp học" });
  }
};

//=====================================================================================
// Tạo lớp học mới (Dành cho Admin)
export const AddNewClass = async (req, res) => {
  try {
    const {
      className,
      courseId,
      teacherId,
      classCode,
      room,
      classRoom,
      learningMode,
      schedule,
      startDate,
      endDate,
      maxStudents,
      description,
      note,
      status,
      isEnrollmentOpen,
      students,
      googleMeetLink,
      googleCalendarEventId,
      gradingWeight,
    } = req.body;

    if (!className || !courseId) {
      return res.status(400).json({ success: false, message: "Vui lòng nhập tên lớp và khóa học" });
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
      className: className.trim(),
      classCode: classCode?.trim() || `CLS-${Date.now().toString().slice(-6)}`,
      courseId,
      teacherId: teacherId || null,
      assignedBy: req.user.id || req.user._id,
      assignedAt: teacherId ? new Date() : null,
      meetingRoomId: null, // Legacy field (Deprecated) - Sprint J1</span>
      googleMeetLink: googleMeetLink || "",
      googleCalendarEventId: googleCalendarEventId || "",
      classRoom: classRoom ?? room ?? "",
      learningMode: learningMode || "Offline",
      schedule: schedule || { days: [], startTime: "", endTime: "" },
      gradingWeight: gradingWeight || { attendance: 10, assignment: 20, midterm: 30, final: 40 },
      startDate: startDate || null,
      endDate: endDate || null,
      maxStudents: maxStudents || 30,
      currentStudents: Array.isArray(students) ? students.length : 0,
      students: Array.isArray(students) ? students : [],
      description: description || "",
      note: note || "",
      isEnrollmentOpen: typeof isEnrollmentOpen === "boolean" ? isEnrollmentOpen : true,
      status: status || "Draft",
    };

    const savedClass = await new classModel(newClassData).save();
    return res.status(201).json({ success: true, message: "Tạo lớp học thành công", data: savedClass });
  } catch (error) {
    console.error("[ClassController] Create Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Lỗi khi tạo lớp học" });
  }
};

//=====================================================================================
// Cập nhật lớp học (Dành cho Admin)
export const UpdateClass = async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  try {
    // matchedData() chỉ trả về các trường đã được khai báo & validate hợp lệ trong
    // updateClassValidation — chặn mass-assignment vào các trường có luồng nghiệp vụ
    // riêng (teacherId, students, isDeleted,...) mà route này không được phép ghi đè.
    const updateData = matchedData(req, { onlyValidData: true });
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ success: false, message: "Không có trường hợp lệ nào để cập nhật." });
    }

    const updatedClass = await classModel.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
      .populate("teacherId", "fullName email phone avatar teachingSubjects")
      .populate("assignedBy", "fullName email")
      .populate("students.studentId", "fullName email phone avatar")
      .populate("resources.uploadedBy", "fullName email")
      .populate("courseId", "courseName subject grade status description");

    if (!updatedClass) {
      return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
    }

    return res.status(200).json({ success: true, message: "Cập nhật lớp học thành công", data: updatedClass });
  } catch (error) {
    console.error("[ClassController] UpdateClass Error:", error);
    const isValidationError = error.name === "ValidationError";
    return res.status(isValidationError ? 400 : 500).json({ success: false, message: error.message || "Lỗi khi cập nhật lớp học" });
  }
};

//=====================================================================================
// Phân công Giáo viên cho lớp học (Dành cho Admin)
export const AssignTeacher = async (req, res) => {
  const { id } = req.params;
  const { teacherId } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
    return res.status(400).json({ success: false, message: "ID giáo viên không hợp lệ" });
  }

  try {
    // Validate Class Status before assigning
    const targetClass = await classModel.findById(id);
    if (!targetClass) {
      return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
    }

    const allowedStatuses = ["Draft", "Ready", "Ongoing"];
    if (!allowedStatuses.includes(targetClass.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Không thể phân công giáo viên cho lớp học đang ở trạng thái: ${targetClass.status}` 
      });
    }

    // Fix: MongoDB is case-sensitive, User role enum is "Teacher" (PascalCase)
    const teacherExists = await User.findOne({ _id: teacherId, role: "Teacher", isDeleted: false });
    if (!teacherExists) {
      return res.status(400).json({ success: false, message: "Giáo viên không hợp lệ" });
    }

    const updatedClass = await classModel.findByIdAndUpdate(
      id,
      { teacherId, assignedBy: req.user.id || req.user._id, assignedAt: new Date() },
      { new: true, runValidators: true }
    )
    .populate("teacherId", "fullName email avatar phone teachingSubjects")
    .populate("assignedBy", "fullName email")
    .populate("courseId", "courseName subject grade status description")
    .populate("students.studentId", "fullName email avatar phone")
    .populate("resources.uploadedBy", "fullName email");

    if (!updatedClass) {
      return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
    }

    return res.status(200).json({ success: true, message: "Phân công giáo viên thành công", data: updatedClass });
  } catch (error) {
    console.error("[ClassController] AssignTeacher Error:", error);
    const isValidationError = error.name === "ValidationError";
    return res.status(isValidationError ? 400 : 500).json({ success: false, message: error.message || "Lỗi khi phân công giáo viên" });
  }
};

//=====================================================================================
// Thêm học sinh vào lớp (Dành cho Admin)
export const AssignStudent = async (req, res) => {
  const { id } = req.params;
  const { studentId } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Class ID is invalid." });
  }

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ success: false, message: "Student ID is invalid." });
  }

  try {
    const studentExists = await User.findOne({ _id: studentId, role: "Student", isDeleted: false });
    if (!studentExists) {
      return res.status(400).json({ success: false, message: "Student not found or invalid role." });
    }

    const updatedClass = await classModel.findOneAndUpdate(
      { _id: id, isEnrollmentOpen: true, "students.studentId": { $ne: studentId }, $expr: { $lt: [{ $size: { $ifNull: ["$students", []] } }, "$maxStudents"] } },
      { 
        $push: { students: { studentId, joinedAt: new Date(), status: "Enrolled" } },
        $inc: { currentStudents: 1 }
      },
      { new: true, runValidators: true }
    )
    .populate("teacherId", "fullName email avatar phone teachingSubjects")
    .populate("assignedBy", "fullName email")
    .populate("courseId", "courseName subject grade status description")
    .populate("students.studentId", "fullName email avatar phone")
    .populate("resources.uploadedBy", "fullName email");

    if (!updatedClass) {
      const classCheck = await classModel.findById(id);
      if (!classCheck) return res.status(404).json({ success: false, message: "Class not found." });
      if (!classCheck.isEnrollmentOpen) return res.status(400).json({ success: false, message: "Enrollment for this class is currently closed." });
      const isEnrolled = classCheck.students.some(s => s.studentId && s.studentId.toString() === studentId);
      if (isEnrolled) return res.status(400).json({ success: false, message: "Student is already enrolled in this class." });
      return res.status(400).json({ success: false, message: "Class has reached its maximum capacity or enrollment is closed." });
    }

    return res.status(200).json({ success: true, message: "Student added to class successfully.", data: updatedClass });
  } catch (error) {
    console.error("[ClassController] AssignStudent Error:", error);
    const isValidationError = error.name === "ValidationError";
    return res.status(isValidationError ? 400 : 500).json({ success: false, message: error.message || "An error occurred while adding student to class." });
  }
};

//=====================================================================================
// Xóa / Gỡ học sinh khỏi lớp (Dành cho Admin)
export const RemoveStudent = async (req, res) => {
  const { id, studentId } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id) || !studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ success: false, message: "ID lớp học hoặc ID học sinh không hợp lệ!" });
  }

  try {
    const updatedClass = await classModel.findOneAndUpdate(
      { _id: id, "students.studentId": studentId },
      { 
        $pull: { students: { studentId } },
        $inc: { currentStudents: -1 }
      },
      { new: true, runValidators: true }
    )
    .populate("teacherId", "fullName email avatar phone teachingSubjects")
    .populate("assignedBy", "fullName email")
    .populate("courseId", "courseName subject grade status description")
    .populate("students.studentId", "fullName email avatar phone")
    .populate("resources.uploadedBy", "fullName email");

    if (!updatedClass) {
      return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
    }

    return res.status(200).json({ success: true, message: "Xóa học sinh khỏi lớp thành công", data: updatedClass });
  } catch (error) {
    console.error("[ClassController] RemoveStudent Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Lỗi khi xóa học sinh khỏi lớp" });
  }
};

//=====================================================================================
// Thêm tài nguyên bài học vào lớp học (Dành cho Giáo viên / Admin)
export const AddResource = async (req, res) => {
  const { id } = req.params;
  const { title, description, type, url } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  try {
    if (!title || !url) {
      return res.status(400).json({ success: false, message: "Tiêu đề và URL tài nguyên là bắt buộc" });
    }

    const targetClass = await classModel.findById(id);
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

    return res.status(200).json({ success: true, message: "Thêm tài nguyên thành công", data: targetClass });
  } catch (error) {
    console.error("[ClassController] AddResource Error:", error);
    return res.status(400).json({ success: false, message: error.message || "Lỗi khi thêm tài nguyên bài học" });
  }
};

//=====================================================================================
// Xóa tài nguyên bài học (Dành cho Teacher/Admin)
export const RemoveResource = async (req, res) => {
  const { id, resourceId } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id) || !resourceId || !mongoose.Types.ObjectId.isValid(resourceId)) {
    return res.status(400).json({ success: false, message: "ID lớp học hoặc ID tài nguyên không hợp lệ!" });
  }

  try {
    const isAuthorized = await checkClassTeacherOwnership(id, req.user?.id || req.user?._id, req.user?.role);
    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Bạn không có quyền xóa tài nguyên của lớp học này!" });
    }

    const targetClass = await classModel.findById(id);
    if (!targetClass) {
      return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
    }

    targetClass.resources = targetClass.resources.filter(
      (r) => r._id && r._id.toString() !== resourceId.toString()
    );

    await targetClass.save();

    return res.status(200).json({ success: true, message: "Xóa tài nguyên thành công", data: targetClass });
  } catch (error) {
    console.error("[ClassController] RemoveResource Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Lỗi khi xóa tài nguyên" });
  }
};

//=====================================================================================
// Xóa lớp học (Dành cho Admin)
export const DeleteClass = async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  try {
    const userId = req.user?.id || req.user?._id;
    const deleteClass = await classModel.softDelete(id, userId);

    if (!deleteClass) {
      return res.status(404).json({ success: false, message: "Lớp học không tồn tại",
      });
    }
    return res.status(200).json({ success: true, message: "Xóa lớp học thành công", data: deleteClass });
  } catch (error) {
    console.error("[ClassController] DeleteClass Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Lỗi khi xóa lớp học" });
  }
};

//=====================================================================================
// Lấy danh sách lớp học trong thùng rác (isDeleted = true)
export const ClassTrashList = async (req, res) => {
  try {
    const userId = (req.user?.id || req.user?._id || "").toString();
    const userRole = (req.user?.role || "").toLowerCase();

    // Dùng Service để build query cho Trash (truyền isTrash = true)
    const { finalQuery, skip, limitNum, pageNum, sortOption } = 
      classService.buildClassQueryOptions(req.query, true, userRole, userId);

    const [classList, total] = await Promise.all([
      classModel
        .find(finalQuery)
        .withDeleted()
        .populate("teacherId", "fullName email avatar phone teachingSubjects")
        .populate("assignedBy", "fullName email")
        .populate("courseId", "courseName subject grade status description")
        .populate("students.studentId", "fullName email avatar phone")
        .populate("resources.uploadedBy", "fullName email")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      classModel.countDocuments(finalQuery).withDeleted(),
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
  } catch (error) {
    console.error("[ClassController] ClassTrashList Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Lỗi khi lấy danh sách thùng rác" });
  }
};

//=====================================================================================
// Phục hồi lớp học từ thùng rác (Dành cho Admin)
export const RestoreClass = async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  try {
    const restoredClass = await classModel.restore(id);

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
  } catch (error) {
    console.error("[ClassController] RestoreClass Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Lỗi khi phục hồi lớp học" });
  }
};

//=====================================================================================
// Xóa vĩnh viễn lớp học (Dành cho Admin)
export const PermanentDeleteClass = async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  try {
    const deleted = await classModel
      .findOneAndDelete({ _id: id, isDeleted: true })
      .withDeleted();

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
  } catch (error) {
    console.error("[ClassController] PermanentDeleteClass Error:", error);
    const isValidationError = error.name === "ValidationError";
    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: error.message || "Lỗi khi xóa vĩnh viễn lớp học",
    });
  }
};



//=====================================================================================
// Gỡ Giáo viên khỏi lớp học (Dành cho Admin)
export const UnassignTeacher = async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  try {
    // Validate Class Status before unassigning
    const targetClass = await classModel.findById(id);
    if (!targetClass) {
      return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
    }

    const allowedStatuses = ["Draft", "Ready", "Ongoing"];
    if (!allowedStatuses.includes(targetClass.status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Không thể gỡ phân công giáo viên cho lớp học đang ở trạng thái: ${targetClass.status}` 
      });
    }

    const updatedClass = await classModel.findByIdAndUpdate(
      id,
      {
        $set: {
          teacherId: null,
          assignedBy: null,
          assignedAt: null,
        },
      },
      { new: true }
    )
    .populate("teacherId", "fullName email avatar phone teachingSubjects")
    .populate("assignedBy", "fullName email")
    .populate("courseId", "courseName subject grade status description")
    .populate("students.studentId", "fullName email avatar phone")
    .populate("resources.uploadedBy", "fullName email");

    if (!updatedClass) {
      return res.status(404).json({ success: false, message: "Lớp học không tồn tại" });
    }

    return res.status(200).json({ success: true, message: "Gỡ giáo viên khỏi lớp học thành công", data: updatedClass });
  } catch (error) {
    console.error("[ClassController] UnassignTeacher Error:", error);
    const isValidationError = error.name === "ValidationError";
    return res.status(isValidationError ? 400 : 500).json({ success: false, message: error.message || "Lỗi khi gỡ giáo viên khỏi lớp học" });
  }
};

//=====================================================================================
// Cập nhật trạng thái học sinh trong lớp (Dành cho Admin/Teacher)
export const UpdateStudentStatus = async (req, res) => {
  const { id, studentId } = req.params;
  const { status } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }
  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ success: false, message: "ID học sinh không hợp lệ!" });
  }

  const VALID_STATUSES = ["Enrolled", "Reserved", "Transferred", "Dropped"];
  if (!status || !VALID_STATUSES.includes(status)) {
    return res.status(400).json({ success: false, message: `Trạng thái không hợp lệ. Giá trị cho phép: ${VALID_STATUSES.join(", ")}.` });
  }

  try {
    const updatedClass = await classModel.findOneAndUpdate(
      { _id: id, "students.studentId": studentId },
      { $set: { "students.$.status": status } },
      { new: true, runValidators: true }
    );

    if (!updatedClass) {
      return res.status(404).json({ success: false, message: "Lớp học không tồn tại hoặc học sinh không có trong lớp này" });
    }

    const updatedStudent = updatedClass.students.find((s) => s.studentId && s.studentId.toString() === studentId);
    return res.status(200).json({ success: true, message: `Cập nhật trạng thái học sinh thành "${status}" thành công`, data: updatedStudent });
  } catch (error) {
    console.error("[ClassController] UpdateStudentStatus Error:", error);
    const isValidationError = error.name === "ValidationError";
    return res.status(isValidationError ? 400 : 500).json({ success: false, message: error.message || "Lỗi khi cập nhật trạng thái học sinh" });
  }
};
