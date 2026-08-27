// File: src/modules/auth/verification.controller.js
// Endpoint HTTP cho EduSpace mechanism design Phần C.1/C.2 (xác minh 3 tầng, bảo lãnh chéo).
import { asyncHandler } from "#shared/utils/asyncHandler.js";
import { ValidationError } from "#shared/utils/appError.js";
import {
  checkL3Eligibility,
  tryPromoteToL3,
  voucherForTeacher,
  suspendVouchersOf,
  getOwnVerificationStatus,
  getCoTaughtColleagues,
} from "./verification.service.js";

export const getMyVerificationStatus = asyncHandler(async (req, res) => {
  const teacherId = req.user.id || req.user._id;
  const result = await getOwnVerificationStatus(teacherId);
  return res.status(200).json({ success: true, message: "OK", data: result });
});

export const getMyCoTaughtColleagues = asyncHandler(async (req, res) => {
  const teacherId = req.user.id || req.user._id;
  const result = await getCoTaughtColleagues(teacherId);
  return res.status(200).json({ success: true, message: "OK", data: result });
});

export const getL3Eligibility = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await checkL3Eligibility(id);
  return res.status(200).json({ success: true, message: "OK", data: result });
});

export const promoteToL3 = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await tryPromoteToL3(id);
  return res.status(200).json({
    success: true,
    message: result.promoted ? "Đã nâng tầng lên L3." : "Chưa đủ điều kiện lên L3.",
    data: result,
  });
});

// Người bảo lãnh LUÔN là chính người đăng nhập (req.user) — không cho truyền voucherId tuỳ ý
// trong body, tránh giáo viên A giả danh giáo viên L3 khác để bảo lãnh hộ.
export const vouchForTeacher = asyncHandler(async (req, res) => {
  const voucherId = req.user.id || req.user._id;
  const { voucheeId } = req.body;

  if (!voucheeId) {
    throw new ValidationError("voucheeId là bắt buộc.");
  }

  const result = await voucherForTeacher(voucherId, voucheeId);
  return res.status(200).json({ success: true, message: "Đã bảo lãnh thành công.", data: result });
});

export const suspendTeacherVouchers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await suspendVouchersOf(id);
  return res.status(200).json({
    success: true,
    message: "Đã tạm khóa quyền bảo lãnh của những người từng bảo lãnh cho giáo viên này.",
    data: result,
  });
});
