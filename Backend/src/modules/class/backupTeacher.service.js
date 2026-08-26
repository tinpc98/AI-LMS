// File: src/modules/class/backupTeacher.service.js
// Cơ chế dạy đôi (chính/dự bị) — EduSpace mechanism design Phần A.6 (BR-09..BR-12).
import Class from "./class.model.js";
import CommitmentEvent from "./commitmentEvent.model.js";
import { User } from "#modules/auth";
import { NotFoundError, BusinessRuleError, ValidationError } from "#shared/utils/appError.js";

// BR-12: một giáo viên chỉ được làm dự bị cho tối đa 3 cohort đang CONFIRMED/ACTIVE cùng lúc.
const MAX_CONCURRENT_BACKUP_COHORTS = 3;

// Các trạng thái cam kết còn "sống" — cohort đã COMPLETED/TERMINATED/WITHDRAWN không tính vào
// trần dự bị của BR-12 nữa.
const LIVE_COMMITMENT_STATUSES = ["OFFERED", "ACCEPTED", "CONFIRMED", "ACTIVE"];

/**
 * BR-09/BR-12: Gán giáo viên dự bị cho một lớp — cấp quyền xem học liệu ngay từ lúc gán (bản
 * thân việc gán backupTeacherId trên Class đã đủ để mọi endpoint đọc học liệu của lớp cho phép
 * dự bị truy cập, vì các endpoint đó đã kiểm teacherId HOẶC backupTeacherId — xem class.access
 * middleware khi wire route thật).
 */
export async function assignBackupTeacher(classId, backupTeacherId) {
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    throw new NotFoundError("Lớp học không tồn tại.");
  }
  if (!classDoc.teacherId) {
    throw new BusinessRuleError("Lớp học chưa có giáo viên chính, chưa thể gán dự bị.");
  }
  if (String(classDoc.teacherId) === String(backupTeacherId)) {
    throw new ValidationError("Giáo viên dự bị không được trùng giáo viên chính.");
  }

  const concurrentCount = await Class.countDocuments({
    backupTeacherId,
    commitmentStatus: { $in: LIVE_COMMITMENT_STATUSES },
    isDeleted: false,
  });
  if (concurrentCount >= MAX_CONCURRENT_BACKUP_COHORTS) {
    throw new BusinessRuleError(
      `Giáo viên này đang làm dự bị cho ${concurrentCount} lớp — đã đạt trần ${MAX_CONCURRENT_BACKUP_COHORTS} cohort đồng thời (BR-12).`
    );
  }

  classDoc.backupTeacherId = backupTeacherId;
  await classDoc.save();
  return classDoc;
}

/**
 * BR-10/BR-11: Kích hoạt dự bị lên vai chính — dự bị trở thành teacherId, giáo viên chính cũ
 * được ghi nhận sự kiện theo `primaryReason` (thường là CANCELLED_WITH_NOTICE hoặc lý do leo
 * thang từ Phần B), và dự bị được cộng điểm độ tin cậy BẰNG 1.5x một buổi bình thường (BR-11)
 * — khác biệt có chủ đích so với giáo viên chính bình thường (dạy thay không được báo trước
 * lâu là hành vi giá trị cao hơn).
 *
 * @param {string} classId
 * @param {object} options
 * @param {string} options.reason - lý do kích hoạt: "CANCELLED_WITH_NOTICE" (a - có báo trước
 *   ≥48h) hoặc "ESCALATION_TERMINATED"/"NO_SHOW" (b - do leo thang Phần B, primary không phản
 *   hồi trong SLA)
 * @param {string} [options.changedBy]
 */
export async function activateBackupTeacher(classId, { reason, changedBy } = {}) {
  const classDoc = await Class.findById(classId);
  if (!classDoc) {
    throw new NotFoundError("Lớp học không tồn tại.");
  }
  if (!classDoc.backupTeacherId) {
    throw new BusinessRuleError("Lớp học chưa có giáo viên dự bị để kích hoạt.");
  }

  const previousTeacherId = classDoc.teacherId;
  const backupTeacherId = classDoc.backupTeacherId;

  classDoc.teacherId = backupTeacherId;
  classDoc.backupTeacherId = null; // dự bị giờ là chính, không còn là dự bị của chính họ nữa
  await classDoc.save();

  // BR-11: ghi nhận điểm cộng cho người VỪA ĐƯỢC KÍCH HOẠT (không phải giáo viên cũ).
  const activatedTeacher = await User.findById(backupTeacherId);
  if (activatedTeacher) {
    activatedTeacher.reliabilityScore = Math.min(100, activatedTeacher.reliabilityScore + 7.5);
    await activatedTeacher.save();
  }

  await CommitmentEvent.create({
    classId,
    teacherId: backupTeacherId,
    fromStatus: classDoc.commitmentStatus,
    toStatus: classDoc.commitmentStatus, // kích hoạt dự bị không tự đổi commitmentStatus của lớp
    reason: "BACKUP_ACTIVATED",
    strikeApplied: 0,
    changedBy: changedBy || null,
    note: `Thay thế giáo viên ${previousTeacherId} — lý do kích hoạt gốc: ${reason || "không ghi rõ"}`,
  });

  return { classDoc, previousTeacherId, activatedTeacherId: backupTeacherId };
}

export { MAX_CONCURRENT_BACKUP_COHORTS };
