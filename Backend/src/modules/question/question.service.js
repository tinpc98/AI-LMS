import xlsx from "xlsx";
import Question from "./question.model.js";
import { ValidationError } from "#shared/utils/appError.js";

/**
 * Chuẩn hoá một dòng Excel thành document Question.
 * Tách riêng để vòng lặp chính chỉ còn lo việc lọc trùng.
 */
const mapRowToQuestion = (row, cleanContent) => ({
  content: cleanContent,
  type: row.type?.toString().trim() || "MCQ",

  // BẪY AN TOÀN: Chỉ cắt chuỗi nếu cột options có dữ liệu, nếu không thì để mảng rỗng []
  options: row.options
    ? row.options
        .toString()
        .split("|")
        .map((opt) => opt.trim())
    : [],

  correctAnswer: row.correctAnswer ? row.correctAnswer.toString().trim() : "",
  difficulty: row.difficulty?.toString().trim() || "MEDIUM",
  topic: row.topic?.toString().trim(),
});

const importQuestionsFromExcel = async (fileBuffer) => {
  // 1. Đọc dữ liệu từ buffer
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  if (!rawData || rawData.length === 0) {
    throw new ValidationError("File Excel trống hoặc không đúng định dạng!");
  }

  // BẪY 1: chống trùng lặp NỘI BỘ trong chính file Excel.
  // Duyệt một lượt để gom nội dung duy nhất, giữ nguyên thứ tự xuất hiện.
  const excelContentSet = new Set();
  const candidates = [];
  for (const row of rawData) {
    if (!row.content) continue; // Bỏ qua dòng trống
    const cleanContent = row.content.toString().trim();
    if (excelContentSet.has(cleanContent)) continue; // Đã gặp ở dòng trên
    excelContentSet.add(cleanContent);
    candidates.push({ row, cleanContent });
  }

  // BẪY 2: loại những câu ĐÃ CÓ trong DB.
  //
  // SỬA N+1 (Wave 4.6 / BC 09): trước đây mỗi dòng Excel gọi một Question.findOne() riêng
  // và chờ tuần tự — file 500 dòng nghĩa là 500 lượt round-trip tới MongoDB. Nay gom thành
  // MỘT truy vấn $in duy nhất, không phụ thuộc số dòng.
  //
  // .select("content").lean() vì ở đây chỉ cần biết nội dung nào đã tồn tại, không cần
  // dựng document Mongoose đầy đủ cho từng câu.
  const existingDocs = candidates.length
    ? await Question.find({ content: { $in: candidates.map((c) => c.cleanContent) } })
        .select("content")
        .lean()
    : [];
  const existingContents = new Set(existingDocs.map((d) => d.content));

  const validQuestions = candidates
    .filter(({ cleanContent }) => !existingContents.has(cleanContent))
    .map(({ row, cleanContent }) => mapRowToQuestion(row, cleanContent));

  // 4. Kiểm tra xem sau khi lọc, có còn câu nào hợp lệ để thêm không
  if (validQuestions.length === 0) {
    throw new ValidationError(
      "Không có câu hỏi nào được thêm mới! Tất cả đều đã trùng lặp hoặc file bị lỗi."
    );
  }

  // 5. Insert hàng loạt vào DB (nhanh hơn rất nhiều so với lưu từng câu)
  const result = await Question.insertMany(validQuestions);
  return result;
};

export default { importQuestionsFromExcel };
