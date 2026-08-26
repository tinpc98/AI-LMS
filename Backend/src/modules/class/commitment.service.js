// File: src/modules/class/commitment.service.js
// Cơ chế cam kết người dạy — EduSpace mechanism design Phần A. Quản lý vòng đời
// Class.commitmentStatus (A.2), tính strike/độ tin cậy theo lý do (BR-05..BR-08), và thực thi
// ngưỡng khóa/loại khỏi pool (A.5). Mọi transition được ghi vào CommitmentEvent (BR-04) —
// đây là NGUỒN SỰ THẬT DUY NHẤT để tính lại điểm nếu công thức thay đổi sau này.
import Class from "./class.model.js";
import CommitmentEvent, { COMMITMENT_REASONS } from "./commitmentEvent.model.js";
import { assertCohortReadyForConfirmation } from "./cohortReadiness.service.js";
import { User } from "#modules/auth";
import { NotFoundError, BusinessRuleError, ValidationError } from "#shared/utils/appError.js";

// Vòng đời A.2 — key = trạng thái hiện tại, value = các trạng thái được phép chuyển tới.
const ALLOWED_TRANSITIONS = {
  OFFERED: ["ACCEPTED"],
  ACCEPTED: ["CONFIRMED", "WITHDRAWN_EARLY"],
  CONFIRMED: ["ACTIVE"],
  ACTIVE: ["COMPLETED", "COMPLETED_PARTIAL", "WITHDRAWN_MIDWAY", "TERMINATED"],
  COMPLETED: [],
  COMPLETED_PARTIAL: [],
  WITHDRAWN_EARLY: [],
  WITHDRAWN_MIDWAY: [],
  TERMINATED: [],
};

// [GIẢ ĐỊNH] Điểm trừ/cộng độ tin cậy theo lý do — đặc tả gốc chỉ cho công thức khung
// (100 − Σ trừ + Σ cộng), chưa cho số cụ thể; các số dưới đây là điểm khởi đầu để hiệu chỉnh
// sau khi có dữ liệu vận hành thật (xem Phần E.2 của đặc tả — thử nghiệm nhỏ trước khi tin số).
const RELIABILITY_DELTA = {
  CANCELLED_LATE: -5,
  NO_SHOW: -15,
  ESCALATION_TERMINATED: -30,
  COHORT_CLOSED_EARLY_LOW_PROGRESS: -5,
  BACKUP_ACTIVATED: 7.5, // BR-11: 1.5x điểm cộng của 1 buổi bình thường (giả định buổi thường = +5)
  COHORT_COMPLETED: 5,
  // Các lý do còn lại (SCHEDULE_FILLED, SESSION_COMPLETED, WITHDREW_BEFORE_LOCK,
  // CANCELLED_WITH_NOTICE, FORCE_MAJEURE_EXCUSED, COHORT_CLOSED_EARLY_HIGH_PROGRESS) = 0,
  // đúng theo BR-05/BR-08/BR-19: không phạt cam kết chưa bắt đầu, miễn trừ có lý do chính đáng,
  // hoặc đóng sớm khi đã trôi đủ tiến độ.
};

// Lý do tính là 1 "strike" (đếm dồn theo cửa sổ 6 tháng, A.5) — KHÁC với RELIABILITY_DELTA:
// strike đếm SỰ KIỆN, độ tin cậy đo ĐIỂM. Một strike nặng (NO_SHOW) và 1 strike nhẹ
// (CANCELLED_LATE) đều tính là "1 strike" như nhau khi so với ngưỡng 2/3 lần.
const STRIKE_REASONS = new Set(["CANCELLED_LATE", "NO_SHOW", "COHORT_CLOSED_EARLY_LOW_PROGRESS"]);

const STRIKE_WINDOW_MS = 6 * 30 * 24 * 60 * 60 * 1000; // [GIẢ ĐỊNH] 6 tháng ~ 180 ngày (BR-06 decay)
const POOL_LOCK_DAYS = 14; // [GIẢ ĐỊNH] A.5
const STRIKE_LOCK_THRESHOLD = 2; // A.5
const STRIKE_REMOVE_THRESHOLD = 3; // A.5

