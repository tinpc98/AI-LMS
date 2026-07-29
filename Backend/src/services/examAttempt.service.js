import ExamAttempt from "../models/examAttempt.model.js";
import Exam from "../models/exam.model.js";
import Question from "../models/question.model.js";
import { resolveExamQuestions } from "../utils/examQuestionResolver.js";

const gradeSubmission = async (attemptId, studentAnswers) => {
  // 1. Tìm phiên làm bài và populate thông tin Đề thi để lấy cấu trúc điểm số
  const attempt = await ExamAttempt.findById(attemptId).populate("examId");
  if (!attempt) {
    throw new Error("Không tìm thấy phiên làm bài thi này!");
  }
  if (attempt.status !== "IN_PROGRESS") {
    throw new Error("Bài thi này đã được nộp hoặc đã chốt điểm trước đó!");
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
    if (!ans || !ans.questionId) continue;
    const qIdStr = ans.questionId.toString();
    
    // Ngăn duplicate answers
    if (processedQuestionIds.has(qIdStr)) {
      continue;
    }

    const questionConfig = questionMap.get(qIdStr);
    
    // Ngăn ID lạ không thuộc đề thi
    if (!questionConfig) continue;
    
    processedQuestionIds.add(qIdStr);

    const allocatedPoints = questionConfig.points || 0;
    const qType = questionConfig.type?.toLowerCase();

    let pointsEarned = 0;

    if (qType === "mcq" || qType === "multiple_choice" || qType === "true_false") {
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
        selectedOption: ans.selectedOption,
        pointsEarned: Number(pointsEarned.toFixed(2)),
      });
    } else if (qType === "essay" || qType === "short_answer") {
      hasEssay = true;
      processedAnswers.push({
        questionId: questionConfig.questionId,
        questionSource: questionConfig.source,
        essayText: ans.essayText,
        pointsEarned: 0, // Tạm thời 0 điểm, đợi GV chấm
      });
    }
  }

  if (processedAnswers.length === 0) {
    // Tránh việc array rỗng khi truyền dữ liệu bậy bạ
    throw new Error("Không có câu trả lời nào hợp lệ thuộc bài thi này!");
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
  attempt.status = "GRADED"; // Đã chấm xong toàn bộ

  await attempt.save();
  return attempt;
};

export default { gradeSubmission, gradeEssay };
