import crypto from "crypto";
import classModel from "../models/class.model.js";
import Course from "../models/course.model.js";
import User from "../models/user.models.js";

// Lấy danh sách lớp học (Hỗ trợ phân trang, tìm kiếm và lọc theo vai trò)
export const ClassList = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { search, courseId, status, page = 1, limit = 10 } = req.query;

    let query = {};

    if (userRole === "Teacher") {
      query.teacherId = userId;
    } else if (userRole === "Student") {
      query.$or = [{ students: userId }, { "students.studentId": userId }];
    }

    if (search) {
      query.$or = [
        { className: { $regex: search, $options: "i" } },
        { classCode: { $regex: search, $options: "i" } },
      ];
    }

    if (courseId) query.courseId = courseId;
    if (status) query.status = status;

    const skip = (Number(page) - 1) * Number(limit);

    const [classList, total] = await Promise.all([
      classModel
        .find(query)
        .populate("teacherId", "fullName email avatar")
        .populate("courseId", "courseName subject grade status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      classModel.countDocuments(query),
    ]);

    return res.status(200).json({
      message: "Lấy danh sách lớp học thành công",
      data: classList,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error("[Class] danh sách lỗi:", error);
    return res.status(500).json({ message: "Lỗi khi tải dữ liệu" });
  }
};

//=====================================================================================

export const ClassListById = async (req, res) => {
  const { id } = req.params;
  try {
    const classDetail = await classModel
      .findById(id)
      .populate("teacherId", "fullName email phone avatar")
      .populate("assignedBy", "fullName email")
      .populate("students.studentId", "fullName email phone avatar")
      .populate("resources.uploadedBy", "fullName email")
      .populate("courseId", "courseName subject grade status description");
    if (!classDetail) {
      return res.status(404).json({ message: "Lớp học không tồn tại" });
    }
    return res.status(200).json({ message: "Lấy chi tiết lớp học thành công", data: classDetail });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi khi tải dữ liệu" });
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

    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
      return res.status(404).json({ message: "Khóa học không tồn tại" });
    }

    const meetingRoomId = `room_${crypto.randomBytes(4).toString("hex")}`;

    const newClassData = {
      className: className.trim(),
      classCode: classCode?.trim() || `CLS-${Date.now().toString().slice(-6)}`,
      courseId,
      teacherId: teacherId || null,
      assignedBy: req.user.id,
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
    return res.status(200).json({ message: "Tạo lớp học thành công", data: savedClass });
  } catch (error) {
    console.error("[Class] Create Error:", error);
    return res.status(500).json({ message: "Lỗi khi tạo lớp học" });
  }
};

//=====================================================================================
// Cập nhật lớp học (Dành cho Admin)
export const UpdateClass = async (req, res) => {
  const { id } = req.params;
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
    return res.status(500).json({ message: "Lỗi khi cập nhật lớp học" });
  }
};

//=====================================================================================
// Phân công Giáo viên cho lớp học (Dành cho Admin)
export const AssignTeacher = async (req, res) => {
  const { id } = req.params;
  const { teacherId } = req.body;

  try {
    if (!teacherId) {
      return res.status(400).json({ message: "ID giáo viên là bắt buộc" });
    }

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== "Teacher") {
      return res.status(400).json({ message: "Giáo viên không hợp lệ" });
    }

    const updatedClass = await classModel.findByIdAndUpdate(
      id,
      {
        teacherId,
        assignedBy: req.user.id,
        assignedAt: new Date(),
      },
      { new: true }
    ).populate("teacherId", "fullName email");

    if (!updatedClass) {
      return res.status(404).json({ message: "Lớp học không tồn tại" });
    }

    return res.status(200).json({ message: "Phân công giáo viên thành công", data: updatedClass });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi khi phân công giáo viên" });
  }
};

//=====================================================================================
// Thêm học sinh vào lớp (Dành cho Admin)
export const AssignStudent = async (req, res) => {
  const { id } = req.params;
  const { studentId, notes } = req.body;

  try {
    if (!studentId) {
      return res.status(400).json({ message: "ID học sinh là bắt buộc" });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== "Student") {
      return res.status(400).json({ message: "Học sinh không hợp lệ" });
    }

    const targetClass = await classModel.findById(id);
    if (!targetClass) {
      return res.status(404).json({ message: "Lớp học không tồn tại" });
    }

    // Kiểm tra học sinh đã có trong lớp chưa
    const exists = targetClass.students.some(
      (s) => s.studentId && s.studentId.toString() === studentId
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
    return res.status(500).json({ message: "Lỗi khi thêm học sinh vào lớp" });
  }
};

//=====================================================================================
// Xóa / Gỡ học sinh khỏi lớp (Dành cho Admin)
export const RemoveStudent = async (req, res) => {
  const { id, studentId } = req.params;

  try {
    const targetClass = await classModel.findById(id);
    if (!targetClass) {
      return res.status(404).json({ message: "Lớp học không tồn tại" });
    }

    targetClass.students = targetClass.students.filter(
      (s) => s.studentId && s.studentId.toString() !== studentId
    );

    await targetClass.save();

    return res.status(200).json({ message: "Xóa học sinh khỏi lớp thành công", data: targetClass });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi khi xóa học sinh khỏi lớp" });
  }
};

//=====================================================================================
// Thêm tài nguyên bài học (Dành cho Teacher/Admin)
export const AddResource = async (req, res) => {
  const { id } = req.params;
  const { title, description, type, url } = req.body;

  try {
    if (!title || !url) {
      return res.status(400).json({ message: "Tiêu đề và URL tài nguyên là bắt buộc" });
    }

    const targetClass = await classModel.findById(id);
    if (!targetClass) {
      return res.status(404).json({ message: "Lớp học không tồn tại" });
    }

    targetClass.resources.push({
      title,
      description: description || "",
      type: type || "Document",
      url,
      uploadedBy: req.user.id,
      uploadedAt: new Date(),
    });

    await targetClass.save();

    return res.status(200).json({ message: "Thêm tài nguyên thành công", data: targetClass });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi khi thêm tài nguyên bài học" });
  }
};

//=====================================================================================
// Xóa tài nguyên bài học (Dành cho Teacher/Admin)
export const RemoveResource = async (req, res) => {
  const { id, resourceId } = req.params;

  try {
    const targetClass = await classModel.findById(id);
    if (!targetClass) {
      return res.status(404).json({ message: "Lớp học không tồn tại" });
    }

    targetClass.resources = targetClass.resources.filter(
      (r) => r._id && r._id.toString() !== resourceId
    );

    await targetClass.save();

    return res.status(200).json({ message: "Xóa tài nguyên thành công", data: targetClass });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi khi xóa tài nguyên" });
  }
};

//=====================================================================================
// Xóa lớp học (Dành cho Admin)
export const DeleteClass = async (req, res) => {
  const { id } = req.params;
  try {
    const deleteClass = await classModel.findByIdAndDelete(id);

    if (!deleteClass) {
      return res.status(404).json({
        message: "Lớp học không tồn tại",
      });
    }
    return res.status(200).json({ message: "Xóa lớp học thành công", data: deleteClass });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi khi xóa lớp học" });
  }
};