/**
 * Đếm số strike CÒN HIỆU LỰC (chưa decay quá 6 tháng) của một giáo viên.
 */
async function countActiveStrikes(teacherId) {
  const since = new Date(Date.now() - STRIKE_WINDOW_MS);
  const events = await CommitmentEvent.find({
    teacherId,
    createdAt: { $gte: since },
  }).lean();
  return events.filter((e) => STRIKE_REASONS.has(e.reason)).length;
}

/**
 * Áp dụng ngưỡng A.5 sau khi 1 strike mới được ghi: 2 strike/6 tháng → khóa pool 14 ngày;
 * 3 strike/6 tháng → loại khỏi pool. ESCALATION_TERMINATED loại khỏi pool NGAY LẬP TỨC, không
 * cần đợi đủ 3 strike (vấn đề A: 1 lần gãy lớp hoàn toàn đã là rủi ro nghiêm trọng nhất).
 */
async function enforcePoolThresholds(teacherId, reason) {
  const teacher = await User.findById(teacherId);
  if (!teacher) return;

  if (reason === "ESCALATION_TERMINATED") {
    teacher.poolStatus = "REMOVED";
    await teacher.save();
    return;
  }

  if (!STRIKE_REASONS.has(reason)) return;

  const strikeCount = await countActiveStrikes(teacherId);

  if (strikeCount >= STRIKE_REMOVE_THRESHOLD) {
    teacher.poolStatus = "REMOVED";
    teacher.poolLockedUntil = null;
    await teacher.save();
  } else if (strikeCount >= STRIKE_LOCK_THRESHOLD && teacher.poolStatus === "ACTIVE") {
    teacher.poolStatus = "LOCKED";
    teacher.poolLockedUntil = new Date(Date.now() + POOL_LOCK_DAYS * 24 * 60 * 60 * 1000);
    await teacher.save();
  }
}

/**
 * Tự động mở khóa pool nếu poolLockedUntil đã qua — gọi ở bất kỳ đâu cần biết trạng thái pool
 * hiện tại còn hiệu lực hay không (REMOVED không có cơ chế tự hết hạn, chỉ LOCKED mới có).
 */
export async function refreshPoolLockIfExpired(teacher) {
  if (
    teacher?.poolStatus === "LOCKED" &&
    teacher.poolLockedUntil &&
    teacher.poolLockedUntil <= new Date()
  ) {
    teacher.poolStatus = "ACTIVE";
    teacher.poolLockedUntil = null;
    await teacher.save();
  }
  return teacher;
}

/**
 * Chuyển trạng thái cam kết của giáo viên với một lớp (cohort).
 *
 * @param {string} classId
 * @param {string} toStatus - một trong các giá trị enum Class.commitmentStatus
 * @param {object} options
 * @param {string} options.reason - bắt buộc, một trong COMMITMENT_REASONS
 * @param {string} [options.changedBy] - userId thực hiện; null nếu hệ thống tự ghi
 * @param {string} [options.note]
 */
