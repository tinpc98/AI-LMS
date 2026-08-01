// Lưu tạm bài làm của học sinh trong lúc đang thi.
//
// VÌ SAO PHẢI CÓ TRƯỚC KHI LÀM CRON TỰ ĐỘNG NỘP BÀI
//
// Trước đây bài làm CHỈ nằm trong localStorage của trình duyệt cho tới lúc bấm nộp. Nếu bật
// cron đóng phiên quá hạn ngay lúc này, mọi phiên bị đóng sẽ được chấm với answers RỖNG —
// học sinh làm bài xong mà mất trắng vì mất mạng đúng phút cuối.
//
// Nói cách khác: chính sách "hết giờ là nộp" chỉ công bằng khi máy chủ THẬT SỰ BIẾT học sinh
// đã trả lời gì. Đây là mảnh còn thiếu đó.
//
// KHÔNG CHẤM ĐIỂM Ở ĐÂY. Hàm này chỉ ghi lại lựa chọn. Chấm điểm vẫn là việc của
// gradeSubmission, chạy đúng một lần khi phiên kết thúc — dù do học sinh bấm nộp hay do cron.
import ExamAttempt from "./examAttempt.model.js";
import { Exam } from "#modules/exam";
import { GRACE_PERIOD_MS, resolveAttemptDeadline } from "./attemptDeadline.js";
import { ErrorCode, createError } from "#shared/errors/errorCodes.js";

const loi = (message, status, errorCode) => createError(message, status, errorCode);

/**
 * Ghi đè các câu trả lời gửi lên vào phiên làm bài.
 *
 * Gộp theo questionId chứ không thay cả mảng: máy khách có thể gửi từng câu một khi học sinh
 * chọn, và không được xoá mất những câu đã lưu trước đó.
 */
export const saveDraftAnswers = async (attemptId, studentId, answers) => {
  if (!Array.isArray(answers)) {
    throw loi("Dữ liệu bài làm không hợp lệ!", 400, ErrorCode.VALIDATION_FAILED);
  }

  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) throw loi("Không tìm thấy phiên làm bài thi!", 404, ErrorCode.ATTEMPT_NOT_FOUND);

  if (attempt.studentId?.toString() !== studentId?.toString()) {
    throw loi("Bạn không có quyền ghi vào bài làm của người khác!", 403, ErrorCode.FORBIDDEN);
  }

  if (attempt.status !== "IN_PROGRESS") {
    throw loi("Bài thi đã kết thúc, không thể lưu thêm.", 409, ErrorCode.ATTEMPT_ALREADY_FINISHED);
  }

  const exam = await Exam.findById(attempt.examId).select("duration").lean();
  const deadline = resolveAttemptDeadline(attempt.startTime, exam?.duration);

  // Chặn ghi sau khi đã quá hạn. Không có chốt này thì học sinh vẫn tiếp tục lưu bài trong
  // khoảng thời gian giữa lúc hết giờ và lúc cron chạy — tức là được thi thêm.
  if (deadline && Date.now() > deadline.getTime() + GRACE_PERIOD_MS) {
    throw loi(
      "Đã hết giờ làm bài, hệ thống không nhận thêm câu trả lời.",
      409,
      ErrorCode.ATTEMPT_TIME_OVER
    );
  }

  const theoCauHoi = new Map(
    (attempt.answers || []).map((answer) => [answer.questionId?.toString(), answer])
  );

  for (const gui of answers) {
    if (!gui?.questionId) continue;
    const key = gui.questionId.toString();
    const cu = theoCauHoi.get(key) || {};

    theoCauHoi.set(key, {
      ...(typeof cu.toObject === "function" ? cu.toObject() : cu),
      questionId: gui.questionId,
      selectedOption: gui.selectedOption,
      essayText: gui.essayText,
      // pointsEarned giữ nguyên 0 — điểm chỉ được tính lúc chấm, không phải lúc lưu tạm.
      pointsEarned: 0,
    });
  }

  attempt.answers = Array.from(theoCauHoi.values());
  await attempt.save();

  return { saved: attempt.answers.length, deadline };
};

export default { saveDraftAnswers };
