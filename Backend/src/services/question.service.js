import xlsx from "xlsx";
import Question from "../models/question.model.js";

const importQuestionsFromExcel = async (fileBuffer) => {
  // 1. Đọc dữ liệu từ buffer
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  if (!rawData || rawData.length === 0) {
    throw new Error("File Excel trống hoặc không đúng định dạng!");
  }

  const validQuestions = [];

  // BẪY 1: Dùng Set để nhớ các nội dung đã đọc, chống trùng lặp nội bộ trong file Excel
  const excelContentSet = new Set();

  // 2. Duyệt qua từng dòng Excel
  for (const row of rawData) {
    if (!row.content) continue; // Bỏ qua dòng trống

    const cleanContent = row.content.toString().trim();

    // -- Kiểm tra Bẫy 1 --
    if (excelContentSet.has(cleanContent)) {
      continue; // Đã gặp câu này ở dòng trên rồi -> Bỏ qua dòng này
    }
    excelContentSet.add(cleanContent); // Lưu vào bộ nhớ tạm

    // BẪY 2: Query DB xem câu này đã tồn tại trong hệ thống chưa
    const existingQ = await Question.findOne({ content: cleanContent });
    if (existingQ) {
      continue; // Trong DB đã có -> Bỏ qua không import nữa
    }

    // 3. Nếu vượt qua cả 2 bẫy, tiến hành chuẩn hóa Data để lưu
    // (Lưu ý: Tùy vào format Excel của bạn mà cấu trúc chỗ này có thể hơi khác)
    validQuestions.push({
      content: cleanContent,
      type: row.type?.toString().trim() || "MCQ",

      // BẪY AN TOÀN: Chỉ cắt chuỗi nếu cột options có dữ liệu, nếu không thì để mảng rỗng []
      options: row.options
        ? row.options
            .toString()
            .split("|")
            .map((opt) => opt.trim())
        : [],

      correctAnswer: row.correctAnswer
        ? row.correctAnswer.toString().trim()
        : "",
      difficulty: row.difficulty?.toString().trim() || "MEDIUM",
      topic: row.topic?.toString().trim(),
    });
  }

  // 4. Kiểm tra xem sau khi lọc, có còn câu nào hợp lệ để thêm không
  if (validQuestions.length === 0) {
    throw new Error(
      "Không có câu hỏi nào được thêm mới! Tất cả đều đã trùng lặp hoặc file bị lỗi.",
    );
  }

  // 5. Insert hàng loạt vào DB (nhanh hơn rất nhiều so với lưu từng câu)
  const result = await Question.insertMany(validQuestions);
  return result;
};

export default { importQuestionsFromExcel };
