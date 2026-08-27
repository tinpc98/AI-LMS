// ĐÃ CHẠY 2026-08-27 trên cluster Atlas dev — 209/209 migrate thành công, đã đối chiếu điểm với
// backup. KHÔNG chạy lại — mọi ExamAttempt active giờ đã ở shape mới, filter `answers exists`
// sẽ không còn khớp gì nên chạy lại vô hại nhưng vô nghĩa (0 bản ghi xử lý).
//
// Migrate 209 ExamAttempt active còn ở shape CŨ (answers[]/totalScore/startTime/endTime) sang
// shape HIỆN TẠI (questions[]/score/startedAt/expiresAt/sessionToken/attemptNumber). Đây là điểm
// thi THẬT của học sinh — đã backup đầy đủ vào scratchpad trước khi chạy file này
// (examattempts.json, questions_referenced_by_examattempts.json).
//
// GIỚI HẠN ĐÃ BIẾT của phép migrate best-effort này (không thể khôi phục lại vì data cũ không
// lưu):
//  - Không biết được ĐIỂM TỐI ĐA của từng câu hỏi trong 1 lượt thi (data cũ chỉ lưu pointsEarned,
//    không lưu điểm tối đa) — set questions[].points = questions[].score = pointsEarned. Điểm
//    TỔNG (examAttempt.score = totalScore cũ) được giữ NGUYÊN CHÍNH XÁC, không bị ảnh hưởng.
//  - isCorrect suy đoán = (pointsEarned > 0) — chỉ là xấp xỉ, không phải dữ liệu gốc.
//  - 4/95 questionId được tham chiếu không còn tồn tại (đã bị xóa) — snapshot placeholder
//    "Câu hỏi đã bị xóa khỏi hệ thống", isCorrect=null, score=0.
//  - sessionToken sinh ngẫu nhiên mới (attempt đã xong từ lâu, token cũ không còn ý nghĩa).
//
// AN TOÀN: chỉ xử lý document có field `answers` (dấu hiệu shape cũ) VÀ isDeleted:false; các
// document đã đúng shape mới (6 cái) không bị đụng tới. Chỉ chạy trực tiếp — xem
// feedback-destructive-script-incident.
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import crypto from "node:crypto";
import { v4 as uuidv4 } from "uuid";
import { pathToFileURL } from "node:url";

dotenv.config();
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const wrapText = (text) => [{ id: uuidv4(), type: "TEXT", order: 0, text: text || "" }];

function buildQuestionSnapshot(q) {
  if (!q) {
    return {
      type: "ESSAY",
      content: wrapText("[Câu hỏi đã bị xóa khỏi hệ thống]"),
      options: [],
    };
  }
  const isOldShape =
    Array.isArray(q.options) && (q.options.length === 0 || typeof q.options[0] === "string");
  if (!isOldShape) {
    // Đã ở shape mới (content/options là ContentBlock) — dùng thẳng.
    return { type: q.type, content: q.content, options: q.options };
  }
  return {
    type: q.type,
    content: typeof q.content === "string" ? wrapText(q.content) : q.content || [],
    options: (q.options || []).map((optText, i) => ({
      id: `opt-${i}`,
      content: wrapText(optText),
      order: i,
    })),
  };
}

