import Question from "../../models/question.model.js";
import Exam from "./exam.model.js";

// Hàm helper ẩn (Private function) để chia điểm an toàn
const distributePoints = (questions, totalPoints) => {
  if (!questions || questions.length === 0) return [];

  const count = questions.length;
  // Cắt lấy 2 số thập phân (VD: 4/15 = 0.26)
  const basePoint = Math.floor((totalPoints / count) * 100) / 100;
  // Dồn phần dư cho câu cuối
  const remainder = totalPoints - basePoint * (count - 1);

  return questions.map((q, index) => ({
    questionId: q._id,
    points: index === count - 1 ? Number(remainder.toFixed(2)) : basePoint,
  }));
};

// Hàm nghiệp vụ chính
const generateExamWithMatrix = async (params) => {
  const {
    title,
    duration,
    topic,
    startTime,
    classId,
    mcqCount,
    mcqPoints,
    essayCount,
    essayPoints,
  } = params;
  let finalQuestions = [];

  // Xử lý bốc câu hỏi trắc nghiệm
  if (mcqCount > 0 && mcqPoints > 0) {
    const mcqs = await Question.aggregate([
      { $match: { type: "MCQ", topic: topic } },
      { $sample: { size: mcqCount } },
    ]);
    // Bẫy lỗi thực chiến: Ngân hàng không đủ câu hỏi
    if (mcqs.length < mcqCount) {
      throw new Error(
        `Kho dữ liệu chỉ còn ${mcqs.length} câu trắc nghiệm cho chủ đề này, không đủ ${mcqCount} câu yêu cầu.`
      );
    }
    const mcqsWithPoints = distributePoints(mcqs, mcqPoints);
    finalQuestions = [...finalQuestions, ...mcqsWithPoints];
  }
  // Xử lý bốc câu hỏi Tự luận
  if (essayCount > 0 && essayPoints > 0) {
    const essays = await Question.aggregate([
      { $match: { type: "ESSAY", topic: topic } },
      { $sample: { size: essayCount } },
    ]);

    if (essays.length < essayCount) {
      throw new Error(
        `Kho dữ liệu chỉ còn ${essays.length} câu tự luận cho chủ đề này, không đủ ${essayCount} câu yêu cầu.`
      );
    }

    const essaysWithPoints = distributePoints(essays, essayPoints);
    finalQuestions = [...finalQuestions, ...essaysWithPoints];
  }
  // Tạo Đề thi mới và lưu vào DB
  // Hook pre-save bên file Exam.js sẽ tự động check tổng = 10 ở bước này
  const newExam = new Exam({
    title,
    duration,
    startTime,
    topic,
    classId,
    questions: finalQuestions,
    mcqCount,
    mcqPoints,
    essayCount,
    essayPoints,
    status: "DRAFT",
  });

  await newExam.save();
  return newExam;
};
export default { generateExamWithMatrix };
