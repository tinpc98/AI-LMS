// Controller bài tập (§7 — áp asyncHandler cho controller cuối còn dùng try/catch thủ công).
//
// TRƯỚC: 11 phương thức, mỗi cái một khối try/catch giống hệt nhau:
//
//     catch (error) {
//       return res.status(error.status || 500)
//         .json({ message: error.message || "Lỗi server khi ..." });
//     }
//
// ~90 dòng lặp lại, và quan trọng hơn là nó BỎ QUA tầng quy đổi lỗi Mongoose ở errorHandler:
// dữ liệu gửi lên sai schema (ValidationError) hay ObjectId hỏng (CastError) đều rơi vào
// `|| 500`, tức là báo "lỗi máy chủ" cho một lỗi hoàn toàn do phía client.
//
// SAU: asyncHandler chuyển mọi lỗi sang errorHandler tập trung. Ba thay đổi hành vi, đều theo
// hướng tốt hơn và đều có test chốt:
//
//   1. ValidationError -> 400 VALIDATION_ERROR, CastError -> 400 INVALID_ID,
//      trùng unique key -> 409 DUPLICATE_KEY. Trước đây tất cả là 500.
//   2. Thân phản hồi lỗi thêm `success`, `code`, `requestId` (trước chỉ có `message`).
//      Chỉ THÊM trường, không bỏ trường nào — client cũ đọc `message` vẫn chạy.
//   3. Ở production, lỗi 500 KHÔNG lường trước không còn lộ error.message ra ngoài. Trước
//      đây message nội bộ (đường dẫn file, tên thư viện) đi thẳng tới client.
//
// Điều KHÔNG đổi: lỗi do service cố ý ném kèm .status vẫn giữ nguyên mã đó — đó là phần lớn
// các nhánh 400/403/404 của module này.
import * as assignmentService from "./assignment.service.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

const assignmentController = {
  // ==========================================
  // NHÁNH 1: DÀNH CHO GIÁO VIÊN
  // ==========================================

  // 1. Tạo bài tập mới
  createAssignment: asyncHandler(async (req, res) => {
    const { title, description, deadline, classId, lessonId, isAIGenerated, aiPromptUsed } =
      req.body;
    const teacherId = req.user.id || req.user._id;

    const newAssignment = await assignmentService.createAssignmentService({
      title,
      description,
      deadline,
      classId,
      lessonId,
      isAIGenerated,
      aiPromptUsed,
      files: req.files,
      teacherId,
      teacherRole: req.user?.role,
    });

    return res.status(201).json({
      message: "Tạo bài tập thành công",
      assignment: newAssignment,
      data: newAssignment,
    });
  }),

  // 2. Giáo viên chấm điểm và nhận xét
  gradeSubmission: asyncHandler(async (req, res) => {
    const { submissionId } = req.params;
    const { grade, feedback, aiFeedback } = req.body;
    const userId = req.user.id || req.user._id;

    const submission = await assignmentService.gradeSubmissionService({
      submissionId,
      grade,
      feedback,
      aiFeedback,
      userId,
      userRole: req.user?.role,
    });

    return res.status(200).json({ message: "Chấm điểm thành công", submission, data: submission });
  }),

  // 3. Cập nhật bài tập
  updateAssignment: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description, deadline, lessonId } = req.body;
    const userId = req.user.id || req.user._id;

    const assignment = await assignmentService.updateAssignmentService({
      id,
      title,
      description,
      deadline,
      lessonId,
      files: req.files,
      userId,
      userRole: req.user?.role,
    });

    return res
      .status(200)
      .json({ message: "Cập nhật bài tập thành công", assignment, data: assignment });
  }),

  // 4. Xóa bài tập
  deleteAssignment: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id || req.user._id;

    await assignmentService.deleteAssignmentService({ id, userId, userRole: req.user?.role });
    return res.status(200).json({ message: "Xóa bài tập thành công" });
  }),

  // ==========================================
  // NHÁNH 2: DÀNH CHO HỌC SINH & CHUNG
  // ==========================================

  // 5. Lấy chi tiết 1 bài tập
  getAssignmentById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const assignment = await assignmentService.getAssignmentByIdService(id);
    return res.status(200).json({ assignment, data: assignment });
  }),

  // 6. Lấy danh sách bài tập của lớp
  getAssignmentsByClass: asyncHandler(async (req, res) => {
    const { classId } = req.params;
    const { page, limit } = req.query;

    const { assignments, pagination } = await assignmentService.getAssignmentsByClassService({
      classId,
      page,
      limit,
    });

    const responseBody = { assignments, data: assignments }; // Backward compatible
    if (pagination) responseBody.pagination = pagination;
    return res.status(200).json(responseBody);
  }),

  // 7. Lấy danh sách bài nộp của một assignment (Chỉ Giáo viên phân công / Admin)
  getSubmissionsByAssignment: asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const { page, limit } = req.query;
    const userId = req.user.id || req.user._id;

    const { submissions, pagination } = await assignmentService.getSubmissionsByAssignmentService({
      assignmentId,
      page,
      limit,
      userId,
      userRole: req.user?.role,
    });

    const responseBody = { submissions, data: submissions };
    if (pagination) responseBody.pagination = pagination;
    return res.status(200).json(responseBody);
  }),

  // 8. Lấy chi tiết 1 bài nộp (Đã được xác thực quyền qua canViewSubmission middleware)
  //
  // Bản cũ bọc đoạn này trong try/catch, nhưng thân hàm chỉ đọc req.submission — không có gì
  // để ném. Khối đó là nhiễu thuần tuý, bỏ luôn cùng lúc áp asyncHandler.
  getSubmissionById: asyncHandler(async (req, res) => {
    // req.submission đã được gán bởi middleware canViewSubmission
    return res
      .status(200)
      .json({ success: true, submission: req.submission, data: req.submission });
  }),

  // 9. Lấy bài nộp cá nhân của Học sinh
  getMySubmission: asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;

    // 401 này là PHẢN HỒI có chủ đích, không phải nhánh lỗi — giữ nguyên tại chỗ thay vì ném
    // lên errorHandler, để thân phản hồi không đổi so với trước.
    if (!req.user || (!req.user.id && !req.user._id)) {
      return res.status(401).json({ message: "UNAUTHENTICATED" });
    }
    const studentId = req.user.id || req.user._id;

    const submission = await assignmentService.getMySubmissionService({
      assignmentId,
      studentId,
    });
    return res.status(200).json({ success: true, submission, data: submission });
  }),

  // 10. Học sinh Nộp bài / Nộp lại bài
  submitAssignment: asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const { content } = req.body;
    const studentId = req.user.id || req.user._id;

    const { submission, isNew } = await assignmentService.submitAssignmentService({
      assignmentId,
      content,
      files: req.files,
      studentId,
    });

    return res.status(isNew ? 201 : 200).json({
      message: isNew ? "Nộp bài tập thành công" : "Nộp lại bài tập thành công",
      submission,
      data: submission,
    });
  }),

  // 11. Học sinh Hủy nộp bài
  cancelSubmission: asyncHandler(async (req, res) => {
    const { assignmentId } = req.params;
    const studentId = req.user.id || req.user._id;

    const submission = await assignmentService.cancelSubmissionService({
      assignmentId,
      studentId,
    });

    return res.status(200).json({
      success: true,
      message: "Đã hủy bài nộp thành công",
      submission,
      data: submission,
    });
  }),
};

export default assignmentController;
