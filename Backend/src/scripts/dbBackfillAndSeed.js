// Backfill các field bị thiếu (do schema đổi sau khi data đã tồn tại) + insert data mẫu mới
// cho các collection đang rỗng (Skill/Question/PracticeQuiz/Lesson) theo schema HIỆN TẠI.
//
// ĐÃ CHẠY 2026-08-27 trên cluster Atlas dev — Phần A (backfill) an toàn để chạy lại (chỉ set
// field đang thiếu). Phần B (seed) KHÔNG idempotent — chạy lại sẽ tạo trùng thêm 1 bộ
// Skill/Question/PracticeQuiz/Lesson mẫu. Đừng chạy lại Phần B trừ khi cố ý muốn thêm 1 bộ nữa.
//
// AN TOÀN:
//  - Backfill CHỈ $set field đang thiếu (query luôn kèm điều kiện field đó không tồn tại/null)
//    — không bao giờ ghi đè giá trị đã có sẵn.
//  - KHÔNG có deleteMany/dropCollection/updateMany-vô-điều-kiện ở bất kỳ đâu trong file này.
//  - Chỉ chạy khi gọi trực tiếp (node dbBackfillAndSeed.js), không chạy khi bị import — xem
//    lesson tại feedback-destructive-script-incident.
//  - In ra từng thay đổi (id + field) để review lại được sau khi chạy.
import mongoose from "mongoose";
import dotenv from "dotenv";
import dns from "node:dns";
import { v4 as uuidv4 } from "uuid";
import { pathToFileURL } from "node:url";

dotenv.config();
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const log = (...args) => console.log(...args);

async function backfillSubjects(db, adminId) {
  const missing = await db
    .collection("subjects")
    .find({ createdBy: { $exists: false } })
    .toArray();
  for (const s of missing) {
    await db
      .collection("subjects")
      .updateOne({ _id: s._id }, { $set: { createdBy: adminId, updatedBy: adminId } });
    log(`[Subject] ${s._id} <- createdBy=${adminId} (${s.name})`);
  }
  return missing.length;
}

async function backfillCourses(db, adminId) {
  const subjects = await db.collection("subjects").find({}).toArray();
  const subjectByCode = new Map(subjects.map((s) => [s.code, s._id]));
  const classes = await db.collection("classes").find({}).toArray();
  const teacherByCourseId = new Map();
  for (const c of classes) {
    if (c.courseId && c.teacherId && !teacherByCourseId.has(String(c.courseId))) {
      teacherByCourseId.set(String(c.courseId), c.teacherId);
    }
  }

  const courses = await db.collection("courses").find({}).toArray();
  let count = 0;
  for (const c of courses) {
    const set = {};
    if (c.name === undefined && c.title) set.name = c.title;
    if (c.subjectId === undefined) {
      const sid = subjectByCode.get(c.code);
      if (sid) set.subjectId = sid;
    }
    if (c.duration === undefined || c.duration?.value === undefined) {
      set.duration = { value: 12, unit: c.duration?.unit || "WEEK" };
    }
    if (c.createdBy === undefined) {
      set.createdBy = teacherByCourseId.get(String(c._id)) || adminId;
    }
    if (Object.keys(set).length > 0) {
      await db.collection("courses").updateOne({ _id: c._id }, { $set: set });
      log(`[Course] ${c._id} (${c.title || c.name}) <- ${JSON.stringify(set)}`);
      count++;
    }
  }
  return count;
}

async function backfillTopics(db, adminId) {
  const courses = await db.collection("courses").find({}).toArray();
  const createdByCourseId = new Map(courses.map((c) => [String(c._id), c.createdBy]));

  const missing = await db
    .collection("topics")
    .find({ createdBy: { $exists: false } })
    .toArray();
  for (const t of missing) {
    const createdBy = createdByCourseId.get(String(t.courseId)) || adminId;
    await db.collection("topics").updateOne({ _id: t._id }, { $set: { createdBy } });
    log(`[Topic] ${t._id} (${t.name}) <- createdBy=${createdBy}`);
  }
  return missing.length;
}

