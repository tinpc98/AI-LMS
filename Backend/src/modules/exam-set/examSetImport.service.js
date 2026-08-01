import crypto from "crypto";
import * as xlsx from "xlsx";
import { Folder } from "#modules/folder";
import ExamSet from "./examSet.model.js";
import { recalculateExamSetMetrics } from "./examSet.metrics.js";

/**
 * Normalizes question type based on predefined mappings
 */
const normalizeQuestionType = (rawType) => {
  if (!rawType) return null;
  const typeStr = String(rawType).trim().toUpperCase();
  switch (typeStr) {
    case "MCQ":
    case "MULTIPLE_CHOICE":
      return "multiple_choice";
    case "TRUE_FALSE":
      return "true_false";
    case "SHORT_ANSWER":
      return "short_answer";
    case "ESSAY":
      return "essay";
    default:
      return null;
  }
};

/**
 * Normalizes difficulty
 */
const normalizeDifficulty = (rawDifficulty) => {
  if (!rawDifficulty) return "medium"; // default
  const diffStr = String(rawDifficulty).trim().toLowerCase();
  if (["easy", "medium", "hard"].includes(diffStr)) {
    return diffStr;
  }
  return "medium";
};

/**
 * Generate options and find correct answer
 */
const parseOptionsAndCorrectAnswer = (rawOptions, rawCorrectAnswer, type, rowNum) => {
  let options = [];
  let finalCorrectAnswer = "";

  if (type === "multiple_choice") {
    if (!rawOptions) {
      throw new Error(
        `Dòng ${rowNum}: Câu hỏi trắc nghiệm (multiple_choice) bắt buộc phải có options`
      );
    }
    const optionTexts = String(rawOptions)
      .split("|")
      .map((s) => s.trim())
      .filter((s) => s);
    if (optionTexts.length < 2) {
      throw new Error(`Dòng ${rowNum}: Câu hỏi trắc nghiệm phải có ít nhất 2 options`);
    }

    if (!rawCorrectAnswer && rawCorrectAnswer !== 0) {
      throw new Error(`Dòng ${rowNum}: Câu hỏi trắc nghiệm bắt buộc phải có correctAnswer`);
    }

    // Find matching correct answer
    // In our system, rawCorrectAnswer might be 1-based index (1, 2, 3) or text matching
    const caStr = String(rawCorrectAnswer).trim();
    let correctId = null;

    options = optionTexts.map((text, idx) => {
      const id = `option_${idx + 1}`;

      // Match by index or text
      let isCorrect = false;
      if (caStr === String(idx + 1) || caStr.toLowerCase() === text.toLowerCase()) {
        isCorrect = true;
        correctId = id;
      }

      return { id, text, isCorrect };
    });

    if (!correctId) {
      throw new Error(
        `Dòng ${rowNum}: Đáp án đúng (correctAnswer: ${caStr}) không khớp với bất kỳ option nào trong danh sách`
      );
    }
    finalCorrectAnswer = correctId;
  } else if (type === "true_false") {
    if (!rawOptions) {
      // Default T/F options if not provided
      options = [
        { id: "option_1", text: "Đúng", isCorrect: false },
        { id: "option_2", text: "Sai", isCorrect: false },
      ];
    } else {
      const optionTexts = String(rawOptions)
        .split("|")
        .map((s) => s.trim())
        .filter((s) => s);
      if (optionTexts.length !== 2) {
        throw new Error(`Dòng ${rowNum}: Câu hỏi đúng/sai (true_false) phải có đúng 2 options`);
      }
      options = optionTexts.map((text, idx) => ({
        id: `option_${idx + 1}`,
        text,
        isCorrect: false,
      }));
    }

    if (!rawCorrectAnswer && rawCorrectAnswer !== 0) {
      throw new Error(`Dòng ${rowNum}: Câu hỏi đúng/sai bắt buộc phải có correctAnswer`);
    }

    const caStr = String(rawCorrectAnswer).trim();
    let correctId = null;
    options.forEach((opt, idx) => {
      // Assuming true_false might use 1/2 or text matching
      if (caStr === String(idx + 1) || caStr.toLowerCase() === opt.text.toLowerCase()) {
        opt.isCorrect = true;
        correctId = opt.id;
      }
    });

    if (!correctId) {
      throw new Error(`Dòng ${rowNum}: Đáp án đúng không hợp lệ cho câu hỏi true_false`);
    }
    finalCorrectAnswer = correctId;
  } else if (type === "short_answer") {
    // short answer does not strictly need options, but correctAnswer acts as accepted text
    if (!rawCorrectAnswer && rawCorrectAnswer !== 0) {
      throw new Error(
        `Dòng ${rowNum}: Câu hỏi điền khuyết (short_answer) bắt buộc phải có correctAnswer`
      );
    }
    finalCorrectAnswer = String(rawCorrectAnswer).trim();
  }

  return { options, correctAnswer: finalCorrectAnswer };
};

const normalizeContentKey = (value) =>
  String(value).trim().toLowerCase().replace(/\s+/g, " ").normalize("NFC");

import mongoose from "mongoose";
import * as examSetRepo from "./examSet.repository.js";

