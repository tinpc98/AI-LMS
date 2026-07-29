import ExamAttempt from "../models/examAttempt.model.js";
import Exam from "../models/exam.model.js";
import Question from "../models/question.model.js";
import { resolveExamQuestions } from "../utils/examQuestionResolver.js";
import { AIError, AIErrorCode } from "../utils/aiError.js";

const gradeSubmission = async (attemptId, studentAnswers, authenticatedStudentId) => {
  // 1. Tìm phiên làm bài và populate thông tin Đề thi để lấy cấu trúc điểm số
  const attempt = await ExamAttempt.findById(attemptId).populate("examId");
  if (!attempt) {
    throw new AIError("Không tìm thấy phiên làm bài thi này!", AIErrorCode.AI_INVALID_INPUT, 404);
  }

  // Chống IDOR: Chỉ học sinh sở hữu phiên làm bài mới được nộp
  if (attempt.studentId.toString() !== authenticatedStudentId) {
    throw new AIError("Bạn không có quyền nộp bài thi này!", AIErrorCode.AI_FEATURE_DISABLED, 404);
  }

  if (attempt.status !== "IN_PROGRESS") {
    throw new AIError("Bài thi này đã được nộp hoặc đã chốt điểm trước đó!", AIErrorCode.AI_INVALID_INPUT, 409);
  }

  const exam = attempt.examId;

  // 2. Kiểm tra thời gian (Senior Tip: Chống gian lận kéo dài thời gian)
  const now = new Date();
  const timeElapsed = (now - new Date(attempt.startTime)) / 1000 / 60; // Đổi ra phút
  const gracePeriod = 2; // Cho phép 2 phút bù giờ do độ trễ mạng

  if (timeElapsed > exam.duration + gracePeriod) {
    attempt.endTime = new Date(
      attempt.startTime.getTime() + exam.duration * 60000,
    );
  } else {
    attempt.endTime = now;
  }

  // 3. Sử dụng resolver để lấy cấu hình câu hỏi (hỗ trợ cả Snapshot và Legacy)
  const questionMap = await resolveExamQuestions(exam);

  let totalScore = 0;
  let hasEssay = false;
  const processedAnswers = [];
  const processedQuestionIds = new Set(); // Chống duplicate answers

  // 4. Bắt đầu vòng lặp chấm điểm
  for (const ans of studentAnswers) {
    if (!ans || !ans.questionId) {
      throw new AIError("Payload bài làm thiếu questionId", AIErrorCode.AI_INVALID_INPUT, 422);
    }
    const qIdStr = ans.questionId.toString();
    
    // Ngăn duplicate answers
    if (processedQuestionIds.has(qIdStr)) {
      throw new AIError(`Câu hỏi ${qIdStr} bị gửi trùng lặp trong bài làm!`, AIErrorCode.AI_INVALID_INPUT, 422);
    }

    const questionConfig = questionMap.get(qIdStr);
    
    // Ngăn ID lạ không thuộc đề thi
    if (!questionConfig) {
      throw new AIError(`Câu hỏi ${qIdStr} không thuộc đề thi này!`, AIErrorCode.AI_INVALID_INPUT, 400);
    }
    
    processedQuestionIds.add(qIdStr);

    const allocatedPoints = questionConfig.points || 0;
    const qType = questionConfig.type?.toLowerCase();

    let pointsEarned = 0;

    if (qType === "mcq" || qType === "multiple_choice" || qType === "true_false") {
      if (ans.selectedOption !== undefined && typeof ans.selectedOption !== "string") {
        throw new AIError(`Định dạng selectedOption của câu hỏi ${qIdStr} không hợp lệ`, AIErrorCode.AI_INVALID_INPUT, 422);
      }
      const correctAnswer = String(questionConfig.correctAnswer || "").trim();
      const studentAnswer = String(ans.selectedOption || "").trim();

      const isCorrect = correctAnswer === studentAnswer && studentAnswer !== "";

      if (isCorrect) {
        pointsEarned = allocatedPoints;
        totalScore += pointsEarned;
      }

      processedAnswers.push({
        questionId: questionConfig.questionId,
        questionSource: questionConfig.source,
        selectedOption: studentAnswer,
        pointsEarned: Number(pointsEarned.toFixed(2)),
      });
    } else if (qType === "essay" || qType === "short_answer") {
      if (ans.essayText !== undefined && typeof ans.essayText !== "string") {
        throw new AIError(`Định dạng essayText của câu hỏi ${qIdStr} không hợp lệ`, AIErrorCode.AI_INVALID_INPUT, 422);
      }
      
      const text = ans.essayText || "";
      if (text.length > 50000) {
        throw new AIError(`Nội dung tự luận của câu hỏi ${qIdStr} quá dài`, AIErrorCode.AI_INVALID_INPUT, 422);
      }

      hasEssay = true;
      processedAnswers.push({
        questionId: questionConfig.questionId,
        questionSource: questionConfig.source,
        essayText: text.trim(),
        pointsEarned: 0, // Tạm thời 0 điểm, đợi GV chấm
      });
    } else {
      throw new AIError(`Loại câu hỏi ${qType} không được hỗ trợ`, AIErrorCode.AI_INVALID_INPUT, 400);
    }
  }

  if (processedAnswers.length === 0) {
    throw new AIError("Không có câu trả lời nào hợp lệ thuộc bài thi này!", AIErrorCode.AI_INVALID_INPUT, 422);
  }

  // 5. Cập nhật trạng thái và lưu kết quả (An toàn chống NaN)
  attempt.answers = processedAnswers;
  attempt.totalScore = Number(totalScore.toFixed(2));
  attempt.status = hasEssay ? "PARTIALLY_GRADED" : "GRADED";

  await attempt.save();
  return attempt;
};

