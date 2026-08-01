import mongoose from "mongoose";
import { evaluateLateness } from "./attemptDeadline.js";
import ExamAttempt from "./examAttempt.model.js";
import { Exam } from "#modules/exam";
import { Question } from "#modules/question";
import { compareAnswers } from "./answerScoring.js";
import { checkClassTeacherOwnership } from "#modules/class";

const gradeSubmission = async (attemptId, studentAnswers) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // 1. Tìm phiên làm bài và populate thông tin Đề thi để lấy cấu trúc điểm số
    const attempt = await ExamAttempt.findById(attemptId).populate("examId").session(session);
    if (!attempt) {
      throw new Error("Không tìm thấy phiên làm bài thi này!");
    }
    if (attempt.status !== "IN_PROGRESS") {
      throw new Error("Bài thi này đã được nộp hoặc đã chốt điểm trước đó!");
    }

    const exam = attempt.examId;

    // 2. Kiểm tra thời gian làm bài.
    //
    // Bản cũ chỉ kẹp lại endTime khi vượt hạn rồi chấm bình thường — bài nộp muộn đi qua hệ
    // thống không để lại dấu vết nào. Nay vẫn CHẤP NHẬN bài nộp (từ chối là quyết định về
    // chính sách thi cử, không phải quyết định của mã), nhưng GHI LẠI sự việc để giáo viên
    // nhìn thấy và tự xử lý.
    const now = new Date();
    const lateness = evaluateLateness(attempt.startTime, exam.duration, now);

    attempt.isLate = lateness.isLate;
    attempt.lateBySeconds = lateness.lateBySeconds;
    // Quá hạn thì ghi nhận mốc kết thúc là hạn nộp, không phải lúc bấm nộp — để thời gian làm
    // bài trong báo cáo phản ánh khoảng được phép, còn phần vượt nằm ở lateBySeconds.
    attempt.endTime = lateness.isLate ? lateness.deadline : now;

    // 3. Tạo một Map để tra cứu nhanh số điểm phân bổ cho từng câu hỏi trong Đề thi này
    const examPointsMap = new Map(exam.questions.map((q) => [q.questionId.toString(), q.points]));

    // 4. Lấy danh sách chi tiết các Câu hỏi từ DB
    const questionIds = exam.questions.map((q) => q.questionId);
    const dbQuestions = await Question.find({ _id: { $in: questionIds } })
      .session(session)
      .lean();
    const dbQuestionsMap = new Map(dbQuestions.map((q) => [q._id.toString(), q]));

    let totalScore = 0;
    let hasEssay = false;
    const processedAnswers = [];

    // 5. Bắt đầu vòng lặp chấm điểm
    for (const ans of studentAnswers) {
      if (!ans?.questionId) continue;
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

    await attempt.save({ session });
    await session.commitTransaction();
    session.endSession();
    return attempt;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

// ==========================================
// HÀM CHẤM TỰ LUẬN ĐÃ ĐƯỢC VÁ LỖI AN TOÀN
// ==========================================
const gradeEssay = async (attemptId, essayGrades, userId, userRole) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const attempt = await ExamAttempt.findById(attemptId).populate("examId").session(session);
    if (!attempt) throw new Error("Không tìm thấy phiên làm bài thi này!");

    // Lấy danh sách phân bổ điểm tối đa từ đề thi để đối chiếu chống gian lận
    const exam = attempt.examId;

    const isAuthorized = await checkClassTeacherOwnership(exam.classId, userId, userRole);
    if (!isAuthorized) {
      const error = new Error("Bạn không có quyền chấm điểm bài thi của lớp học này!");
      error.status = 403;
      throw error;
    }

    const examPointsMap = new Map(exam.questions.map((q) => [q.questionId.toString(), q.points]));

    // Lặp qua mảng điểm giáo viên gửi lên và cập nhật trực tiếp vào câu trả lời
    for (const grade of essayGrades) {
      if (!grade?.questionId) continue;
      const qIdStr = grade.questionId.toString();
      const answerIndex = attempt.answers.findIndex((ans) => ans.questionId.toString() === qIdStr);

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

    await attempt.save({ session });
    await session.commitTransaction();
    session.endSession();
    return attempt;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export default { gradeSubmission, gradeEssay };
