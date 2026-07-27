import crypto from "crypto";
import mongoose from "mongoose";
import classModel from "../models/class.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.models.js";

// Lấy danh sách lớp học (Hỗ trợ phân trang, tìm kiếm và lọc theo vai trò)
export const ClassList = async (req, res) => {
  try {
    const userId = (req.user?.id || req.user?._id || "").toString();
    const userRole = (req.user?.role || "").toLowerCase();
    const { search, courseId, status, page = 1, limit = 10, sort } = req.query;

    const filterConditions = [];

    // 1. Phân quyền dữ liệu theo vai trò (Role-based data scoping)
    if (userRole === "teacher") {
      filterConditions.push({ teacherId: userId });
    } else if (userRole === "student") {
      filterConditions.push({ "students.studentId": userId });
    }
    // Vai trò 'admin' sẽ xem được toàn bộ danh sách lớp học

    // 2. Tìm kiếm theo Tên lớp hoặc Mã lớp
    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      filterConditions.push({
        $or: [
          { className: searchRegex },
          { classCode: searchRegex },
        ],
      });
    }

    // 3. Lọc theo Khóa học liên kết
    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      filterConditions.push({ courseId });
    }

    // 4. Lọc theo Trạng thái lớp học
    if (status && status !== "ALL") {
      filterConditions.push({ status });
    }

    // Tổng hợp điều kiện truy vấn Mongoose
    const finalQuery =
      filterConditions.length > 0
        ? filterConditions.length === 1
          ? filterConditions[0]
          : { $and: filterConditions }
        : {};

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    // Thực thi song song lấy dữ liệu & đếm tổng số bản ghi
    const [classList, total] = await Promise.all([
      classModel
        .find(finalQuery)
        .populate("teacherId", "fullName email avatar phone teachingSubjects")
        .populate("assignedBy", "fullName email")
        .populate("courseId", "courseName subject grade status description")
        .populate("students.studentId", "fullName email avatar phone")
        .populate("resources.uploadedBy", "fullName email")
        .sort(sort ? sort.split(',').join(' ') : { createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      classModel.countDocuments(finalQuery),
    ]);

    return res.status(200).json({
      message: "Lấy danh sách lớp học thành công",
      data: classList,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("[ClassController] ClassList Error:", error);
    return res.status(500).json({
      message: error.message || "Lỗi nội bộ trên Server khi lấy danh sách lớp học",
    });
  }
};

//=====================================================================================

// Lấy chi tiết 1 lớp học theo ID
export const ClassListById = async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID lớp học không hợp lệ!" });
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
      return res.status(404).json({ message: "Lớp học không tồn tại" });
    }

    return res.status(200).json({
      message: "Lấy chi tiết lớp học thành công",
      data: classDetail,
    });
  } catch (error) {
    console.error("[ClassController] ClassListById Error:", error);
    return res.status(500).json({
      message: error.message || "Lỗi khi tải chi tiết lớp học",
    });
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
      return res.status(400).json({ message: "Vui lòng nhập tên lớp và khóa học" });
    }

    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      return res.status(400).json({ message: "ID khóa học không hợp lệ!" });
    }

    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
      return res.status(404).json({ message: "Khóa học không tồn tại" });
    }

    if (teacherId && !mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ message: "ID giáo viên không hợp lệ!" });
    }

    const meetingRoomId = `room_${crypto.randomBytes(4).toString("hex")}`;

    const newClassData = {
      className: className.trim(),
      classCode: classCode?.trim() || `CLS-${Date.now().toString().slice(-6)}`,
      courseId,
      teacherId: teacherId || null,
      assignedBy: req.user.id || req.user._id,
      assignedAt: teacherId ? new Date() : null,
      meetingRoomId,
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
    return res.status(201).json({ message: "Tạo lớp học thành công", data: savedClass });
  } catch (error) {
    console.error("[ClassController] Create Error:", error);
    return res.status(500).json({ message: error.message || "Lỗi khi tạo lớp học" });
  }
};

