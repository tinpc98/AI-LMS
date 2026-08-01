// Tự động nộp bài cho phiên thi đã hết giờ (chính sách 1A).
//
// ĐIỀU KIỆN TIÊN QUYẾT ĐÃ ĐƯỢC LÀM TRƯỚC
//
// Job này chấm bài dựa trên những gì học sinh ĐÃ LƯU LÊN MÁY CHỦ. Trước đây bài làm chỉ nằm
// trong localStorage của trình duyệt cho tới lúc bấm nộp — bật job lúc đó sẽ chấm rỗng và học
// sinh mất trắng. Nên PATCH /api/exam-attempts/:id/answers (draftAnswers.service.js) phải có
// trước, và Frontend phải đẩy từng câu ngay khi chọn.
//
// Trình tự đó không phải chi tiết kỹ thuật — nó là điều kiện để chính sách "hết giờ là nộp"
// công bằng.
//
// VÌ SAO KHÔNG DÙNG updateMany
//
// Khác với job đóng kỳ thi (chỉ đổi một trường trạng thái), ở đây mỗi phiên phải được CHẤM:
// đối chiếu từng câu với đáp án, cộng điểm theo trọng số của đề. Đó là logic đã có trong
// gradeSubmission, và nó chạy trong transaction. Gọi lại chính nó cho từng phiên là đúng —
// viết một phiên bản "hàng loạt" riêng sẽ là bản sao thứ hai của quy tắc chấm điểm, và hai bản
// sao chắc chắn sẽ lệch nhau.
//
// Số phiên quá hạn tại mỗi lần chạy vốn nhỏ (job chạy mỗi phút), nên vòng lặp là hợp lý.
import ExamAttempt from "#modules/exam-attempt/examAttempt.model.js";
import examAttemptService from "#modules/exam-attempt/examAttempt.service.js";
import { Exam } from "#modules/exam";
import { GRACE_PERIOD_MS, resolveAttemptDeadline } from "#modules/exam-attempt/attemptDeadline.js";
import { logger } from "#shared/utils/logger.js";

const MINUTE_MS = 60 * 1000;

/**
 * Tìm các phiên IN_PROGRESS đã quá hạn (đã tính ân hạn).
 *
 * Hạn nộp = attempt.startTime + exam.duration phút, nên phép so sánh cần dữ liệu của cả hai
 * collection. Dùng aggregate với $lookup thay vì tải hết phiên đang chạy về rồi lọc bằng
 * JavaScript — số phiên đang chạy có thể lớn vào giờ thi cao điểm.
 */
export const findOverdueAttempts = async (now = new Date()) => {
  return ExamAttempt.aggregate([
    { $match: { status: "IN_PROGRESS" } },
    {
      $lookup: {
        from: Exam.collection.name,
        localField: "examId",
        foreignField: "_id",
        as: "exam",
      },
    },
    { $unwind: "$exam" },
    {
      $match: {
        $expr: {
          $lt: [
            {
              $add: ["$startTime", { $multiply: ["$exam.duration", MINUTE_MS] }, GRACE_PERIOD_MS],
            },
            now,
          ],
        },
      },
    },
    { $project: { _id: 1, answers: 1, startTime: 1, "exam.duration": 1 } },
  ]);
};

export const runExamAttemptAutoSubmit = async (now = new Date()) => {
  const overdue = await findOverdueAttempts(now);
  if (overdue.length === 0) return { submitted: 0, failed: 0 };

  let submitted = 0;
  let failed = 0;

  for (const attempt of overdue) {
    try {
      // Chấm đúng những gì học sinh đã lưu được lên máy chủ. Không có câu nào thì vẫn nộp với
      // 0 điểm — đó là kết quả trung thực của việc không làm bài, khác hẳn với việc mất bài do
      // hệ thống không lưu.
      await examAttemptService.gradeSubmission(attempt._id, attempt.answers || []);
      submitted += 1;
    } catch (error) {
      // Một phiên hỏng không được chặn các phiên còn lại. Ghi log kèm id để truy được.
      failed += 1;
      logger.error(`[AUTO-SUBMIT] Không nộp được phiên ${attempt._id}: ${error.message}`);
    }
  }

  return { submitted, failed };
};

/** Số giây một phiên đã quá hạn — dùng để ghi log, giúp phát hiện job chạy trễ. */
export const overdueBySeconds = (attempt, now = new Date()) => {
  const deadline = resolveAttemptDeadline(attempt.startTime, attempt.exam?.duration);
  if (!deadline) return 0;
  return Math.max(0, Math.round((now.getTime() - deadline.getTime()) / 1000));
};

export default { runExamAttemptAutoSubmit, findOverdueAttempts };