async function backfillClassEnrollments(db, adminId) {
  const classes = await db.collection("classes").find({}).toArray();
  const assignedByClassId = new Map(
    classes.map((c) => [String(c._id), c.assignedBy || c.teacherId])
  );

  const missing = await db
    .collection("classenrollments")
    .find({ createdBy: { $exists: false } })
    .toArray();
  for (const ce of missing) {
    const createdBy = assignedByClassId.get(String(ce.classId)) || adminId;
    await db.collection("classenrollments").updateOne({ _id: ce._id }, { $set: { createdBy } });
    log(`[ClassEnrollment] ${ce._id} <- createdBy=${createdBy}`);
  }
  return missing.length;
}

async function backfillEnrollments(db) {
  const classEnrollments = await db.collection("classenrollments").find({}).toArray();
  const classIdByEnrollmentId = new Map(
    classEnrollments.map((ce) => [String(ce.enrollmentId), ce.classId])
  );
  const classes = await db.collection("classes").find({}).toArray();
  const levelByClassId = new Map(classes.map((c) => [String(c._id), c.level]));
  const courses = await db.collection("courses").find({}).toArray();
  const courseById = new Map(courses.map((c) => [String(c._id), c]));

  const missing = await db
    .collection("enrollments")
    .find({ $or: [{ level: { $exists: false } }, { price: { $exists: false } }] })
    .toArray();
  for (const e of missing) {
    const set = {};
    let level = e.level;
    if (level === undefined) {
      const classId = classIdByEnrollmentId.get(String(e._id));
      level = (classId && levelByClassId.get(String(classId))) || "FOUNDATION";
      set.level = level;
    }
    if (e.price === undefined) {
      const course = courseById.get(String(e.courseId));
      const price = course?.prices?.[level] ?? course?.prices?.get?.(level) ?? 0;
      set.price = typeof price === "number" ? price : 0;
    }
    await db.collection("enrollments").updateOne({ _id: e._id }, { $set: set });
    log(`[Enrollment] ${e._id} <- ${JSON.stringify(set)}`);
  }
  return missing.length;
}