//=====================================================================================
// Cập nhật lớp học (Dành cho Admin)
export const UpdateClass = async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID lớp học không hợp lệ!" });
  }

  try {
    const updatedClass = await classModel.findByIdAndUpdate(id, req.body, {
      returnDocument: "after",
      runValidators: true,
    });

    if (!updatedClass) {
      return res.status(404).json({
        message: "Lớp học không tồn tại",
      });
    }

    return res.status(200).json({ message: "Cập nhật lớp học thành công", data: updatedClass });
  } catch (error) {
    console.error("[ClassController] Update Error:", error);
    return res.status(500).json({ message: error.message || "Lỗi khi cập nhật lớp học" });
  }
};

//=====================================================================================
// Phân công Giáo viên cho lớp học (Dành cho Admin)
export const AssignTeacher = async (req, res) => {
  const { id } = req.params;
  const { teacherId } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID lớp học không hợp lệ!" });
  }

  try {
    if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
      return res.status(400).json({ message: "ID giáo viên không hợp lệ" });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role?.toLowerCase() !== "teacher") {
      return res.status(400).json({ message: "Giáo viên không hợp lệ" });
    }

    const updatedClass = await classModel.findByIdAndUpdate(
      id,
      {
        teacherId,
        assignedBy: req.user.id || req.user._id,
        assignedAt: new Date(),
      },
      { new: true }
    ).populate("teacherId", "fullName email avatar phone");

    if (!updatedClass) {
      return res.status(404).json({ message: "Lớp học không tồn tại" });
    }

    return res.status(200).json({ message: "Phân công giáo viên thành công", data: updatedClass });
  } catch (error) {
    console.error("[ClassController] AssignTeacher Error:", error);
    return res.status(500).json({ message: error.message || "Lỗi khi phân công giáo viên" });
  }
};

//=====================================================================================
// Thêm học sinh vào lớp (Dành cho Admin)
export const AssignStudent = async (req, res) => {
  const { id } = req.params;
  const { studentId, notes } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID lớp học không hợp lệ!" });
  }

  try {
    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "ID học sinh không hợp lệ" });
    }

    const student = await User.findById(studentId);
    if (!student || student.role?.toLowerCase() !== "student") {
      return res.status(400).json({ message: "Học sinh không hợp lệ" });
    }

    const targetClass = await classModel.findById(id);
    if (!targetClass) {
      return res.status(404).json({ message: "Lớp học không tồn tại" });
    }

    // Kiểm tra học sinh đã có trong lớp chưa
    const exists = targetClass.students.some(
      (s) => s.studentId && s.studentId.toString() === studentId.toString()
    );

    if (exists) {
      return res.status(400).json({ message: "Học sinh đã có trong lớp học này" });
    }

    targetClass.students.push({
      studentId,
      status: "Enrolled",
      joinedAt: new Date(),
      notes: notes || "",
    });

    await targetClass.save();

    return res.status(200).json({ message: "Thêm học sinh vào lớp thành công", data: targetClass });
  } catch (error) {
    console.error("[ClassController] AssignStudent Error:", error);
    return res.status(500).json({ message: error.message || "Lỗi khi thêm học sinh vào lớp" });
  }
};

//=====================================================================================
// Xóa / Gỡ học sinh khỏi lớp (Dành cho Admin)
export const RemoveStudent = async (req, res) => {
  const { id, studentId } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id) || !studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ message: "ID lớp học hoặc ID học sinh không hợp lệ!" });
  }

  try {
    const targetClass = await classModel.findById(id);
    if (!targetClass) {
      return res.status(404).json({ message: "Lớp học không tồn tại" });
    }

    targetClass.students = targetClass.students.filter(
      (s) => s.studentId && s.studentId.toString() !== studentId.toString()
    );

    await targetClass.save();

    return res.status(200).json({ message: "Xóa học sinh khỏi lớp thành công", data: targetClass });
  } catch (error) {
    console.error("[ClassController] RemoveStudent Error:", error);
    return res.status(500).json({ message: error.message || "Lỗi khi xóa học sinh khỏi lớp" });
  }
};

//=====================================================================================
// Thêm tài nguyên bài học vào lớp học (Dành cho Giáo viên / Admin)
export const AddResource = async (req, res) => {
  const { id } = req.params;
  const { title, description, type, url } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID lớp học không hợp lệ!" });
  }

  try {
    if (!title || !url) {
      return res.status(400).json({ message: "Tiêu đề và URL tài nguyên là bắt buộc" });
    }

    const targetClass = await classModel.findById(id);
    if (!targetClass) {
      return res.status(404).json({ message: "Lớp học không tồn tại" });
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

    return res.status(200).json({ message: "Thêm tài nguyên thành công", data: targetClass });
  } catch (error) {
    console.error("[ClassController] AddResource Error:", error);
    return res.status(400).json({ message: error.message || "Lỗi khi thêm tài nguyên bài học" });
  }
};