function buildAnswer(oldAnswer, question, snapshot) {
  if (question?.type === "ESSAY" || question?.type === "SHORT_ANSWER") {
    return { selectedOptionIds: [], content: wrapText(oldAnswer.essayText) };
  }
  const idx = (question?.options || []).findIndex((o) => o === oldAnswer.selectedOption);
  const selectedOptionIds = idx >= 0 ? [`opt-${idx}`] : [];
  return { selectedOptionIds, content: [] };
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000, family: 4 });
  const db = mongoose.connection.db;
  console.log("Đã kết nối MongoDB.\n");

  const oldAttempts = await db
    .collection("examattempts")
    .find({ isDeleted: false, answers: { $exists: true } })
    .toArray();
  console.log(`Tìm thấy ${oldAttempts.length} ExamAttempt shape cũ (active) cần migrate.`);

  const examIds = [...new Set(oldAttempts.map((a) => String(a.examId)))];
  const exams = await db
    .collection("exams")
    .find({ _id: { $in: examIds.map((id) => new mongoose.Types.ObjectId(id)) } })
    .toArray();
  const examById = new Map(exams.map((e) => [String(e._id), e]));

  const qIds = [...new Set(oldAttempts.flatMap((a) => a.answers.map((x) => String(x.questionId))))];
  const questions = await db
    .collection("questions")
    .find({ _id: { $in: qIds.map((id) => new mongoose.Types.ObjectId(id)) } })
    .toArray();
  const questionById = new Map(questions.map((q) => [String(q._id), q]));

  // attemptNumber: tính lại theo thứ tự thời gian thật trong từng nhóm (examId, studentId),
  // tính CHUNG với các attempt đã đúng shape mới (nếu cùng nhóm) để tránh trùng số.
  const allAttemptsForNumbering = await db
    .collection("examattempts")
    .find({ isDeleted: false })
    .toArray();
  const groups = new Map(); // key: examId|studentId -> sorted list of {_id, time, hasNumber, number}
  for (const a of allAttemptsForNumbering) {
    const key = `${a.examId}|${a.studentId}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push({
      _id: String(a._id),
      time: a.startTime || a.startedAt || a.createdAt,
      hasNumber: a.attemptNumber !== undefined,
      number: a.attemptNumber,
    });
  }
  const assignedNumber = new Map(); // _id -> attemptNumber
  for (const list of groups.values()) {
    list.sort((x, y) => new Date(x.time) - new Date(y.time));
    const used = new Set(list.filter((x) => x.hasNumber).map((x) => x.number));
    let next = 1;
    for (const item of list) {
      if (item.hasNumber) continue;
      while (used.has(next)) next++;
      assignedNumber.set(item._id, next);
      used.add(next);
      next++;
    }
  }

  let migrated = 0;
  const bulkOps = [];
  for (const a of oldAttempts) {
    const exam = examById.get(String(a.examId));
    const examDurationMs = (exam?.duration || 60) * 60000;
    const startedAt = a.startTime || a.createdAt;
    const submittedAt = a.endTime || null;
    const expiresAt = a.endTime || new Date(new Date(startedAt).getTime() + examDurationMs);

    const questionsArr = a.answers.map((ans, order) => {
      const q = questionById.get(String(ans.questionId));
      const snapshot = buildQuestionSnapshot(q);
      const answer = buildAnswer(ans, q, snapshot);
      const pts = typeof ans.pointsEarned === "number" ? ans.pointsEarned : 0;
      return {
        questionId: ans.questionId,
        questionSnapshot: snapshot,
        order,
        points: pts,
        answer,
        isCorrect: q ? pts > 0 : null,
        score: pts,
      };
    });

    const set = {
      attemptNumber: assignedNumber.get(String(a._id)),
      questions: questionsArr,
      score: typeof a.totalScore === "number" ? a.totalScore : null,
      startedAt,
      expiresAt,
      submittedAt,
      sessionToken: crypto.randomBytes(32).toString("hex"),
    };
    const unset = { answers: "", totalScore: "", startTime: "", endTime: "", cheatCount: "" };

    bulkOps.push({ updateOne: { filter: { _id: a._id }, update: { $set: set, $unset: unset } } });
    migrated++;
  }

  if (bulkOps.length > 0) {
    const result = await db.collection("examattempts").bulkWrite(bulkOps);
    console.log(`\nĐã migrate ${migrated} bản ghi. Modified: ${result.modifiedCount}.`);
  }

  await mongoose.disconnect();
  console.log("Hoàn tất.");
  process.exit(0);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch((e) => {
    console.error("Migration thất bại:", e);
    process.exit(1);
  });
}
