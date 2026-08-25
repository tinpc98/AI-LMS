import xlsx from "xlsx";
import Question from "./question.model.js";
import { ValidationError } from "#shared/utils/appError.js";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

/**
 * Chuẩn hoá một dòng Excel thành document Question.
 * Chuyển đổi thành cấu trúc ContentBlock mới.
 */
const mapRowToQuestion = (row, cleanContent, defaultTopicId) => {
  const type = row.type?.toString().trim().toUpperCase() || "MCQ";
  
  // Xử lý options thành OptionSchema
  const rawOptions = row.options ? row.options.toString().split("|").map(opt => opt.trim()) : [];
  const correctAnswerText = row.correctAnswer ? row.correctAnswer.toString().trim() : "";
  
  const options = rawOptions.map((optText, index) => ({
    id: uuidv4(),
    order: index,
    isCorrect: optText === correctAnswerText,
    content: [
      {
        id: uuidv4(),
        type: "TEXT",
        order: 0,
        text: optText,
      }
    ]
  }));

  // Xử lý content thành ContentBlock
  const contentBlocks = [
    {
      id: uuidv4(),
      type: "TEXT",
      order: 0,
      text: cleanContent,
    }
  ];

  return {
    topicId: defaultTopicId,
    content: contentBlocks,
    type: type === "MULTIPLE_CHOICE" ? "MCQ" : type,
    selectionMode: type === "MCQ" || type === "MULTIPLE_CHOICE" ? "SINGLE" : undefined,
    options: options,
    difficulty: row.difficulty?.toString().trim().toUpperCase() || "MEDIUM",
  };
};

const importQuestionsFromExcel = async (fileBuffer) => {
  const workbook = xlsx.read(fileBuffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const rawData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

  if (!rawData || rawData.length === 0) {
    throw new ValidationError("File Excel trống hoặc không đúng định dạng!");
  }

  // TÌM Default Topic để gán vào các câu hỏi import từ Excel
  const db = mongoose.connection.db;
  const topicsCol = db.collection("topics");
  let defaultTopicId = null;
  const existingTopic = await topicsCol.findOne({ name: "Legacy Topic (Migrated)" });
  if (existingTopic) {
    defaultTopicId = existingTopic._id;
  } else {
    defaultTopicId = new mongoose.Types.ObjectId(); // Fallback if no topic exists
  }

  const excelContentSet = new Set();
  const candidates = [];
  for (const row of rawData) {
    if (!row.content) continue; 
    const cleanContent = row.content.toString().trim();
    if (excelContentSet.has(cleanContent)) continue;
    excelContentSet.add(cleanContent);
    candidates.push({ row, cleanContent });
  }

  // Tìm những câu hỏi có block TEXT nội dung trùng khớp
  // Không dễ map 1-1 với cấu trúc ContentBlock, nên query sẽ phải dùng $elemMatch
  const existingDocs = candidates.length
    ? await Question.find({
        content: {
          $elemMatch: { type: "TEXT", text: { $in: candidates.map(c => c.cleanContent) } }
        }
      })
      .lean()
    : [];
    
  const existingContents = new Set();
  for (const doc of existingDocs) {
    const textBlock = doc.content.find(b => b.type === "TEXT");
    if (textBlock && textBlock.text) existingContents.add(textBlock.text);
  }

  const validQuestions = candidates
    .filter(({ cleanContent }) => !existingContents.has(cleanContent))
    .map(({ row, cleanContent }) => mapRowToQuestion(row, cleanContent, defaultTopicId));

  if (validQuestions.length === 0) {
    throw new ValidationError(
      "Không có câu hỏi nào được thêm mới! Tất cả đều đã trùng lặp hoặc file bị lỗi."
    );
  }

  const result = await Question.insertMany(validQuestions);
  return result;
};

export default { importQuestionsFromExcel };
