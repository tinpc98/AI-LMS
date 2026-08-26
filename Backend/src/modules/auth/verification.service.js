// File: src/modules/auth/verification.service.js
// Xác minh 3 tầng & bảo lãnh chéo — EduSpace mechanism design Phần C.1/C.2 (BR-20, BR-22..24).
import User from "./user.model.js";
import { Class } from "#modules/class";
import { NotFoundError, BusinessRuleError, ValidationError } from "#shared/utils/appError.js";

// [GIẢ ĐỊNH] BR-20 — số cohort COMMUNITY hoàn thành tối thiểu để đủ điều kiện L3.
const L3_MIN_COMPLETED_COMMUNITY_COHORTS = 2;
// [GIẢ ĐỊNH] BR-24 — thời gian tạm khóa quyền bảo lãnh khi người được bảo lãnh gây sự cố.
const VOUCH_SUSPENSION_MONTHS = 3;

/**
 * BR-20: kiểm tra (không thay đổi gì) một giáo viên có đủ điều kiện lên L3 hay không. Cả 3
 * điều kiện đều đo được trực tiếp từ dữ liệu hệ thống — không cần Admin duyệt lại (khác L2).
 */
export async function checkL3Eligibility(teacherId) {
  const teacher = await User.findById(teacherId).lean();
  if (!teacher) {
    throw new NotFoundError("Giáo viên không tồn tại.");
  }

  const completedCount = await Class.countDocuments({
    teacherId,
    fundingType: "COMMUNITY",
    commitmentStatus: "COMPLETED",
    isDeleted: false,
  });

  const notRemovedFromPool = teacher.poolStatus !== "REMOVED";
  const hasAtLeastOneVoucher = Array.isArray(teacher.vouchedBy) && teacher.vouchedBy.length >= 1;

  return {
    eligible:
      completedCount >= L3_MIN_COMPLETED_COMMUNITY_COHORTS &&
      notRemovedFromPool &&
      hasAtLeastOneVoucher,
    completedCommunityCohorts: completedCount,
    requiredCohorts: L3_MIN_COMPLETED_COMMUNITY_COHORTS,
    notRemovedFromPool,
    hasAtLeastOneVoucher,
  };
}

/**
 * Nâng tầng lên L3 nếu đủ điều kiện — gọi ngay sau các sự kiện có thể làm thay đổi điều kiện
 * (cohort vừa COMPLETED, vừa được bảo lãnh) thay vì chạy định kỳ, vì BR-20 không cần khoảng
 * trễ — điều kiện đo được ngay lập tức thì nâng ngay lập tức.
 */
export async function tryPromoteToL3(teacherId) {
  const teacher = await User.findById(teacherId);
  if (!teacher) {
    throw new NotFoundError("Giáo viên không tồn tại.");
  }
  if (teacher.verificationTier === "L3") {
    return { promoted: false, reason: "ALREADY_L3" };
  }

  const result = await checkL3Eligibility(teacherId);
  if (!result.eligible) {
    return { promoted: false, ...result };
  }

  teacher.verificationTier = "L3";
  await teacher.save();
  return { promoted: true, ...result };
}

/**
 * BR-22/BR-23: một giáo viên L3 bảo lãnh cho một giáo viên khác lên L3.
 *  - Voucher phải đang ở L3, không bị tạm khóa quyền bảo lãnh (BR-24), còn hạn mức (BR-23).
 *  - Phải đã từng đồng dạy/dự bị chung ít nhất 1 lớp với vouchee (BR-22) — kiểm qua Class:
 *    voucher là teacherId & vouchee là backupTeacherId, hoặc ngược lại, trên CÙNG một lớp.
 * Sau khi bảo lãnh thành công, tự thử nâng tầng vouchee lên L3 (có thể chưa đủ điều kiện khác).
 */
export async function voucherForTeacher(voucherId, voucheeId) {
  if (String(voucherId) === String(voucheeId)) {
    throw new ValidationError("Không thể tự bảo lãnh cho chính mình.");
  }

  const [voucher, vouchee] = await Promise.all([
    User.findById(voucherId),
    User.findById(voucheeId),
  ]);
  if (!voucher || !vouchee) {
    throw new NotFoundError("Không tìm thấy giáo viên (voucher hoặc vouchee).");
  }

  if (voucher.verificationTier !== "L3") {
    throw new BusinessRuleError("Chỉ giáo viên L3 mới được bảo lãnh người khác (BR-22).");
  }
  if (voucher.vouchSuspendedUntil && voucher.vouchSuspendedUntil > new Date()) {
    throw new BusinessRuleError(
      `Quyền bảo lãnh đang bị tạm khóa tới ${voucher.vouchSuspendedUntil.toISOString()} (BR-24).`
    );
  }
  if (voucher.vouchLimit <= 0) {
    throw new BusinessRuleError(
      "Đã đạt hạn mức bảo lãnh đồng thời, không thể bảo lãnh thêm (BR-23)."
    );
  }
  const alreadyVouched = (vouchee.vouchedBy || []).some((id) => String(id) === String(voucherId));
  if (alreadyVouched) {
    throw new BusinessRuleError("Đã bảo lãnh cho giáo viên này rồi.");
  }

  const coTaughtTogether = await Class.exists({
    isDeleted: false,
    $or: [
      { teacherId: voucherId, backupTeacherId: voucheeId },
      { teacherId: voucheeId, backupTeacherId: voucherId },
    ],
  });
  if (!coTaughtTogether) {
    throw new BusinessRuleError(
      "Chỉ được bảo lãnh giáo viên đã từng đồng dạy/dự bị chung ít nhất 1 lớp (BR-22)."
    );
  }

  vouchee.vouchedBy = [...(vouchee.vouchedBy || []), voucherId];
  voucher.vouchLimit -= 1;
  await Promise.all([vouchee.save(), voucher.save()]);

  const promotion = await tryPromoteToL3(voucheeId);
  return { voucher, vouchee, promotion };
}

