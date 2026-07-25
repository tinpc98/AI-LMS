import crypto from "crypto";
import classModel from "../models/class.model.js";
import Course from "../models/course.model.js";

export const ClassList = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = {};

    if (userRole === "Teacher") {
      query = { teacherId: userId };
    } else if (userRole === "Student") {
      query = { students: userId };
    }

    const classList = await classModel
      .find(query)
      .populate("teacherId", "fullName email")
      .populate("courseId", "courseName subject grade status")
      .sort({ createdAt: -1 });
    return res.status(200).json({ message: "Lấy danh sách lớp học thành công", data: classList });
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
      .populate("teacherId", "fullName email")
      .populate("students", "fullName email")
      .populate("courseId", "courseName subject grade status");
    if (!classDetail) {
      return res.status(404).json({ message: "Lớp học không tồn tại" });
    }
    return res.status(200).json({ message: "Lấy danh sách lớp học thành công", data: classDetail });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi khi tải dữ liệu" });
  }
};

//=====================================================================================
//Tạo lớp học mới (Tự động tạo meetingRoomId và phân quyền giáo viên)
export const AddNewClass = async (req, res) => {
  try {
    const {
      className,
      courseId,
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
      teacherId: req.user.id,
      meetingRoomId,
      classRoom: classRoom ?? room ?? "",
      learningMode: learningMode || "Offline",
      schedule: schedule || { days: [], startTime: "", endTime: "" },
      startDate: startDate || null,
      endDate: endDate || null,
      maxStudents: maxStudents || 30,
      currentStudents: 0,
      students: [],
      description: description || "",
      note: note || "",
      isEnrollmentOpen: typeof isEnrollmentOpen === "boolean" ? isEnrollmentOpen : true,
      status: status || "Upcoming",
    };

    const savedClass = await new classModel(newClassData).save();
    return res.status(200).json({ message: "Tạo lớp học thành công", data: savedClass });
  } catch (error) {
    console.error("[Class] Create Error:", error);
    return res.status(500).json({ message: "Lỗi khi tải dữ liệu" });
  }
};

//=====================================================================================
//Cập nhật lớp học (Khóa quyền sở hữu)
export const UpdateClass = async (req, res) => {
  const { id } = req.params;
  try {
    const {
      className,
      courseId,
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
    } = req.body;

    const updateData = {
      className,
      courseId,
      classCode,
      classRoom: classRoom ?? room,
      learningMode,
      schedule,
      startDate,
      endDate,
      maxStudents,
      description,
      note,
      isEnrollmentOpen,
      status,
    };

    const query = { _id: id, teacherId: req.user.id };
    if (req.user.role === "Admin") delete query.teacherId;

    const updatedClass = await classModel.findOneAndUpdate(query, updateData, {
      returnDocument: "after",
    });

    if (!updatedClass) {
      return res.status(404).json({
        message: "Lớp học không tồn tại hoặc bạn không có quyền truy cập",
      });
    }

    return res.status(200).json({ message: "Cập nhật lớp học thành công", data: updatedClass });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi khi tải dữ liệu" });
  }
};

//=====================================================================================
//Xóa lớp học (Khóa quyền sở hữu)
export const DeleteClass = async (req, res) => {
  const { id } = req.params;
  try {
    const query = { _id: id, teacherId: req.user.id };

    if (req.user.role === "Admin") delete query.teacherId;

    const deleteClass = await classModel.findOneAndDelete(query);

    if (!deleteClass) {
      return res.status(404).json({
        message: "Lớp học không tồn tại hoặc bạn không có quyền truy cập",
      });
    }
    return res.status(200).json({ message: "Xóa lớp học thành công", data: deleteClass });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi khi tải dữ liệu" });
  }
};

//=====================================================================================
// Chức năng Join Class đã bị vô hiệu hóa vì học sinh được quản lý tự động theo lớp.
export const JoinClass = async (req, res) => {
  return res.status(400).json({
    message: "Tính năng tham gia lớp bằng mã đã bị vô hiệu hóa. Học sinh được phân lớp bởi Admin và tự động truy cập lớp khi có buổi trực tuyến.",
  });
};
