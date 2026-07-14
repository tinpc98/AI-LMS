import XLSX from "xlsx";
import Question from "../models/question.model.js";

const importQuestionsFromExcel = async (fileBuffer) => {
  // 1. Đọc file Excel từ Buffer trong bộ nhớ
  const workbook = XLSX.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0]; // Mặc định lấy Sheet đầu tiên
  const worksheet = workbook.Sheets[sheetName];

  // 2. Chuyển đổi dữ liệu bảng thành mảng JSON [{ content: '...', type: '...' }]
  const rawRows = XLSX.utils.sheet_to_json(worksheet);

  if (rawRows.length === 0) {
    throw new Error(
      "File Excel không có dữ liệu hoặc không đúng định dạng mẫu!",
    );
  }

  // 3. Chuẩn hóa dữ liệu để khớp với MongoDB Schema
  const formattedQuestions = rawRows.map((row, index) => {
    // Bẫy lỗi validate cơ bản
    if (!row.content || !row.type || !row.topic) {
      throw new Error(
        `Dòng số ${index + 2} trong file thiếu thông tin bắt buộc (Nội dung, Loại câu hỏi, hoặc Chủ đề).`,
      );
    }

    // Xử lý cắt chuỗi options phân tách bằng dấu '|' thành mảng []
    let parsedOptions = [];
    if (row.options && typeof row.options === "string") {
      parsedOptions = row.options.split("|").map((opt) => opt.trim());
    }

    return {
      content: row.content.toString().trim(),
      type: row.type.toString().toUpperCase().trim(), // Đảm bảo luôn là MCQ hoặc ESSAY
      options: parsedOptions,
      correctAnswer: row.correctAnswer
        ? row.correctAnswer.toString().trim()
        : undefined,
      difficulty: row.difficulty
        ? row.difficulty.toString().toUpperCase().trim()
        : "MEDIUM",
      topic: row.topic.toString().trim(),
    };
  });

  // 4. Dùng insertMany để bulk-insert toàn bộ mảng vào DB trong 1 request (tối ưu hiệu năng)
  const result = await Question.insertMany(formattedQuestions);
  return result;
};

export default { importQuestionsFromExcel };