export async function transitionCommitment(classId, toStatus, { reason, changedBy, note } = {}) {
  if (!reason || !COMMITMENT_REASONS.includes(reason)) {
    throw new ValidationError(`reason không hợp lệ: phải thuộc ${COMMITMENT_REASONS.join(", ")}`);
  }

  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    throw new NotFoundError("Lớp học không tồn tại.");
  }
  if (!classDoc.teacherId) {
    throw new BusinessRuleError(
      "Lớp học chưa được phân công giáo viên, không có cam kết để chuyển."
    );
  }

  const fromStatus = classDoc.commitmentStatus;
  const allowedNext = ALLOWED_TRANSITIONS[fromStatus];
  if (!allowedNext || !allowedNext.includes(toStatus)) {
    throw new BusinessRuleError(`Không thể chuyển cam kết từ "${fromStatus}" sang "${toStatus}".`);
  }

  // A.5: giáo viên đang bị khóa/loại khỏi pool không được NHẬN thêm cam kết mới — chỉ kiểm ở
  // bước OFFERED->ACCEPTED (đây là lúc "nhận đợt"), không kiểm mọi transition để tránh 1 lượt
  // đọc User thừa cho các bước sau vốn không còn liên quan tới việc "có được nhận cohort hay
  // không" nữa (đã nhận từ trước rồi).
  if (fromStatus === "OFFERED" && toStatus === "ACCEPTED") {
    const teacher = await User.findById(classDoc.teacherId);
    if (teacher) {
      await refreshPoolLockIfExpired(teacher);
      if (teacher.poolStatus !== "ACTIVE") {
        throw new BusinessRuleError(
          `Giáo viên đang ở trạng thái pool "${teacher.poolStatus}", không thể nhận cohort mới.`
        );
      }
    }
  }

  // BR-16: chặn CONFIRMED nếu chưa đủ số buổi có đầy đủ học liệu khép kín (BR-15) — nếu không,
  // toàn bộ cơ chế leo thang/bàn giao ở Phần B trở nên vô nghĩa vì giáo viên thay không dạy
  // được ngay.
  if (toStatus === "CONFIRMED") {
    await assertCohortReadyForConfirmation(classId);
  }

  // BR-05: rút trước khi chốt lịch (rời ACCEPTED) không bao giờ tính strike, bất kể reason
  // truyền vào là gì — chặn ở đây để không ai vô tình/cố ý gọi sai reason cho trường hợp này.
  const isPreLockWithdrawal = fromStatus === "ACCEPTED" && toStatus === "WITHDRAWN_EARLY";
  const effectiveReason = isPreLockWithdrawal ? "WITHDREW_BEFORE_LOCK" : reason;

  const reliabilityDelta = RELIABILITY_DELTA[effectiveReason] || 0;
  const strikeApplied = STRIKE_REASONS.has(effectiveReason) ? 1 : 0;

  classDoc.commitmentStatus = toStatus;
  await classDoc.save();

  if (reliabilityDelta !== 0) {
    const teacher = await User.findById(classDoc.teacherId);
    if (teacher) {
      teacher.reliabilityScore = Math.max(
        0,
        Math.min(100, teacher.reliabilityScore + reliabilityDelta)
      );
      await teacher.save();
    }
  }

  await CommitmentEvent.create({
    classId,
    teacherId: classDoc.teacherId,
    fromStatus,
    toStatus,
    reason: effectiveReason,
    strikeApplied,
    changedBy: changedBy || null,
    note: note || "",
  });

  if (strikeApplied > 0 || effectiveReason === "ESCALATION_TERMINATED") {
    await enforcePoolThresholds(classDoc.teacherId, effectiveReason);
  }

  return classDoc;
}

/**
 * BR-08: Admin miễn strike cho một sự kiện bất khả kháng đã ghi trước đó — hoàn lại điểm độ
 * tin cậy đã trừ, và tính lại ngưỡng pool (có thể mở khóa nếu strike vừa bị xóa làm giảm số
 * strike đang hiệu lực xuống dưới ngưỡng).
 */
export async function excuseCommitmentEvent(eventId, adminId) {
  const event = await CommitmentEvent.findById(eventId);
  if (!event) {
    throw new NotFoundError("Không tìm thấy sự kiện cam kết.");
  }
  if (!STRIKE_REASONS.has(event.reason)) {
    throw new BusinessRuleError("Sự kiện này không phải strike, không cần miễn trừ.");
  }

  const reliabilityDelta = RELIABILITY_DELTA[event.reason] || 0;
  const teacher = await User.findById(event.teacherId);
  if (teacher && reliabilityDelta !== 0) {
    teacher.reliabilityScore = Math.max(
      0,
      Math.min(100, teacher.reliabilityScore - reliabilityDelta)
    );
  }

  event.reason = "FORCE_MAJEURE_EXCUSED";
  event.strikeApplied = 0;
  event.note =
    `${event.note ? event.note + " | " : ""}Miễn trừ bất khả kháng bởi admin ${adminId}`.trim();
  await event.save();

  const strikeCount = await countActiveStrikes(event.teacherId);
  if (teacher) {
    if (strikeCount < STRIKE_LOCK_THRESHOLD && teacher.poolStatus === "LOCKED") {
      teacher.poolStatus = "ACTIVE";
      teacher.poolLockedUntil = null;
    }
    await teacher.save();
  }

  return event;
}

export { ALLOWED_TRANSITIONS, RELIABILITY_DELTA, STRIKE_REASONS, countActiveStrikes };
