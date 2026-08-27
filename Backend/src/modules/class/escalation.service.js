// File: src/modules/class/escalation.service.js
// Quy trình leo thang khi giáo viên vắng mặt — EduSpace mechanism design Phần B.1 (BR-13/14).
//
// Mức 1: tự động, kích hoạt dự bị (backupTeacher.service.js) — không cần Admin.
// Mức 2: cần Admin (không có role Ops riêng trong hệ thống — xem "Ghi chú phương pháp" của
//   đặc tả) — hệ thống chỉ đánh dấu buổi cần chú ý khẩn, việc TÌM giáo viên thay bất kỳ vẫn là
//   thao tác thủ công của Admin ở bản này (chưa có thuật toán gợi ý tự động — đó là R04/R10).
// Mức 3: Admin huỷ buổi, hệ thống tự tạo buổi bù (tái dùng ClassSession.makeupForSessionId có
//   sẵn) và không tính buổi bù vào cohortSessionCount đã dùng.
import { ClassSession } from "#modules/classSession";
import Class from "./class.model.js";
import { activateBackupTeacher } from "./backupTeacher.service.js";
import { NotFoundError, BusinessRuleError } from "#shared/utils/appError.js";

const CHECKIN_GRACE_MINUTES = 15; // [GIẢ ĐỊNH] B.1
const MAX_CANCELLED_SESSIONS_BEFORE_REVIEW = 2; // BR-14 — [GIẢ ĐỊNH] cùng 1 cohort

/**
 * Tìm các buổi học ĐÃ QUÁ giờ bắt đầu >= CHECKIN_GRACE_MINUTES phút mà giáo viên chưa
 * actualStartAt (chưa check-in) — đây là tập hợp buổi cần đưa vào leo thang Mức 1.
 */
export async function findOverdueSessions(now = new Date()) {
  const cutoff = new Date(now.getTime() - CHECKIN_GRACE_MINUTES * 60 * 1000);
  return ClassSession.find({
    status: "SCHEDULED",
    scheduledStartAt: { $lte: cutoff },
    actualStartAt: null,
    isDeleted: false,
  }).lean();
}

/**
 * Mức 1: thử kích hoạt dự bị cho MỘT buổi quá giờ. Trả về kết quả để job gọi hàng loạt biết
 * buổi nào cần đẩy tiếp lên Mức 2 (không có dự bị hoặc kích hoạt lỗi).
 */
export async function escalateLevel1(sessionId) {
  const session = await ClassSession.findById(sessionId);
  if (!session) {
    throw new NotFoundError("Buổi học không tồn tại.");
  }

  const classDoc = await Class.findById(session.classId).select("backupTeacherId").lean();
  if (!classDoc?.backupTeacherId) {
    return { sessionId, resolved: false, reason: "NO_BACKUP_AVAILABLE" };
  }

  try {
    await activateBackupTeacher(session.classId, { reason: "NO_SHOW" });
    return { sessionId, resolved: true, reason: "BACKUP_ACTIVATED" };
  } catch (error) {
    return { sessionId, resolved: false, reason: "BACKUP_ACTIVATION_FAILED", error: error.message };
  }
}

/**
 * Mức 3: Admin huỷ buổi + hệ thống tự tạo buổi bù cuối đợt. Không tính buổi bù vào
 * cohortSessionCount đã dùng (buổi bù không có sessionNumber trùng buổi gốc).
 */
