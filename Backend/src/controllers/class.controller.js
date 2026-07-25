import crypto from "crypto";
import classModel from "../models/class.model.js";
import Course from "../models/course.model.js";

export const ClassList = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let query = {};

    //phân luồng dữ liệu
    if (userRole === "Teacher") {
      query = { teacherId: userId }; // giáo viên chỉ thấy lớp mình tạo
    } else if (userRole === "Student") {
      query = { students: userId }; // học sinh chỉ thấy lớp của mình
    }
    // Nếu là Admin, query rỗng {} sẽ lấy ra toàn bộ lớp học trên hệ thống
    //Dùng populate để lấy thêm tên giáo viên thay vì trả về id
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
//Tạo lớp học mới (Tự động hóa joinCode & teacherId)
export const AddNewClass = async (req, res) => {
  try {
    const { className, courseId, classCode, room, startDate, endDate, schedule, maxStudents, meetingLink, note, status } = req.body;

    if (!className || !courseId) {
      return res.status(400).json({ message: "Vui lòng nhập tên lớp và khóa học" });
    }

    const courseExists = await Course.findById(courseId);
    if (!courseExists) {
      return res.status(404).json({ message: "Khóa học không tồn tại" });
    }

    const joinCode = crypto.randomBytes(3).toString("hex").toUpperCase();

    const newClassData = {
      className,
      classCode: classCode || `CLS-${Date.now().toString().slice(-6)}`,
      courseId,
      teacherId: req.user.id,
      joinCode,
      room: room || "",
      startDate: startDate || null,
      endDate: endDate || null,
      schedule: schedule || { days: [], startTime: "", endTime: "" },
      maxStudents: maxStudents || 30,
      currentStudents: 0,
      students: [],
      meetingLink: meetingLink || "",
      note: note || "",
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
    const { className, courseId, classCode, room, startDate, endDate, schedule, maxStudents, meetingLink, note, status } = req.body;

    const updateData = {
      className,
      courseId,
      classCode,
      room,
      startDate,
      endDate,
      schedule,
      maxStudents,
      meetingLink,
      note,
      status,
    };

    // Điều kiện cập nhật: Phải đúng ID lớp VÀ người cập nhật phải là Giáo viên tạo ra lớp đó
    const query = { _id: id, teacherId: req.user.id };

    //Nếu là Admin thì có quyền sửa mọi lớp
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
//Học sinh tham gia lớp học bằng mã (Join Code)
export const JoinClass = async (req, res) => {
  try {
    const { joinCode } = req.body;
    const userId = req.user.id;

    // kiểm tra đầu vào
    if (!joinCode) {
      return res.status(400).json({ message: "Vui lòng nhập mã lớp học" });
    }
    // chuẩn hóa mã(xóa khoảng trắng thừa và viết hoa để khớp với DB)
    const normalizedCode = joinCode.trim().toUpperCase();

    // Kiểm tra xem lớp học có tồn tại với mã này không
    const targetClass = await classModel.findOne({ joinCode: normalizedCode });
    if (!targetClass) {
      return res.status(404).json({ message: "Mã lớp học không chính xác, vui lòng kiểm tra lại" });
    }

    //Chặn giáo viên tự join vào code của chính mình
    if (targetClass.teacherId.toString() === userId) {
      return res.status(400).json({ message: "Bạn đang là giáo viên quản lý của lớp học này." });
    }

    // chặn học sinh đã tham gia rồi nhưng lại tham gia lại
    if (targetClass.students.includes(userId)) {
      return res.status(400).json({ message: "Bạn đã tham gia lớp học này từ trước." });
    }

    //Thêm học sinh vào Lớp
    const updatedClass = await classModel
      .findByIdAndUpdate(targetClass._id, { $addToSet: { students: userId } }, { returnDocument: "after" })
      .populate("teacherId", "fullName email");
    return res.status(200).json({ message: "Tham gia lớp học thành công", data: updatedClass });
  } catch (error) {
    console.error("[Class] Join Error:", error);
    return res.status(500).json({ message: "Lỗi hệ thống khi xử lý tham gia lớp học" });
  }
};
