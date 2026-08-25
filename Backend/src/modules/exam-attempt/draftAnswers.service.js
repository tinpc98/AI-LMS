// Lưu tạm bài làm của học sinh trong lúc đang thi.
//
// Cơ chế: ghi vào attempt.questions[i].answer (canonical), không phải attempt.answers[].
// answersVersion dùng làm optimistic lock để chặn conflict khi nhiều tab cùng ghi.
//
// QUAN TRỌNG: deadline dùng attempt.expiresAt (field chính thức trong model),
// không phải attempt.startTime + exam.duration.
import ExamAttempt from "./examAttempt.model.js";
import { ErrorCode, createError } from "#shared/errors/errorCodes.js";

const loi = (message, status, errorCode) => createError(message, status, errorCode);

/**
 * Lưu câu trả lời gửi lên vào phiên làm bài.
 *
 * answers[] — mảng { questionId, selectedOptionIds?, content? }
 * Gộp theo questionId: không xóa câu đã lưu, chỉ ghi đè câu được gửi lên.
 */
export const saveDraftAnswers = async (attemptId, studentId, answers, clientVersion, sessionToken) => {
  if (!Array.isArray(answers)) {
    throw loi("Dữ liệu bài làm không hợp lệ!", 400, ErrorCode.VALIDATION_FAILED);
  }

  // ────────────────────────────────────────────────────────────────
  // Bước 1: Validate quyền truy cập
  // ────────────────────────────────────────────────────────────────
  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) throw loi("Không tìm thấy phiên làm bài thi!", 404, ErrorCode.ATTEMPT_NOT_FOUND);

  if (attempt.studentId?.toString() !== studentId?.toString()) {
    throw loi("Bạn không có quyền ghi vào bài làm của người khác!", 403, ErrorCode.FORBIDDEN);
  }

  if (attempt.status !== "IN_PROGRESS") {
    throw loi("Bài thi đã kết thúc, không thể lưu thêm.", 409, ErrorCode.ATTEMPT_ALREADY_FINISHED);
  }

  if (attempt.sessionToken && sessionToken !== attempt.sessionToken) {
    throw loi("Bài thi này đang được làm ở thiết bị khác.", 403, "SESSION_MISMATCH");
  }

  // ────────────────────────────────────────────────────────────────
  // Bước 2: Kiểm tra thời hạn dùng expiresAt (field chính thức)
  // ────────────────────────────────────────────────────────────────
  const GRACE_PERIOD_MS = 2 * 60 * 1000;
  if (attempt.expiresAt && Date.now() > attempt.expiresAt.getTime() + GRACE_PERIOD_MS) {
    // Lazy auto-submit: chấm theo những gì đã lưu
    const { gradeSubmission } = await import("./examAttempt.service.js");
    await gradeSubmission(attemptId);
    throw loi(
      "Đã hết giờ làm bài. Hệ thống đã tự động thu bài của bạn dựa trên dữ liệu đã lưu.",
      409,
      ErrorCode.ATTEMPT_TIME_OVER
    );
  }

  // ────────────────────────────────────────────────────────────────
  // Bước 3: Atomic update — dùng findOneAndUpdate với answersVersion
  //         để chặn concurrent write từ nhiều tab.
  // ────────────────────────────────────────────────────────────────

  // Xây dựng $set cho từng câu trong questions[]
  const questionMap = new Map(
    attempt.questions.map((q, idx) => [q.questionId.toString(), idx])
  );

  const setOps = {};
  for (const ans of answers) {
    if (!ans?.questionId) continue;
    const idx = questionMap.get(ans.questionId.toString());
    if (idx === undefined) continue; // Câu không thuộc đề thi này

    if (ans.selectedOptionIds !== undefined) {
      setOps[`questions.${idx}.answer.selectedOptionIds`] = Array.isArray(ans.selectedOptionIds)
        ? ans.selectedOptionIds
        : [ans.selectedOptionIds];
    }
    if (ans.essayText !== undefined) {
      // essayText → lưu vào content dạng [{type:"text",text:...}]
      setOps[`questions.${idx}.answer.content`] = [{ type: "text", text: ans.essayText }];
    }
    if (ans.content !== undefined) {
      setOps[`questions.${idx}.answer.content`] = ans.content;
    }
  }

  if (Object.keys(setOps).length === 0) {
    // Không có câu hợp lệ để lưu
    return { saved: 0, deadline: attempt.expiresAt, answersVersion: attempt.answersVersion };
  }

  const filter = { _id: attemptId, status: "IN_PROGRESS" };
  if (clientVersion !== undefined && clientVersion !== null) {
    filter.answersVersion = clientVersion;
  }

  const updated = await ExamAttempt.findOneAndUpdate(
    filter,
    {
      $set: setOps,
      $inc: { answersVersion: 1 },
    },
    { new: true }
  );

  if (!updated) {
    // Version mismatch — tab khác đã ghi trước
    throw loi("Bài làm đã được cập nhật ở nơi khác. Tải lại trang để tiếp tục?", 409, "VERSION_MISMATCH");
  }

  return {
    saved: answers.length,
    deadline: updated.expiresAt,
    answersVersion: updated.answersVersion,
  };
};

export default { saveDraftAnswers };