// ==========================================
// HÀM CHẤM TỰ LUẬN ĐÃ ĐƯỢC VÁ LỖI AN TOÀN
// ==========================================
const gradeEssay = async (attemptId, essayGrades) => {
  const attempt = await ExamAttempt.findById(attemptId).populate("examId");
  if (!attempt) throw new Error("Không tìm thấy phiên làm bài thi này!");

  // Lấy danh sách phân bổ điểm tối đa từ đề thi để đối chiếu chống gian lận
  const exam = attempt.examId;
  const examPointsMap = new Map(
    exam.questions.map((q) => [q.questionId.toString(), q.points]),
  );

  // Lặp qua mảng điểm giáo viên gửi lên và cập nhật trực tiếp vào câu trả lời
  for (const grade of essayGrades) {
    const qIdStr = grade.questionId.toString();
    const answerIndex = attempt.answers.findIndex(
      (ans) => ans.questionId.toString() === qIdStr,
    );

    if (answerIndex !== -1) {
      // Ép kiểu an toàn, chống giá trị NaN / undefined
      let points = Number(grade.pointsEarned ?? grade.pointsAwarded);
      if (isNaN(points)) points = 0;

      // [BẢO MẬT] Không cho phép giáo viên chấm vượt quá số điểm tối đa của câu hỏi trong đề
      const maxAllowed = examPointsMap.get(qIdStr) || 10;
      if (points > maxAllowed) {
        points = maxAllowed;
      }

      attempt.answers[answerIndex].pointsEarned = points;
    }
  }

  // TÍNH LẠI TOÀN BỘ TỔNG ĐIỂM (Tự động cộng dồn từ tất cả các câu MCQ + ESSAY)
  // Cách này tuyệt đối an toàn, dù bấm phê duyệt 10 lần điểm cũng không bị nhân đôi
  let recalculatedTotal = 0;
  for (const ans of attempt.answers) {
    const p = Number(ans.pointsEarned);
    if (!isNaN(p)) {
      recalculatedTotal += p;
    }
  }

  attempt.totalScore = Number(recalculatedTotal.toFixed(2));
  
  // Xác định xem tất cả các câu hỏi tự luận đã được chấm chưa
  const totalEssays = attempt.answers.filter(a => a.essayText !== undefined).length;
  const gradedEssays = essayGrades.length; // Thường thì FE sẽ gửi đủ số câu đã chấm
  
  // Hoặc an toàn hơn, duyệt qua tất cả câu trả lời tự luận, nếu chưa có điểm thì vẫn PARTIALLY_GRADED
  // Do không phân biệt được 0 điểm thật và 0 điểm mặc định, ta chỉ dựa vào số lượng truyền lên
  if (gradedEssays >= totalEssays && totalEssays > 0) {
    attempt.status = "GRADED";
  } else if (totalEssays === 0) {
    attempt.status = "GRADED";
  } else {
    attempt.status = "PARTIALLY_GRADED";
  }

  await attempt.save();
  return attempt;
};

export default { gradeSubmission, gradeEssay };