export async function cancelSessionWithMakeup(
  sessionId,
  { adminId, makeupScheduledStartAt, makeupScheduledEndAt }
) {
  const session = await ClassSession.findById(sessionId);
  if (!session) {
    throw new NotFoundError("Buổi học không tồn tại.");
  }
  if (session.status === "CANCELLED") {
    throw new BusinessRuleError("Buổi học đã bị huỷ từ trước.");
  }
  if (!makeupScheduledStartAt || !makeupScheduledEndAt) {
    throw new BusinessRuleError("Phải cung cấp thời gian buổi bù (makeupScheduledStartAt/EndAt).");
  }

  session.status = "CANCELLED";
  session.cancelReason = "Không tìm được giáo viên thay trong SLA leo thang Mức 3 (BR-13)";
  session.cancelledAt = new Date();
  session.cancelledBy = adminId;
  await session.save();

  // BUG ĐÃ SỬA: bản trước gán CÙNG sessionNumber với buổi gốc — nhưng buổi gốc chỉ đổi
  // status="CANCELLED", không set isDeleted:true, nên vẫn khớp partialFilterExpression của
  // unique index {classId,sessionNumber} (isDeleted:false) trên ClassSession -> ClassSession.create()
  // LUÔN ném lỗi trùng khóa (E11000) trên MongoDB thật (unit test dùng mock nên không bắt được).
  // Đúng ý đồ ban đầu ("buổi bù cuối đợt", xem docstring hàm) là buổi bù nằm Ở CUỐI đợt với số
  // thứ tự MỚI, không thay thế đúng vị trí buổi gốc — dùng lại cách tính nextSessionNumber đã có
  // ở classSession.service.js.
  const lastSession = await ClassSession.findOne({ classId: session.classId })
    .sort({ sessionNumber: -1 })
    .lean();
  const nextSessionNumber = (lastSession?.sessionNumber || 0) + 1;

  const makeupSession = await ClassSession.create({
    classId: session.classId,
    teacherId: session.teacherId,
    sessionNumber: nextSessionNumber,
    title: `${session.title} (Học bù)`,
    sessionType: "MAKEUP",
    topicId: session.topicId,
    scheduledStartAt: makeupScheduledStartAt,
    scheduledEndAt: makeupScheduledEndAt,
    makeupForSessionId: session._id,
  });

  const reviewFlag = await checkCancelledSessionThreshold(session.classId);

  return { cancelledSession: session, makeupSession, reviewFlag };
}

/**
 * BR-14: nếu một cohort có >= MAX_CANCELLED_SESSIONS_BEFORE_REVIEW buổi bị huỷ hoàn toàn
 * (Mức 3), ĐÁNH DẤU cohort cần Admin xem xét đóng sớm bằng cách ghi `cancelledSessionsFlaggedAt`
 * lên Class — KHÔNG tự đóng (Phần B.5 nói rõ đây là quyết định của Admin, không tự động hoá vì
 * ảnh hưởng người học thật). Trước đây hàm này chỉ TRẢ VỀ kết quả mà không ghi lại đâu cả, khiến
 * BR-14 không có tác dụng quan sát được ở bất kỳ đâu trong hệ thống — đây là bản sửa.
 * Idempotent: chỉ ghi mốc lần đầu đạt ngưỡng, không cập nhật lại nếu đã có.
 */
export async function checkCancelledSessionThreshold(classId) {
  const cancelledCount = await ClassSession.countDocuments({
    classId,
    status: "CANCELLED",
    sessionType: { $ne: "MAKEUP" }, // chỉ đếm buổi GỐC bị huỷ, không đếm buổi bù
    isDeleted: false,
  });

  if (cancelledCount < MAX_CANCELLED_SESSIONS_BEFORE_REVIEW) {
    return { flaggedForReview: false, cancelledCount };
  }

  await Class.updateOne(
    { _id: classId, cancelledSessionsFlaggedAt: null },
    { $set: { cancelledSessionsFlaggedAt: new Date() } }
  );

  return { flaggedForReview: true, cancelledCount };
}

/**
 * Danh sách cohort ĐANG SỐNG (chưa kết thúc/rút/chấm dứt) đã bị đánh dấu cần Admin xem xét đóng
 * sớm — dùng cho hàng đợi Admin, tương tự findOverdueSessions().
 */
export async function listCohortsFlaggedForReview() {
  return Class.find({
    cancelledSessionsFlaggedAt: { $ne: null },
    commitmentStatus: { $in: ["OFFERED", "ACCEPTED", "CONFIRMED", "ACTIVE"] },
    isDeleted: false,
  })
    .select("name code commitmentStatus cancelledSessionsFlaggedAt teacherId")
    .populate("teacherId", "fullName")
    .sort({ cancelledSessionsFlaggedAt: 1 })
    .lean();
}

export { CHECKIN_GRACE_MINUTES, MAX_CANCELLED_SESSIONS_BEFORE_REVIEW };
