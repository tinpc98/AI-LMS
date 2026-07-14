import ExamAttempt from "../models/examAttempt.model.js";
import Exam from "../models/exam.model.js";
import Question from "../models/question.model.js";

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
  const gracePeriod = 2; // Cho phép 2 phút bù giờ do độ trễ mạng mạng

  if (timeElapsed > exam.duration + gracePeriod) {
    // Nếu quá hạn, bạn có thể chọn từ chối hoặc vẫn cho nộp nhưng đánh dấu bài làm
    // Ở đây ta vẫn cho nộp nhưng ghi nhận kết thúc đúng thời hạn tối đa
    attempt.endTime = new Date(
      attempt.startTime.getTime() + exam.duration * 60000,
    );
  } else {
    attempt.endTime = now;
  }

  // 3. Tạo một Map để tra cứu nhanh số điểm phân bổ cho từng câu hỏi trong Đề thi này
  // Cấu trúc map: { "questionId_abc": 0.27, "questionId_xyz": 3.0 }
  const examPointsMap = new Map(
    exam.questions.map((q) => [q.questionId.toString(), q.points]),
  );

  // 4. Lấy danh sách chi tiết các Câu hỏi từ DB để xem đáp án đúng (correctAnswer) và loại câu hỏi (type)
  const questionIds = exam.questions.map((q) => q.questionId);
  const dbQuestions = await Question.find({ _id: { $in: questionIds } });

  // Tạo Map để tra cứu nhanh thông tin câu hỏi chuẩn từ DB
  const dbQuestionsMap = new Map(dbQuestions.map((q) => [q._id.toString(), q]));

  let totalScore = 0;
  let hasEssay = false;
  const processedAnswers = [];

  // 5. Bắt đầu vòng lặp chấm điểm
  for (const ans of studentAnswers) {
    const qIdStr = ans.questionId.toString();
    const questionConfig = dbQuestionsMap.get(qIdStr);
    const allocatedPoints = examPointsMap.get(qIdStr) || 0;

    if (!questionConfig) continue; // Bỏ qua nếu câu hỏi không nằm trong đề

    let pointsEarned = 0;

    if (questionConfig.type === "MCQ") {
      // Chấm trắc nghiệm: So khớp đáp án
      const isCorrect =
        questionConfig.correctAnswer.trim() === ans.selectedOption?.trim();
      if (isCorrect) {
        pointsEarned = allocatedPoints;
        totalScore += pointsEarned;
      }

      processedAnswers.push({
        questionId: questionConfig._id,
        selectedOption: ans.selectedOption,
        pointsEarned: pointsEarned,
      });
    } else if (questionConfig.type === "ESSAY") {
      // Tự luận: Tạm thời cho 0 điểm, đợi Giáo viên chấm tay
      hasEssay = true;
      processedAnswers.push({
        questionId: questionConfig._id,
        essayText: ans.essayText,
        pointsEarned: 0, // Sẽ được cập nhật sau bởi GV
      });
    }
  }

  // 6. Cập nhật trạng thái và lưu kết quả (Làm tròn 2 chữ số thập phân an toàn)
  attempt.answers = processedAnswers;
  attempt.totalScore = Number(totalScore.toFixed(2));
  attempt.status = hasEssay ? "PARTIALLY_GRADED" : "GRADED";

  await attempt.save();
  return attempt;
};
// Hàm xử lý logic cộng điểm tự luận
const gradeEssay = async (attemptId, essayGrades) => {
  const attempt = await ExamAttempt.findById(attemptId);
  if (!attempt) throw new Error("Không tìm thấy phiên làm bài thi này!");
  if (attempt.status === "GRADED")
    throw new Error("Bài thi này đã được chấm xong toàn bộ!");

  let additionalScore = 0;

  // Lặp qua mảng điểm giáo viên gửi lên
  essayGrades.forEach((grade) => {
    // Tìm đúng câu trả lời của câu tự luận đó trong bài làm
    const answerIndex = attempt.answers.findIndex(
      (ans) => ans.questionId.toString() === grade.questionId.toString(),
    );

    if (answerIndex !== -1) {
      // Cập nhật điểm cho câu đó
      attempt.answers[answerIndex].pointsEarned = grade.pointsAwarded;
      additionalScore += grade.pointsAwarded;
    }
  });

  // Cộng dồn điểm tự luận vào tổng điểm (Làm tròn 2 chữ số thập phân)
  attempt.totalScore = Number(
    (attempt.totalScore + additionalScore).toFixed(2),
  );

  // Đổi trạng thái thành GRADED (Đã chấm xong)
  attempt.status = "GRADED";

  await attempt.save();
  return attempt;
};

export default { gradeSubmission, gradeEssay };
