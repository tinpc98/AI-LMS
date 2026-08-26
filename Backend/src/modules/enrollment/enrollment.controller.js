import enrollmentService from "./enrollment.service.js";
import { sendSuccess, sendError } from "#shared/utils/response.js";
import { asyncHandler } from "#shared/utils/asyncHandler.js";

/**
 * Student tự đăng ký Course.
 * studentId luôn = authenticated user, KHÔNG lấy từ body.
 */
export const createEnrollment = asyncHandler(async (req, res) => {
  const studentId = req.user.id || req.user._id;
  const { courseId, level } = req.body;

  if (!courseId || !level) {
    return sendError(res, "courseId và level là bắt buộc.", 400);
  }

  const enrollment = await enrollmentService.createEnrollment(studentId, courseId, level);
  return sendSuccess(res, "Đăng ký khóa học thành công.", enrollment, null, 201);
});

/**
 * Admin tạo enrollment cho một Student.
 */
export const createEnrollmentByAdmin = asyncHandler(async (req, res) => {
  const { studentId, courseId } = req.body;

  if (!studentId || !courseId) {
    return sendError(res, "studentId và courseId là bắt buộc.", 400);
  }

  const enrollment = await enrollmentService.createEnrollmentByAdmin(studentId, courseId);
  return sendSuccess(res, "Tạo đăng ký cho học sinh thành công.", enrollment, null, 201);
});

/**
 * Student xem enrollment của chính mình.
 */
export const getMyEnrollments = asyncHandler(async (req, res) => {
  const studentId = req.user.id || req.user._id;
  const { status, page, limit } = req.query;

  const result = await enrollmentService.getMyEnrollments(studentId, {
    status,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
  });

  return sendSuccess(res, "Lấy danh sách đăng ký thành công.", result.items, result.pagination);
});

/**
 * Admin: lấy tất cả enrollment.
 */
export const getAllEnrollments = asyncHandler(async (req, res) => {
  const { studentId, courseId, status, page, limit } = req.query;

  const result = await enrollmentService.getAllEnrollments({
    studentId,
    courseId,
    status,
    page: page ? Number(page) : 1,
    limit: limit ? Number(limit) : 10,
  });

  return sendSuccess(res, "Lấy danh sách enrollment thành công.", result.items, result.pagination);
});

/**
 * Admin: Lấy enrollment đã APPROVED nhưng chưa có Class (admin/pending-class)
 */
export const getAdminPendingClass = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  // We find APPROVED enrollments. But how to know if they have an active class?
  // We can query enrollments and then cross-check, or use aggregate.
  // Wait, if an enrollment has a class, does it stay APPROVED?
  // The spec says status transitions: PAYMENT_PENDING_CONFIRMATION -> APPROVED -> COMPLETED
  // And "Không cho Student tự thay status".
  // When assigned class, it creates ClassEnrollment ACTIVE, but CourseEnrollment stays APPROVED.

  // So we just return APPROVED enrollments that do NOT have an ACTIVE ClassEnrollment.
  const ClassEnrollmentModel = (await import("#modules/classEnrollment/classEnrollment.model.js"))
    .default;

  const skip = (page ? Number(page) - 1 : 0) * (limit ? Number(limit) : 10);
  const maxLimit = limit ? Number(limit) : 10;

  // Find enrollments with status APPROVED
  const query = { status: "APPROVED" };
  const enrollments = await enrollmentService.getAllEnrollments({
    status: "APPROVED",
    page: 1,
    limit: 1000, // Get all approved first to filter (simple approach for MVP)
  });

  const approvedItems = enrollments.items;
  const pendingItems = [];

  if (approvedItems.length > 0) {
    const enrollmentIds = approvedItems.map((item) => item._id);

    // Tìm tất cả ClassEnrollment ACTIVE thuộc danh sách enrollmentIds
    const activeEnrollments = await ClassEnrollmentModel.find({
      enrollmentId: { $in: enrollmentIds },
      status: "ACTIVE",
    })
      .select("enrollmentId")
      .lean();

    const activeEnrollmentIds = new Set(activeEnrollments.map((item) => String(item.enrollmentId)));

    // Lọc lại các approvedItems chưa có trong Set activeEnrollmentIds
    for (const enr of approvedItems) {
      if (!activeEnrollmentIds.has(String(enr._id))) {
        pendingItems.push(enr);
      }
    }
  }

  const paginatedItems = pendingItems.slice(skip, skip + maxLimit);

  return sendSuccess(res, "Lấy danh sách chờ xếp lớp thành công.", paginatedItems, {
    total: pendingItems.length,
    page: page ? Number(page) : 1,
    limit: maxLimit,
    totalPages: Math.ceil(pendingItems.length / maxLimit) || 1,
  });
});