export const importExcelToExamSet = async ({
  fileBuffer,
  ownerId,
  folderId,
  title,
  description,
}) => {
  if (!fileBuffer) {
    const err = new Error("Thiếu file Excel");
    err.statusCode = 400;
    throw err;
  }
  const normalizedTitle = typeof title === "string" ? title.trim() : "";
  const normalizedDescription = typeof description === "string" ? description.trim() : "";

  if (!normalizedTitle) {
    const err = new Error("Thiếu tiêu đề bộ đề");
    err.statusCode = 400;
    throw err;
  }

  if (normalizedTitle.length > 255) {
    const err = new Error("Tiêu đề vượt quá 255 ký tự");
    err.statusCode = 422;
    throw err;
  }

  if (normalizedDescription.length > 2000) {
    const err = new Error("Mô tả vượt quá 2000 ký tự");
    err.statusCode = 422;
    throw err;
  }

  // folderId validation
  const normalizedFolderId = typeof folderId === "string" ? folderId.trim() : folderId;

  if (!normalizedFolderId) {
    const error = new Error("Thiếu folderId");
    error.statusCode = 400;
    throw error;
  }

  if (!mongoose.Types.ObjectId.isValid(normalizedFolderId)) {
    const error = new Error("folderId không hợp lệ");
    error.statusCode = 400;
    throw error;
  }

  // Query folder
  const folder = await examSetRepo.findActiveFolder(normalizedFolderId);
  if (!folder) {
    const folderErr = new Error("Folder không tồn tại");
    folderErr.statusCode = 404;
    throw folderErr;
  }
  if (String(folder.ownerId) !== String(ownerId)) {
    const authErr = new Error("Không có quyền truy cập Folder");
    authErr.statusCode = 403;
    throw authErr;
  }

  // 2. Đọc file Excel
  let workbook;
  try {
    workbook = xlsx.read(fileBuffer, { type: "buffer" });
  } catch (error) {
    const err = new Error("File không đúng định dạng Excel");
    err.statusCode = 415;
    throw err;
  }

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    const err = new Error("File Excel không có dữ liệu");
    err.statusCode = 400;
    throw err;
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = xlsx.utils.sheet_to_json(worksheet, { defval: "" });

  if (rows.length === 0) {
    const err = new Error("Sheet đầu tiên trong file Excel đang trống");
    err.statusCode = 400;
    throw err;
  }

  // 3. Chuẩn hóa & loại bỏ trùng lặp
  const questions = [];
  const seenContent = new Set();
  let orderCounter = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +1 for 0-index, +1 for header row

    const content = String(row.content || "").trim();
    if (!content) {
      const err = new Error(`Dòng ${rowNum}: Thiếu nội dung câu hỏi (content)`);
      err.statusCode = 422;
      throw err;
    }

    // Deduplication based on lowercase content
    const contentKey = normalizeContentKey(content);
    if (seenContent.has(contentKey)) {
      continue; // Bỏ qua câu trùng lặp trong cùng file
    }
    seenContent.add(contentKey);

    const type = normalizeQuestionType(row.type);
    if (!type) {
      const err = new Error(`Dòng ${rowNum}: Loại câu hỏi (type) không hợp lệ`);
      err.statusCode = 422;
      throw err;
    }

    let parsedOptions, parsedCorrectAnswer;
    try {
      const parsed = parseOptionsAndCorrectAnswer(row.options, row.correctAnswer, type, rowNum);
      parsedOptions = parsed.options;
      parsedCorrectAnswer = parsed.correctAnswer;
    } catch (e) {
      e.statusCode = 422;
      throw e;
    }

    const rawPoints = String(row.points ?? "").trim();
    let points = 1;
    if (rawPoints !== "") {
      points = Number(rawPoints);
      if (!Number.isFinite(points) || points < 0) {
        const error = new Error(`Dòng ${rowNum}: Điểm số không hợp lệ`);
        error.statusCode = 422;
        throw error;
      }
    }

    const tagsRaw = String(row.tags || "");
    const tags = tagsRaw
      ? tagsRaw
          .split("|")
          .map((t) => t.trim())
          .filter((t) => t)
      : [];

    const newQuestion = {
      questionId: crypto.randomUUID(),
      order: orderCounter++,
      type,
      content,
      points,
      difficulty: normalizeDifficulty(row.difficulty),
      options: parsedOptions,
      correctAnswer: parsedCorrectAnswer,
      explanation: String(row.explanation || "").trim(),
      suggestedAnswer: String(row.suggestedAnswer || "").trim(),
      category: String(row.topic || "").trim(),
      tags,
      isActive: true,
    };

    questions.push(newQuestion);
  }

  if (questions.length === 0) {
    const err = new Error("Không có câu hỏi nào hợp lệ để tạo bộ đề");
    err.statusCode = 400;
    throw err;
  }

  if (questions.length > 500) {
    const err = new Error("Vượt quá giới hạn 500 câu hỏi trong một lần import");
    err.statusCode = 422;
    throw err;
  }

  // 4. Khởi tạo ExamSet
  const examSet = new ExamSet({
    ownerId,
    folderId: normalizedFolderId,
    title: normalizedTitle,
    description: normalizedDescription,
    status: "draft",
    questions,
    version: 1,
    versionNumber: 1,
    isLatestVersion: true,
  });

  // Tính điểm & số câu hỏi
  recalculateExamSetMetrics(examSet);

  // 5. Lưu vào Database
  await examSet.save();

  return examSet;
};
