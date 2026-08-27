// Vòng 2: sửa các lỗi data còn lại sau round 1 (dbBackfillAndSeed.js).
// ĐÃ CHẠY 2026-08-27 trên cluster Atlas dev. KHÔNG idempotent hoàn toàn cho phần tạo Topic/soft-
// delete — chạy lại có thể tạo trùng "Migrated Lessons Topic" nếu Topic tương ứng bị xóa sau đó.
//
// AN TOÀN: chỉ $set field đang thiếu (không đè giá trị có sẵn), soft-delete thay vì hard-delete
// cho các bản ghi mồ côi không thể suy ra liên kết thật, không đụng gì tới ExamAttempt (xem báo
// cáo cuối file — đây là cùng dạng "shape cũ toàn bộ" như Lesson/Question, KHÔNG phải thiếu vài
// field, nên để nguyên chờ quyết định của người dùng như đã làm với Lesson/Question).
// Chỉ chạy trực tiếp — xem feedback-destructive-script-incident.
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import bcrypt from "bcryptjs";
import { pathToFileURL } from "node:url";

dotenv.config();
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const log = (...args) => console.log(...args);

async function fixClass(db) {
  // 2 lớp active thiếu level/capacity — mặc định theo giá trị phổ biến nhất đã thấy trong data thật.
  const res1 = await db
    .collection("classes")
    .updateMany(
      { isDeleted: false, level: { $exists: false } },
      { $set: { level: "FOUNDATION", capacity: 30 } }
    );
  log(
    `[Class] backfill level/capacity: matched=${res1.matchedCount} modified=${res1.modifiedCount}`
  );

  // "Class 2I Test": active, thiếu hẳn courseId (không có tín hiệu nào để suy luận) — soft-delete
  // thay vì gán bừa 1 courseId giả (sẽ khiến lớp này hiện sai vào 1 khóa học không liên quan).
  const orphan = await db
    .collection("classes")
    .findOne({ isDeleted: false, courseId: { $exists: false } });
  if (orphan) {
    await db
      .collection("classes")
      .updateOne(
        { _id: orphan._id },
        { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: null } }
      );
    log(
      `[Class] soft-deleted orphan (no courseId, no traceable link): ${orphan._id} (${orphan.className || orphan.name})`
    );
  }
}

async function fixAssignment(db, adminId) {
  const active = await db.collection("assignments").find({ isDeleted: false }).toArray();
  const classIds = [...new Set(active.map((a) => String(a.classId)).filter(Boolean))];
  const classes = await db
    .collection("classes")
    .find({ _id: { $in: classIds.map((id) => new mongoose.Types.ObjectId(id)) } })
    .toArray();
  const courseIdByClassId = new Map(classes.map((c) => [String(c._id), c.courseId]));
  const courses = await db.collection("courses").find({}).toArray();
  const createdByByCourseId = new Map(courses.map((c) => [String(c._id), c.createdBy]));

  const topicCache = new Map(); // courseId -> topicId
  let orphanCount = 0;
  let fixedCount = 0;
  let clearedBadQuestions = 0;

  for (const a of active) {
    const courseId = courseIdByClassId.get(String(a.classId));

    if (!courseId) {
      // classId (và lessonId liên quan, đã kiểm tra riêng) không trỏ tới đâu cả — mồ côi thật sự,
      // không có cách nào suy ra khóa học/chủ đề. Soft-delete thay vì gán topicId giả.
      await db
        .collection("assignments")
        .updateOne(
          { _id: a._id },
          { $set: { isDeleted: true, deletedAt: new Date(), deletedBy: null } }
        );
      orphanCount++;
      continue;
    }

    let topicId = topicCache.get(String(courseId));
    if (!topicId) {
      let topic = await db
        .collection("topics")
        .findOne({ courseId, name: "Migrated Lessons Topic" });
      if (!topic) {
        const createdBy = createdByByCourseId.get(String(courseId)) || adminId;
        const now = new Date();
        const insertRes = await db.collection("topics").insertOne({
          name: "Migrated Lessons Topic",
          courseId,
          description: "Topic mặc định cho dữ liệu cũ chưa có Topic thật",
          order: 999,
          createdBy,
          isDeleted: false,
          deletedAt: null,
          deletedBy: null,
          createdAt: now,
          updatedAt: now,
        });
        topicId = insertRes.insertedId;
        log(`[Topic] Tạo mới "Migrated Lessons Topic" cho course ${courseId} -> ${topicId}`);
      } else {
        topicId = topic._id;
      }
      topicCache.set(String(courseId), topicId);
    }

    const set = {};
    if (a.topicId === undefined) set.topicId = topicId;
    if (a.duration === undefined) set.duration = 60; // không có tín hiệu lịch sử thật, đặt mặc định.
    if (a.endAt === undefined && a.deadline) set.endAt = a.deadline; // phục hồi hạn nộp thật (đổi tên field).

    if (Array.isArray(a.questions) && a.questions.some((q) => !q.questionId)) {
      // Shape cũ (content HTML nhúng trực tiếp, không tham chiếu Question) — không thể suy ra
      // questionId thật, xóa mảng thay vì bịa liên kết sai tới 1 câu hỏi không liên quan.
      set.questions = [];
      clearedBadQuestions++;
    }

    if (Object.keys(set).length > 0) {
      await db.collection("assignments").updateOne({ _id: a._id }, { $set: set });
      fixedCount++;
    }
  }
  log(
    `[Assignment] Backfill topicId/duration/endAt: ${fixedCount} bản ghi. Soft-deleted mồ côi: ${orphanCount}. Xóa mảng questions hỏng: ${clearedBadQuestions}.`
  );
}