/**
 * Lấy enrollment theo ID.
 * Student chỉ được xem enrollment của chính mình.
 */
export const getEnrollmentById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const enrollment = await enrollmentService.getEnrollmentById(id);

  // RBAC: Student chỉ xem enrollment của chính mình
  const userRole = (req.user.role || "").toLowerCase();
  if (userRole === "student") {
    const userId = (req.user.id || req.user._id).toString();
    const enrollmentStudentId = enrollment.studentId._id
      ? enrollment.studentId._id.toString()
      : enrollment.studentId.toString();

    if (userId !== enrollmentStudentId) {
      return sendError(res, "Bạn không có quyền xem enrollment này.", 403);
    }
  }

  return sendSuccess(res, "Lấy chi tiết enrollment thành công.", enrollment);
});

// ── Status Transition Handlers ───────────────────────────────────────────────

/**
 * Admin: Approve enrollment (duyệt thủ công, dự phòng cho POST /payments/:id/confirm).
 */
export const approveEnrollment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const enrollment = await enrollmentService.transitionStatus(id, "APPROVED");
  return sendSuccess(res, "Đã duyệt enrollment.", enrollment);
});

/**
 * Admin: Assign Class
 */
export const assignClass = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { classId } = req.body;
  const adminId = req.user.id || req.user._id;

  if (!classId) {
    return sendError(res, "classId là bắt buộc.", 400);
  }

  const ce = await enrollmentService.assignClass(id, classId, adminId);
  return sendSuccess(res, "Đã xếp lớp cho enrollment.", ce);
});

/**
 * Admin: Mark COMPLETED.
 */
export const completeEnrollment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const enrollment = await enrollmentService.transitionStatus(id, "COMPLETED");
  return sendSuccess(res, "Enrollment đã hoàn thành.", enrollment);
});

/**
 * Cancel enrollment.
 * Admin: có thể cancel PENDING_PAYMENT / PAYMENT_PENDING_CONFIRMATION / APPROVED.
 * Student: chỉ có thể cancel PENDING_PAYMENT của chính mình.
 */
export const cancelEnrollment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userRole = (req.user.role || "").toLowerCase();

  if (userRole === "student") {
    // Student chỉ được cancel enrollment của chính mình ở trạng thái PENDING_PAYMENT
    const enrollment = await enrollmentService.getEnrollmentById(id);
    const userId = (req.user.id || req.user._id).toString();
    const enrollmentStudentId = enrollment.studentId._id
      ? enrollment.studentId._id.toString()
      : enrollment.studentId.toString();

    if (userId !== enrollmentStudentId) {
      return sendError(res, "Bạn không có quyền hủy enrollment này.", 403);
    }
    if (enrollment.status !== "PENDING_PAYMENT") {
      return sendError(res, "Học sinh chỉ được hủy enrollment ở trạng thái PENDING_PAYMENT.", 422);
    }
  }

  const enrollment = await enrollmentService.transitionStatus(id, "CANCELLED");
  return sendSuccess(res, "Đã hủy enrollment.", enrollment);
});
