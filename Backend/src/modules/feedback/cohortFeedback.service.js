// File: src/modules/feedback/cohortFeedback.service.js
// Thu thập & tổng hợp đánh giá học viên — EduSpace mechanism design Phần C.3, BR-25/26.
import CohortFeedback from "./cohortFeedback.model.js";
import { Class } from "#modules/class";
import { ClassEnrollment } from "#modules/classEnrollment";
import { NotFoundError, BusinessRuleError, ConflictError } from "#shared/utils/appError.js";

// Chỉ thu thập SAU buổi cuối cùng (BR-26 comment trong model) — cohort phải đã hoàn thành
// (trọn vẹn hoặc đóng sớm nhưng đủ tiến độ), không thu thập giữa chừng vì học viên chưa trải
// nghiệm đủ để đánh giá công bằng.
const FEEDBACK_ELIGIBLE_STATUSES = ["COMPLETED", "COMPLETED_PARTIAL"];

/**
 * Học viên nộp đánh giá cho một lớp — chỉ 1 lần/lớp (unique index đã chặn ở DB, nhưng kiểm
 * trước ở đây để trả lỗi thân thiện thay vì lỗi 11000 thô).
 */
export async function submitFeedback(
  classId,
  studentId,
  { ratingClarity, ratingHelpfulness, comment }
) {
  const classDoc = await Class.findById(classId).select("teacherId commitmentStatus").lean();
  if (!classDoc) {
    throw new NotFoundError("Lớp học không tồn tại.");
  }
  if (!FEEDBACK_ELIGIBLE_STATUSES.includes(classDoc.commitmentStatus)) {
    throw new BusinessRuleError(
      "Chỉ được đánh giá sau khi lớp đã kết thúc (COMPLETED hoặc COMPLETED_PARTIAL)."
    );
  }
  if (!classDoc.teacherId) {
    throw new BusinessRuleError("Lớp học không có giáo viên để đánh giá.");
  }

  // BUG ĐÃ SỬA: trước đây không kiểm học viên có thực sự học lớp này hay không — bất kỳ học
  // sinh nào đăng nhập cũng đánh giá được bất kỳ lớp COMPLETED nào, làm nhiễu chỉ số Chất lượng
  // của giáo viên. Không yêu cầu status="ACTIVE" (lớp đã COMPLETED thì enrollment hợp lệ có thể
  // đã chuyển sang "COMPLETED") — chỉ loại "CANCELLED" (chưa từng thực sự tham gia/đã rút hẳn).
  const wasEnrolled = await ClassEnrollment.exists({
    classId,
    studentId,
    status: { $ne: "CANCELLED" },
  });
  if (!wasEnrolled) {
    throw new BusinessRuleError("Bạn chưa từng tham gia lớp học này, không thể đánh giá.");
  }

  const existing = await CohortFeedback.findOne({ classId, studentId }).lean();
  if (existing) {
    throw new ConflictError("Bạn đã đánh giá lớp học này rồi.");
  }

  return CohortFeedback.create({
    classId,
    studentId,
    teacherId: classDoc.teacherId,
    ratingClarity,
    ratingHelpfulness,
    comment: comment || "",
  });
}

/**
 * Điểm trung bình đánh giá của một giáo viên — ẨN DANH: chỉ trả về số liệu tổng hợp, không
 * trả danh sách từng bản ghi kèm studentId (đó là việc của getFeedbackDetailsForAdmin, dành
 * riêng cho Admin xem để xử lý khiếu nại/theo dõi, không lộ ra cho chính giáo viên).
 */
export async function getTeacherAverageRatings(teacherId) {
  const feedbacks = await CohortFeedback.find({ teacherId })
    .select("ratingClarity ratingHelpfulness")
    .lean();

  if (feedbacks.length === 0) {
    return { count: 0, avgClarity: null, avgHelpfulness: null };
  }

  const sumClarity = feedbacks.reduce((sum, f) => sum + f.ratingClarity, 0);
  const sumHelpfulness = feedbacks.reduce((sum, f) => sum + f.ratingHelpfulness, 0);

  return {
    count: feedbacks.length,
    avgClarity: parseFloat((sumClarity / feedbacks.length).toFixed(2)),
    avgHelpfulness: parseFloat((sumHelpfulness / feedbacks.length).toFixed(2)),
  };
}

/**
 * Admin xem chi tiết từng bản ghi (kèm studentId) — CHỈ dùng cho xử lý khiếu nại/theo dõi mẫu
 * hình phản ánh tiêu cực lặp lại (C.4), KHÔNG lộ ra cho giáo viên qua bất kỳ route nào khác.
 */
export async function getFeedbackDetailsForAdmin(teacherId) {
  return CohortFeedback.find({ teacherId }).sort({ createdAt: -1 }).lean();
}

export { FEEDBACK_ELIGIBLE_STATUSES };