async function seedSkillsQuestionsLessonQuiz(
  db,
  { teacherId, dbTopicId, dbCourseId, otherTopicIds }
) {
  const now = new Date();

  // --- Skills: 2 cho Topic DB301 (nội dung thật), 2 cho mỗi topic còn lại (nội dung trung tính) ---
  const dbSkills = [
    {
      topicId: dbTopicId,
      name: "Thiết kế Schema MongoDB",
      description: "Mô hình hóa dữ liệu document, chọn embed hay reference",
      order: 1,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    },
    {
      topicId: dbTopicId,
      name: "Aggregation Pipeline",
      description: "Truy vấn tổng hợp $match/$group/$lookup",
      order: 2,
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    },
  ];
  const genericSkills = [];
  otherTopicIds.forEach((topicId, i) => {
    genericSkills.push(
      {
        topicId,
        name: "Kỹ năng cơ bản",
        order: 1,
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
      },
      {
        topicId,
        name: "Kỹ năng nâng cao",
        order: 2,
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
      }
    );
  });
  const skillDocs = [...dbSkills, ...genericSkills];
  const skillResult = await db.collection("skills").insertMany(skillDocs);
  log(
    `[Skill] Đã insert ${skillDocs.length} skill (${Object.values(skillResult.insertedIds).length} id).`
  );
  const schemaSkillId = skillResult.insertedIds[0]; // Thiết kế Schema MongoDB
  const aggSkillId = skillResult.insertedIds[1]; // Aggregation Pipeline

  // --- Questions: 6 câu dưới Topic "Migrated Lessons Topic" (DB301), nội dung NoSQL thật ---
  const textBlock = (text) => [{ id: uuidv4(), type: "TEXT", order: 0, text }];
  const opt = (text, isCorrect, order) => ({
    id: uuidv4(),
    content: textBlock(text),
    isCorrect,
    order,
  });

  const questionDocs = [
    {
      topicId: dbTopicId,
      primarySkillId: schemaSkillId,
      type: "MCQ",
      selectionMode: "SINGLE",
      content: textBlock("MongoDB là loại cơ sở dữ liệu nào?"),
      options: [
        opt("Document-oriented (NoSQL)", true, 0),
        opt("Quan hệ (SQL)", false, 1),
        opt("Đồ thị (Graph)", false, 2),
        opt("Key-Value thuần túy", false, 3),
      ],
      difficulty: "EASY",
      points: 1,
      createdBy: teacherId,
      status: "PUBLISHED",
      createdAt: now,
      updatedAt: now,
    },
    {
      topicId: dbTopicId,
      primarySkillId: schemaSkillId,
      type: "MCQ",
      selectionMode: "SINGLE",
      content: textBlock("Khi nào nên EMBED một document con thay vì REFERENCE?"),
      options: [
        opt("Khi dữ liệu con luôn được đọc cùng document cha và ít khi cập nhật riêng lẻ", true, 0),
        opt("Khi dữ liệu con rất lớn và tăng trưởng không giới hạn", false, 1),
        opt("Khi nhiều document cha cùng chia sẻ 1 document con", false, 2),
        opt("Khi cần transaction phức tạp giữa nhiều collection", false, 3),
      ],
      difficulty: "MEDIUM",
      points: 2,
      createdBy: teacherId,
      status: "PUBLISHED",
      createdAt: now,
      updatedAt: now,
    },
    {
      topicId: dbTopicId,
      primarySkillId: aggSkillId,
      type: "TRUE_FALSE",
      selectionMode: "SINGLE",
      content: textBlock(
        "Stage $match trong Aggregation Pipeline nên đặt càng sớm càng tốt để giảm số document xử lý ở các stage sau."
      ),
      options: [opt("Đúng", true, 0), opt("Sai", false, 1)],
      difficulty: "EASY",
      points: 1,
      createdBy: teacherId,
      status: "PUBLISHED",
      createdAt: now,
      updatedAt: now,
    },
    {
      topicId: dbTopicId,
      primarySkillId: aggSkillId,
      type: "TRUE_FALSE",
      selectionMode: "SINGLE",
      content: textBlock(
        "$lookup trong Aggregation Pipeline dùng để JOIN dữ liệu giữa 2 collection, tương tự JOIN trong SQL."
      ),
      options: [opt("Đúng", true, 0), opt("Sai", false, 1)],
      difficulty: "MEDIUM",
      points: 1,
      createdBy: teacherId,
      status: "PUBLISHED",
      createdAt: now,
      updatedAt: now,
    },
    {
      topicId: dbTopicId,
      primarySkillId: aggSkillId,
      type: "SHORT_ANSWER",
      content: textBlock(
        "Viết tên stage Aggregation dùng để nhóm document theo 1 field và tính tổng."
      ),
      options: [],
      difficulty: "MEDIUM",
      points: 2,
      createdBy: teacherId,
      status: "PUBLISHED",
      createdAt: now,
      updatedAt: now,
    },
    {
      topicId: dbTopicId,
      primarySkillId: schemaSkillId,
      type: "ESSAY",
      content: textBlock(
        "So sánh ưu/nhược điểm của việc EMBED và REFERENCE khi thiết kế schema cho hệ thống blog (Post - Comment)."
      ),
      options: [],
      difficulty: "HARD",
      points: 5,
      createdBy: teacherId,
      status: "PUBLISHED",
      createdAt: now,
      updatedAt: now,
    },
  ];
  const qResult = await db.collection("questions").insertMany(questionDocs);
  log(`[Question] Đã insert ${questionDocs.length} câu hỏi dưới Topic ${dbTopicId}.`);
  const mcqId = qResult.insertedIds[0];
  const tfId = qResult.insertedIds[2];

  // --- PracticeQuiz: 1 quiz từ 2 câu MCQ/TRUE_FALSE vừa tạo ---
  const quizDoc = {
    title: "Ôn tập nhanh: NoSQL cơ bản",
    questions: [
      { questionId: mcqId, order: 0 },
      { questionId: tfId, order: 1 },
    ],
    createdBy: teacherId,
    createdAt: now,
    updatedAt: now,
  };
  const quizResult = await db.collection("practicequizzes").insertOne(quizDoc);
  log(`[PracticeQuiz] Đã insert 1 quiz (${quizResult.insertedId}).`);

  // --- Lesson: 1 bài giảng mới, blocks = [VIDEO, PRACTICE_QUIZ], PUBLISHED ---
  const lessonDoc = {
    topicId: dbTopicId,
    title: "Bài giảng mẫu: Tổng quan NoSQL & MongoDB",
    description:
      "Dữ liệu mẫu được insert để kiểm thử trang soạn/xem bài giảng (block Video + Practice Quiz).",
    content: [],
    blocks: [
      {
        type: "VIDEO",
        order: 0,
        isRequired: true,
        video: {
          platform: "YOUTUBE",
          externalId: "dQw4w9WgXcQ",
          url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          title: "[Demo] Video minh họa",
          durationSeconds: 600,
        },
        document: null,
        quizId: null,
      },
      {
        type: "PRACTICE_QUIZ",
        order: 1,
        isRequired: false,
        video: null,
        document: null,
        quizId: quizResult.insertedId,
      },
    ],
    order: 0,
    status: "PUBLISHED",
    createdBy: teacherId,
    isDeleted: false,
    deletedAt: null,
    deletedBy: null,
    createdAt: now,
    updatedAt: now,
  };
  const lessonResult = await db.collection("lessons").insertOne(lessonDoc);
  log(
    `[Lesson] Đã insert 1 lesson mới (${lessonResult.insertedId}) dưới Topic "Migrated Lessons Topic".`
  );
}