/**
 * BR-24: người được bảo lãnh gây sự cố nghiêm trọng (rời pool do ESCALATION_TERMINATED hoặc
 * gian lận) → MỖI người từng bảo lãnh cho họ tạm mất quyền bảo lãnh THÊM AI trong 3 tháng.
 * KHÔNG trừ reliabilityScore của voucher, KHÔNG đụng vouchLimit hiện có — chỉ chặn dùng tạm
 * thời (đặc tả nói rõ lý do: phạt nặng sẽ khiến không ai dám bảo lãnh ai, giết chết cơ chế mở
 * rộng quy mô).
 */
export async function suspendVouchersOf(teacherId) {
  const teacher = await User.findById(teacherId).lean();
  if (!teacher || !Array.isArray(teacher.vouchedBy) || teacher.vouchedBy.length === 0) {
    return { suspendedVoucherIds: [] };
  }

  const suspendUntil = new Date(Date.now() + VOUCH_SUSPENSION_MONTHS * 30 * 24 * 60 * 60 * 1000);
  await User.updateMany(
    { _id: { $in: teacher.vouchedBy } },
    { $set: { vouchSuspendedUntil: suspendUntil } }
  );

  return { suspendedVoucherIds: teacher.vouchedBy, suspendUntil };
}

/**
 * Giáo viên tự xem trạng thái xác minh/độ tin cậy/pool của CHÍNH MÌNH — dùng fallback về
 * default của schema cho các field có thể còn thiếu ở tài khoản tạo trước khi cơ chế này ra
 * đời (Mongoose không tự backfill document cũ, xem migration backfillCommitmentStatus.js cho
 * trường hợp tương tự ở Class).
 */
export async function getOwnVerificationStatus(teacherId) {
  const teacher = await User.findById(teacherId).lean();
  if (!teacher) {
    throw new NotFoundError("Không tìm thấy tài khoản.");
  }

  const verificationTier = teacher.verificationTier || "L1";
  const l3Eligibility = verificationTier === "L3" ? null : await checkL3Eligibility(teacherId);

  return {
    verificationTier,
    reliabilityScore: teacher.reliabilityScore ?? 100,
    poolStatus: teacher.poolStatus || "ACTIVE",
    poolLockedUntil: teacher.poolLockedUntil || null,
    vouchLimit: teacher.vouchLimit ?? 2,
    vouchedByCount: Array.isArray(teacher.vouchedBy) ? teacher.vouchedBy.length : 0,
    vouchSuspendedUntil: teacher.vouchSuspendedUntil || null,
    l3Eligibility,
  };
}

/**
 * Đồng nghiệp đã từng đồng dạy/dự bị chung ít nhất 1 lớp với giáo viên này — ĐIỀU KIỆN TIÊN
 * QUYẾT của BR-22 để bảo lãnh. Trả danh sách này thay vì để giáo viên tự gõ ID bất kỳ, vì
 * voucherForTeacher sẽ từ chối mọi cặp chưa từng đồng dạy — hiện sẵn danh sách hợp lệ giúp UI
 * không dẫn người dùng đến một hành động chắc chắn thất bại.
 */
export async function getCoTaughtColleagues(teacherId) {
  const classes = await Class.find({
    isDeleted: false,
    $or: [{ teacherId }, { backupTeacherId: teacherId }],
  })
    .select("teacherId backupTeacherId")
    .populate("teacherId", "fullName")
    .populate("backupTeacherId", "fullName")
    .lean();

  const colleagues = new Map();
  for (const cls of classes) {
    const isMainTeacher = String(cls.teacherId?._id || cls.teacherId) === String(teacherId);
    const other = isMainTeacher ? cls.backupTeacherId : cls.teacherId;
    if (other?._id && String(other._id) !== String(teacherId)) {
      colleagues.set(String(other._id), other.fullName);
    }
  }

  return Array.from(colleagues, ([id, fullName]) => ({ id, fullName }));
}

export { L3_MIN_COMPLETED_COMMUNITY_COHORTS, VOUCH_SUSPENSION_MONTHS };
