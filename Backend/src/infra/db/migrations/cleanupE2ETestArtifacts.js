import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Course } from "#modules/course";
import { Exam } from "#modules/exam";

dotenv.config();

/**
 * Script CLI dọn nốt phần còn lại của cụm dữ liệu rác E2E/test phát hiện qua
 * migrateClassStatusLegacy.js — cùng một batch seed/test (Course → Class → Exam), chỉ khác
 * collection. Đã xác nhận qua audit hệ thống (đối chiếu MỌI enum khai báo với dữ liệu thật):
 *
 *   - courses.status="Active" (2 document, "Active" không có trong enum DRAFT/PUBLISHED/
 *     ARCHIVED): tên/mã đều chứa "E2E"/"Course 2D" — không phải course thật.
 *   - exams.status="COMPLETED" (47 document, "COMPLETED" không có trong enum DRAFT/PUBLISHED/
 *     ARCHIVED — trạng thái hiển thị "đã hoàn thành" được TÍNH ĐỘNG qua resolveDisplayStatus,
 *     không lưu trực tiếp, xem exam/examLifecycle.service.js): đã verify 100% (11/11) classId
 *     của các exam còn sống trỏ tới ĐÚNG cụm lớp rác đã soft-delete ở migrateClassStatusLegacy.js.
 *
 * AN TOÀN: script CHỈ xoá mềm exam nếu classId của nó trỏ tới lớp ĐÃ isDeleted=true (rác đã
 * xác nhận) hoặc không tồn tại (orphan) — nếu classId trỏ tới lớp CÒN SỐNG, dừng lại và báo
 * lỗi thay vì tự xoá, vì khi đó không còn đủ căn cứ khẳng định là rác.
 *
 * Hỗ trợ cờ: --dry-run (mặc định), --apply, --report=<path>
 */
export async function cleanupE2ETestArtifacts(options = {}) {
  const isApply = options.apply || process.argv.includes("--apply");
  const mode = isApply ? "apply" : "dry-run";
  const reportFlag =
    options.report || process.argv.find((arg) => arg.startsWith("--report="))?.split("=")[1];

  console.log(
    `\n🔍 [CLEANUP_E2E] Bắt đầu dọn dẹp rác Course/Exam ở chế độ: [${mode.toUpperCase()}]`
  );

  const report = {
    timestamp: new Date().toISOString(),
    database: process.env.MONGO_URI?.split("@")?.pop() || "ai-lms",
    mode,
    coursesJunkFound: 0,
    coursesJunkSoftDeleted: 0,
    courseChanges: [],
    examsJunkFound: 0,
    examsJunkSoftDeleted: 0,
    examChanges: [],
    errors: [],
  };

  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-lms";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
      console.log("✅ [CLEANUP_E2E] Đã kết nối MongoDB thành công.");
    }

    // ── 1. Courses status="Active" (không có trong enum) ──────────────────────
    const rawCourses = mongoose.connection.collection("courses");
    const activeCourses = await rawCourses
      .find({ status: "Active", isDeleted: false })
      .project({ name: 1, code: 1 })
      .toArray();

    report.coursesJunkFound = activeCourses.length;
    const junkCourseIds = [];

    for (const c of activeCourses) {
      const looksLikeTestArtifact = /e2e|test/i.test(`${c.name || ""} ${c.code || ""}`);
      report.courseChanges.push({
        id: String(c._id),
        name: c.name ?? null,
        code: c.code ?? null,
        classifiedAsJunk: looksLikeTestArtifact,
      });
      if (looksLikeTestArtifact) junkCourseIds.push(c._id);
      else {
        report.errors.push(
          `Course ${c._id} (${c.name}) có status="Active" nhưng tên/mã KHÔNG khớp mẫu E2E/test — không tự động xoá, cần xem thủ công.`
        );
      }
    }

    if (isApply && junkCourseIds.length > 0) {
      const result = await Course.updateMany(
        { _id: { $in: junkCourseIds } },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      );
      report.coursesJunkSoftDeleted = result.modifiedCount;
    } else {
      report.coursesJunkSoftDeleted = isApply ? 0 : junkCourseIds.length;
    }

    // ── 2. Exams status="COMPLETED" (không có trong enum) ──────────────────────
    const rawExams = mongoose.connection.collection("exams");
    const rawClasses = mongoose.connection.collection("classes");

    const completedExams = await rawExams
      .find({ status: "COMPLETED", isDeleted: false })
      .project({ title: 1, classId: 1 })
      .toArray();

    report.examsJunkFound = completedExams.length;
    const junkExamIds = [];

    for (const e of completedExams) {
      let classInfo = null;
      if (e.classId) {
        classInfo = await rawClasses.findOne({ _id: e.classId }, { projection: { isDeleted: 1 } });
      }
      // Rác nếu: lớp tham chiếu đã bị xoá mềm (đã xác nhận là rác ở migration trước),
      // hoặc không có classId / classId không tồn tại (orphan).
      const referencesJunkOrOrphanClass = !classInfo || classInfo.isDeleted === true;

      report.examChanges.push({
        id: String(e._id),
        title: e.title ?? null,
        classId: e.classId ? String(e.classId) : null,
        classFound: !!classInfo,
        classIsDeleted: classInfo?.isDeleted ?? null,
        classifiedAsJunk: referencesJunkOrOrphanClass,
      });

      if (referencesJunkOrOrphanClass) {
        junkExamIds.push(e._id);
      } else {
        report.errors.push(
          `Exam ${e._id} (${e.title}) có status="COMPLETED" nhưng classId trỏ tới lớp CÒN SỐNG — không tự động xoá, cần xem thủ công.`
        );
      }
    }

    if (isApply && junkExamIds.length > 0) {
      const result = await Exam.updateMany(
        { _id: { $in: junkExamIds } },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      );
      report.examsJunkSoftDeleted = result.modifiedCount;
    } else {
      report.examsJunkSoftDeleted = isApply ? 0 : junkExamIds.length;
    }

    console.log(`\n📊 [CLEANUP_E2E] Báo Cáo (${mode.toUpperCase()}):`);
    console.log(JSON.stringify(report, null, 2));

    if (reportFlag) {
      const reportPath = path.resolve(reportFlag);
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📁 [CLEANUP_E2E] Đã xuất report JSON ra file: ${reportPath}`);
    }

    return report;
  } catch (error) {
    console.error("❌ [CLEANUP_E2E] Lỗi thực thi migration:", error);
    report.errors.push(error.message);
    throw error;
  }
}

// Chạy trực tiếp nếu script được gọi độc lập từ CLI
if (process.argv[1]?.includes("cleanupE2ETestArtifacts.js")) {
  cleanupE2ETestArtifacts()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