async function main() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 15000, family: 4 });
  const db = mongoose.connection.db;
  console.log("Đã kết nối MongoDB.\n");

  const admin = await db.collection("users").findOne({ role: "Admin" });
  const adminId = admin._id;

  console.log("=".repeat(70));
  console.log("PHẦN A — BACKFILL FIELD THIẾU");
  console.log("=".repeat(70));
  const nSubjects = await backfillSubjects(db, adminId);
  const nCourses = await backfillCourses(db, adminId);
  const nTopics = await backfillTopics(db, adminId);
  const nClassEnr = await backfillClassEnrollments(db, adminId);
  const nEnr = await backfillEnrollments(db);
  console.log(
    `\nTổng: Subject=${nSubjects}, Course=${nCourses}, Topic=${nTopics}, ClassEnrollment=${nClassEnr}, Enrollment=${nEnr}`
  );

  console.log("\n" + "=".repeat(70));
  console.log("PHẦN B — INSERT DATA MẪU MỚI (Skill/Question/PracticeQuiz/Lesson)");
  console.log("=".repeat(70));
  const dbTopicId = new mongoose.Types.ObjectId("6a8db59b6fc3f5cd3f249ed5"); // Migrated Lessons Topic (DB301)
  const teacherId = new mongoose.Types.ObjectId("6a6c663f2ca66ee1f5f5e40c"); // GV. Thanh Dân Trần (dạy lớp DB301)
  const otherTopicIds = [
    "6a8cfeac78d94f0a902eb89d",
    "6a8cfeac78d94f0a902eb89e",
    "6a8cfeaf78d94f0a902eb8f5",
    "6a8d2fb5d0174b6548191cea",
  ].map((id) => new mongoose.Types.ObjectId(id));

  await seedSkillsQuestionsLessonQuiz(db, { teacherId, dbTopicId, otherTopicIds });

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
