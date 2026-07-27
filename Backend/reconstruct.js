import fs from 'fs';

let content = fs.readFileSync('src/controllers/class.controller.js', 'utf-8');

// 1. Add classService import
if (!content.includes('class.service.js')) {
  content = content.replace('import User from "../models/user.models.js";', 'import User from "../models/user.models.js";\nimport classService from "../services/class.service.js";');
}

// 2. Rewrite ClassList
const classListRegex = /export const ClassList = async \(req, res\) => \{[\s\S]*?\n\};/;
const newClassList = `export const ClassList = async (req, res) => {
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

    return res.status(200).json({ success: true, message: "Lấy danh sách lớp học thành công",
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
    return res.status(500).json({ success: false, message: error.message || "Lỗi nội bộ trên Server khi lấy danh sách lớp học" });
  }
};`;
content = content.replace(classListRegex, newClassList);

// 3. Rewrite ClassListById for student check and success: true
const classListByIdRegex = /export const ClassListById = async \(req, res\) => \{[\s\S]*?\n\};/;
const newClassListById = `export const ClassListById = async (req, res) => {
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
};`;
content = content.replace(classListByIdRegex, newClassListById);

// 4. UpdateClass full populate
const updateClassRegex = /export const UpdateClass = async \(req, res\) => \{[\s\S]*?\n\};/;
const newUpdateClass = `export const UpdateClass = async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  try {
    const updateData = req.body;
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
};`;
content = content.replace(updateClassRegex, newUpdateClass);

// 5. AssignTeacher populate teachingSubjects
const assignTeacherRegex = /export const AssignTeacher = async \(req, res\) => \{[\s\S]*?\n\};/;
const newAssignTeacher = `export const AssignTeacher = async (req, res) => {
  const { id } = req.params;
  const { teacherId } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  if (!teacherId || !mongoose.Types.ObjectId.isValid(teacherId)) {
    return res.status(400).json({ success: false, message: "ID giáo viên không hợp lệ" });
  }

  try {
    const teacherExists = await User.findOne({ _id: teacherId, role: "teacher", isDeleted: false });
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
};`;
content = content.replace(assignTeacherRegex, newAssignTeacher);

// 6. AssignStudent full populate
const assignStudentRegex = /export const AssignStudent = async \(req, res\) => \{[\s\S]*?\n\};/;
const newAssignStudent = `export const AssignStudent = async (req, res) => {
  const { id } = req.params;
  const { studentId } = req.body;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Class ID is invalid." });
  }

  if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ success: false, message: "Student ID is invalid." });
  }

  try {
    const studentExists = await User.findOne({ _id: studentId, role: "student", isDeleted: false });
    if (!studentExists) {
      return res.status(400).json({ success: false, message: "Student not found or invalid role." });
    }

    const updatedClass = await classModel.findOneAndUpdate(
      { _id: id, isEnrollmentOpen: true, "students.studentId": { $ne: studentId }, $expr: { $lt: [{ $size: { $ifNull: ["$students", []] } }, "$maxStudents"] } },
      { $push: { students: { studentId, joinedAt: new Date(), status: "Enrolled" } } },
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
};`;
content = content.replace(assignStudentRegex, newAssignStudent);

// 7. RemoveStudent full populate
const removeStudentRegex = /export const RemoveStudent = async \(req, res\) => \{[\s\S]*?\n\};/;
const newRemoveStudent = `export const RemoveStudent = async (req, res) => {
  const { id, studentId } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id) || !studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
    return res.status(400).json({ success: false, message: "ID lớp học hoặc ID học sinh không hợp lệ!" });
  }

  try {
    const updatedClass = await classModel.findByIdAndUpdate(
      id,
      { $pull: { students: { studentId } } },
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

    return res.status(200).json({ success: true, message: "Xóa học sinh khỏi lớp thành công", data: updatedClass });
  } catch (error) {
    console.error("[ClassController] RemoveStudent Error:", error);
    return res.status(500).json({ success: false, message: error.message || "Lỗi khi xóa học sinh khỏi lớp" });
  }
};`;
content = content.replace(removeStudentRegex, newRemoveStudent);


// 8. ClassTrashList using Service
const classTrashListRegex = /export const ClassTrashList = async \(req, res\) => \{[\s\S]*?\n\};/;
const newClassTrashList = `export const ClassTrashList = async (req, res) => {
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
};`;
content = content.replace(classTrashListRegex, newClassTrashList);


// 9. PermanentDeleteClass missing
const permDeleteRegex = /export const PermanentDeleteClass = async \(req, res\) => \{[\s\S]*?\n\};/;
const newPermDelete = `export const PermanentDeleteClass = async (req, res) => {
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

    return res.status(204).send();
  } catch (error) {
    console.error("[ClassController] PermanentDeleteClass Error:", error);
    const isValidationError = error.name === "ValidationError";
    return res.status(isValidationError ? 400 : 500).json({
      success: false,
      message: error.message || "Lỗi khi xóa vĩnh viễn lớp học",
    });
  }
};`;
content = content.replace(permDeleteRegex, newPermDelete);

// 10. Add missing endpoints (UnassignTeacher, UpdateStudentStatus)
if (!content.includes("UnassignTeacher")) {
  const newFuncs = `

//=====================================================================================
// Gỡ Giáo viên khỏi lớp học (Dành cho Admin)
export const UnassignTeacher = async (req, res) => {
  const { id } = req.params;

  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "ID lớp học không hợp lệ!" });
  }

  try {
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
    return res.status(400).json({ success: false, message: \`Trạng thái không hợp lệ. Giá trị cho phép: \${VALID_STATUSES.join(", ")}.\` });
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
    return res.status(200).json({ success: true, message: \`Cập nhật trạng thái học sinh thành "\${status}" thành công\`, data: updatedStudent });
  } catch (error) {
    console.error("[ClassController] UpdateStudentStatus Error:", error);
    const isValidationError = error.name === "ValidationError";
    return res.status(isValidationError ? 400 : 500).json({ success: false, message: error.message || "Lỗi khi cập nhật trạng thái học sinh" });
  }
};
`;
  content += newFuncs;
}

// 11. Run Phase 4 format on AddNewClass, AddResource, RemoveResource, DeleteClass, RestoreClass
content = content.replace(/\.status\((200|201)\)\.json\(\{\s*(?!success\s*:\s*(true|false),?\s*)message\s*:/g, '.status($1).json({ success: true, message:');
content = content.replace(/\.status\(([45]\d\d)\)\.json\(\{\s*(?!success\s*:\s*(true|false),?\s*)message\s*:/g, '.status($1).json({ success: false, message:');
content = content.replace(/\.json\(\{\s*message:/g, '.json({ success: false, message:');

fs.writeFileSync('src/controllers/class.controller.js', content, 'utf-8');
