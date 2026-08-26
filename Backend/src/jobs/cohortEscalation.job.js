// Job tự động cho Mức 1 leo thang khi giáo viên vắng mặt (EduSpace mechanism design Phần B.1,
// BR-13). Quét các buổi đã quá CHECKIN_GRACE_MINUTES phút mà giáo viên chưa check-in, tự động
// thử kích hoạt dự bị cho từng buổi.
//
// Mức 2/3 KHÔNG tự động ở đây — đúng "Ghi chú phương pháp" của đặc tả: hệ thống không có role
// Ops riêng, nên buổi không có dự bị (hoặc kích hoạt lỗi) chỉ được TRẢ VỀ trong kết quả job để
// log cảnh báo cho Admin xem thủ công (tương tự cách Job 3 "Exam Auto-Close" đếm `dangling`
// thay vì tự xử lý phiên treo).
import { findOverdueSessions, escalateLevel1 } from "#modules/class";
import { logger } from "#shared/utils/logger.js";

export const runCohortEscalationLevel1 = async (now = new Date()) => {
  const overdueSessions = await findOverdueSessions(now);
  if (overdueSessions.length === 0) {
    return { checked: 0, resolved: 0, needsAdminAttention: 0 };
  }

  let resolved = 0;
  const needsAdminAttention = [];

  for (const session of overdueSessions) {
    try {
      const result = await escalateLevel1(session._id);
      if (result.resolved) {
        resolved += 1;
      } else {
        needsAdminAttention.push({ sessionId: session._id, reason: result.reason });
      }
    } catch (error) {
      needsAdminAttention.push({ sessionId: session._id, reason: "ESCALATION_ERROR" });
      logger.error(`[COHORT-ESCALATION] Lỗi xử lý buổi ${session._id}: ${error.message}`);
    }
  }

  return {
    checked: overdueSessions.length,
    resolved,
    needsAdminAttention: needsAdminAttention.length,
    needsAdminAttentionDetails: needsAdminAttention,
  };
};