//=====================================================================================
// Xóa tài nguyên bài học (Dành cho Teacher/Admin)
export const RemoveResource = async (req, res) => {
  const { id, resourceId } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id) || !resourceId || !mongoose.Types.ObjectId.isValid(resourceId)) {
    return res.status(400).json({ message: "ID lớp học hoặc ID tài nguyên không hợp lệ!" });
  }

  try {
    const targetClass = await classModel.findById(id);
    if (!targetClass) {
      return res.status(404).json({ message: "Lớp học không tồn tại" });
    }

    targetClass.resources = targetClass.resources.filter(
      (r) => r._id && r._id.toString() !== resourceId.toString()
    );

    await targetClass.save();

    return res.status(200).json({ message: "Xóa tài nguyên thành công", data: targetClass });
  } catch (error) {
    console.error("[ClassController] RemoveResource Error:", error);
    return res.status(500).json({ message: error.message || "Lỗi khi xóa tài nguyên" });
  }
};

//=====================================================================================
// Xóa lớp học (Dành cho Admin)
export const DeleteClass = async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: "ID lớp học không hợp lệ!" });
  }

  try {
    const userId = req.user?.id || req.user?._id;
    const deleteClass = await classModel.softDelete(id, userId);

    if (!deleteClass) {
      return res.status(404).json({
        message: "Lớp học không tồn tại",
      });
    }
    return res.status(200).json({ message: "Xóa lớp học thành công", data: deleteClass });
  } catch (error) {
    console.error("[ClassController] DeleteClass Error:", error);
    return res.status(500).json({ message: error.message || "Lỗi khi xóa lớp học" });
  }
};

//=====================================================================================
// Lấy danh sách lớp học trong thùng rác (isDeleted = true)
export const ClassTrashList = async (req, res) => {
  try {
    const userId = (req.user?.id || req.user?._id || "").toString();
    const userRole = (req.user?.role || "").toLowerCase();
    const { search, courseId, status, page = 1, limit = 10, sort } = req.query;

    const filterConditions = [];

    // Phân quyền dữ liệu theo vai trò
    if (userRole === "teacher") {
      filterConditions.push({ teacherId: userId });
    } else if (userRole === "student") {
      filterConditions.push({ "students.studentId": userId });
    }

    if (search && search.trim() !== "") {
      const searchRegex = new RegExp(search.trim(), "i");
      filterConditions.push({
        $or: [{ className: searchRegex }, { classCode: searchRegex }],
      });
    }

    if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
      filterConditions.push({ courseId });
    }

    if (status && status !== "ALL") {
      filterConditions.push({ status });
    }

    // Yêu cầu lấy dữ liệu đã xóa
    filterConditions.push({ isDeleted: true });

    const finalQuery = filterConditions.length > 1 ? { $and: filterConditions } : filterConditions[0];

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.max(1, Number(limit) || 10);
    const skip = (pageNum - 1) * limitNum;

    const [classList, total] = await Promise.all([
      classModel
        .find(finalQuery)
        .withDeleted()
        .populate("teacherId", "fullName email avatar phone teachingSubjects")
        .populate("assignedBy", "fullName email")
        .populate("courseId", "courseName subject grade status description")
        .populate("students.studentId", "fullName email avatar phone")
        .populate("resources.uploadedBy", "fullName email")
        .sort(sort ? sort.split(',').join(' ') : { createdAt: -1 })
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
    return res.status(500).json({
      success: false,
      message: error.message || "Lỗi khi lấy danh sách thùng rác",
    });
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
    // Đảm bảo chỉ được xóa vĩnh viễn record đã soft delete
    const targetClass = await classModel.findOne({ _id: id, isDeleted: true }).withDeleted();
    if (!targetClass) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy lớp học trong thùng rác để xóa vĩnh viễn",
      });
    }

    await classModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Xóa vĩnh viễn lớp học thành công",
    });
  } catch (error) {
    console.error("[ClassController] PermanentDeleteClass Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Lỗi khi xóa vĩnh viễn lớp học" });
  }
};

