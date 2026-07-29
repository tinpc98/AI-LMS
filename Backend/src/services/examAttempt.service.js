import ExamAttempt from "../models/examAttempt.model.js";
import Exam from "../models/exam.model.js";
import Question from "../models/question.model.js";
import { compareAnswers } from "../utils/answerScoring.js";

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

  // 3. Tạo một Map để tra cứu nhanh số điểm phân bổ cho từng câu hỏi trong Đề thi này
  const examPointsMap = new Map(
    exam.questions.map((q) => [q.questionId.toString(), q.points]),
  );

  // 4. Lấy danh sách chi tiết các Câu hỏi từ DB
  const questionIds = exam.questions.map((q) => q.questionId);
  const dbQuestions = await Question.find({ _id: { $in: questionIds } });
  const dbQuestionsMap = new Map(dbQuestions.map((q) => [q._id.toString(), q]));

  let totalScore = 0;
  let hasEssay = false;
  const processedAnswers = [];

  // 5. Bắt đầu vòng lặp chấm điểm
  for (const ans of studentAnswers) {
    const qIdStr = ans.questionId.toString();
    const questionConfig = dbQuestionsMap.get(qIdStr);
    const allocatedPoints = examPointsMap.get(qIdStr) || 0;

    if (!questionConfig) continue;

    let pointsEarned = 0;

    if (questionConfig.type === "MCQ") {
      const isCorrect = compareAnswers(questionConfig.correctAnswer, ans.selectedOption);

      if (isCorrect) {
        pointsEarned = allocatedPoints;
        totalScore += pointsEarned;
      }

      processedAnswers.push({
        questionId: questionConfig._id,
        selectedOption: ans.selectedOption,
        pointsEarned: Number(pointsEarned.toFixed(2)),
      });
    } else if (questionConfig.type === "ESSAY") {
      hasEssay = true;
      processedAnswers.push({
        questionId: questionConfig._id,
        essayText: ans.essayText,
        pointsEarned: 0, // Tạm thời 0 điểm, đợi GV chấm
      });
    }
  }

  // 6. Cập nhật trạng thái và lưu kết quả (An toàn chống NaN)
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
