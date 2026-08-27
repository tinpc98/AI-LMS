import { asyncHandler } from "#shared/utils/asyncHandler.js";
import paymentService from "./payment.service.js";
import Payment from "./payment.model.js";
import { sendSuccess, sendError } from "#shared/utils/response.js";
import { BusinessRuleError } from "#shared/utils/appError.js";

// ── Payment Config ─────────────────────────────────────────────────────────────
export const GetPaymentConfig = asyncHandler(async (req, res) => {
  const config = await paymentService.getPaymentConfig();
  return res.status(200).json({ success: true, data: config });
});

export const UpdatePaymentConfig = asyncHandler(async (req, res) => {
  const config = await paymentService.updatePaymentConfig(req.body);
  return res
    .status(200)
    .json({ success: true, message: "Cập nhật cấu hình thành công", data: config });
});

// ── Payment Management ────────────────────────────────────────────────────────
export const CreatePayment = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.body;
  const studentId = req.user.id || req.user._id;

  if (!enrollmentId)
    return res.status(400).json({ success: false, message: "Thiếu enrollmentId." });

  const payment = await paymentService.createPayment(enrollmentId, studentId);
  return res
    .status(201)
    .json({ success: true, message: "Tạo thông tin thanh toán thành công", data: payment });
});

export const AdminCreatePayment = asyncHandler(async (req, res) => {
  const { enrollmentId } = req.body;
  if (!enrollmentId)
    return res.status(400).json({ success: false, message: "Thiếu enrollmentId." });

  // Admin tạo hộ, truyền studentId = null để bỏ qua check ownership
  const payment = await paymentService.createPayment(enrollmentId, null);
  return res
    .status(201)
    .json({ success: true, message: "Tạo thanh toán thành công", data: payment });
});

export const getMyPayments = asyncHandler(async (req, res) => {
  const studentId = req.user.id || req.user._id;
  // Don't expose confirmedBy private information, rejectionReason can be exposed
  const payments = await Payment.find({ studentId })
    .select("-confirmedBy")
    .populate("courseId", "name code level")
    .sort({ createdAt: -1 });
  return sendSuccess(res, "Lấy danh sách thanh toán thành công", payments);
});

export const getPendingPaymentsAdmin = asyncHandler(async (req, res) => {
  const { studentId, courseId, date, page = 1, limit = 20 } = req.query;
  const query = { status: "PENDING" };

  if (studentId) query.studentId = studentId;
  if (courseId) query.courseId = courseId;

  if (date) {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);
    query.createdAt = { $gte: startDate, $lt: endDate };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [items, total] = await Promise.all([
    Payment.find(query)
      .populate("studentId", "fullName email phone")
      .populate("courseId", "name code level")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Payment.countDocuments(query),
  ]);

  return sendSuccess(res, "Lấy danh sách thanh toán thành công", items, {
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(total / Number(limit)) || 1,
  });
});

export const GetPaymentDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;
  const isAdmin = (req.user.role || "").toLowerCase() === "admin";

  const payment = await Payment.findById(id)
    .populate("studentId", "fullName email")
    .populate("courseId", "name code")
    .populate("enrollmentId", "status");

  if (!payment)
    return res.status(404).json({ success: false, message: "Không tìm thấy thanh toán." });

  if (!isAdmin && payment.studentId._id.toString() !== userId.toString()) {
    return res
      .status(403)
      .json({ success: false, message: "Bạn không có quyền xem thông tin này." });
  }

  return res.status(200).json({ success: true, data: payment });
});

export const submitPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const studentId = req.user.id || req.user._id;
  const result = await paymentService.submitPayment(id, studentId);
  return sendSuccess(res, "Báo cáo thanh toán thành công", result);
});

export const confirmPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id || req.user._id;
  const result = await paymentService.confirmPayment(id, adminId);
  return sendSuccess(res, "Xác nhận thanh toán thành công", result);
});

export const rejectPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id || req.user._id;
  const result = await paymentService.rejectPayment(id, reason, adminId);
  return sendSuccess(res, "Từ chối thanh toán thành công", result);
});

export const CancelPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id || req.user._id;
  const isAdmin = (req.user.role || "").toLowerCase() === "admin";

  const payment = await paymentService.cancelPayment(id, userId, isAdmin);
  return res
    .status(200)
    .json({ success: true, message: "Hủy thanh toán thành công", data: payment });
});

export const RefundPayment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const adminId = req.user.id || req.user._id;
  const payment = await paymentService.refundPayment(id, adminId, reason);
  return res.status(200).json({ success: true, message: "Hoàn tiền thành công", data: payment });
});