async function fixAIUsage(db) {
  const missing = await db
    .collection("aiusages")
    .find({ quotaDateString: { $exists: false } })
    .toArray();
  for (const u of missing) {
    const d = new Date(u.createdAt || Date.now());
    const quotaDateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    await db.collection("aiusages").updateOne({ _id: u._id }, { $set: { quotaDateString } });
  }
  log(`[AIUsage] backfill quotaDateString: ${missing.length} bản ghi.`);
}

async function fixUsers(db) {
  // Toàn bộ 11 tài khoản thiếu password đều là fixture E2E test (email dạng *_2d@example.com,
  // *_31@example.com, "Rogue Teacher"...) — không phải tài khoản thật. Gán 1 mật khẩu placeholder
  // RÕ RÀNG LÀ GIẢ (không dùng để đăng nhập thật), hash đúng cách app tự hash (bcrypt cost 10).
  const PLACEHOLDER = "Placeholder@E2E-Fixture-2026";
  const hash = await bcrypt.hash(PLACEHOLDER, await bcrypt.genSalt(10));
  const missing = await db
    .collection("users")
    .find({ password: { $exists: false } })
    .toArray();
  for (const u of missing) {
    await db.collection("users").updateOne({ _id: u._id }, { $set: { password: hash } });
    log(`[User] set placeholder password: ${u._id} (${u.email})`);
  }
  log(
    `[User] Tổng: ${missing.length} tài khoản fixture được gán mật khẩu placeholder "${PLACEHOLDER}".`
  );
}

async function fixLearningActivityLegacy(db) {
  const missing = await db
    .collection("learningactivities")
    .find({ sourceRef: { $exists: false } })
    .toArray();
  for (const doc of missing) {
    await db
      .collection("learningactivities")
      .updateOne({ _id: doc._id }, { $set: { sourceRef: `legacy:${doc._id}`, xpAwarded: 0 } });
  }
  log(`[LearningActivity] backfill sourceRef/xpAwarded (legacy, 0 XP): ${missing.length} bản ghi.`);
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 20000, family: 4 });
  const db = mongoose.connection.db;
  console.log("Đã kết nối MongoDB.\n");

  const admin = await db
    .collection("users")
    .findOne({ role: "Admin", password: { $exists: true } });
  const adminId = admin._id;

  await fixClass(db);
  await fixAssignment(db, adminId);
  await fixAIUsage(db);
  await fixUsers(db);
  await fixLearningActivityLegacy(db);

  console.log(
    "\nBÁO CÁO: ExamAttempt (215 bản ghi) KHÔNG được đụng tới trong script này — toàn bộ"
  );
  console.log("đang ở shape CŨ hoàn toàn khác (answers[]/totalScore/startTime, không phải");
  console.log("questions[]/score/startedAt/sessionToken/expiresAt/attemptNumber như schema hiện");
  console.log(
    "tại) — cùng loại vấn đề như 42 Lesson/469 Question, không phải chỉ thiếu vài field."
  );
  console.log("Cần quyết định của người dùng trước khi động vào.");

  await mongoose.disconnect();
  console.log("\nHoàn tất.");
  process.exit(0);
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirectRun) {
  main().catch((e) => {
    console.error("Script thất bại:", e);
    process.exit(1);
  });
}
