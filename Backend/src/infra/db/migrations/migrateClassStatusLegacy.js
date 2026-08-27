import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { Class as classModel } from "#modules/class";

dotenv.config();

/**
 * Script CLI dọn dẹp Class.status cũ còn sót lại từ trước migration "Domain 02.4"
 * (enum cũ Draft/Ongoing/... → enum hiện tại DRAFT/OPEN/FULL/CLOSED/ARCHIVED, không có
 * bước backfill dữ liệu cũ khi đó).
 *
 * ĐIỀU TRA THỰC TẾ trên DB thật (không suy đoán) cho thấy KHÔNG có lớp học thật nào cần
 * "sửa" status:
 *   - 7 document status="Draft": đã isDeleted=true từ trước (không được app truy vấn tới,
 *     không ảnh hưởng nghiệp vụ) → giữ nguyên, không đụng vào.
 *   - 8 document status="Ongoing": isDeleted=false NHƯNG thiếu cả `name` lẫn `code`
 *     (2 field required trong schema) — rõ ràng là rác từ test/E2E (tên như "Class 2I Test",
 *     "E2E Course 2H" quan sát được qua UI), không phải lớp học thật đang dùng. Không thể
 *     sửa status qua `.save()` vì thiếu field bắt buộc sẽ luôn ném ValidationError — và sửa
 *     status của rác không giải quyết được gì. Xử lý đúng là xoá mềm.
 *
 * Dùng updateMany() (KHÔNG dùng .save() từng document) để né validate toàn bộ document —
 * chỉ đích danh set isDeleted/deletedAt, không đụng các field khác đang thiếu.
 *
 * Hỗ trợ cờ: --dry-run (mặc định), --apply, --report=<path>
 */
export async function migrateClassStatusLegacy(options = {}) {
  const isApply = options.apply || process.argv.includes("--apply");
  const mode = isApply ? "apply" : "dry-run";
  const reportFlag =
    options.report || process.argv.find((arg) => arg.startsWith("--report="))?.split("=")[1];

  console.log(
    `\n🔍 [MIGRATE_CLASS_STATUS] Bắt đầu dọn dẹp Class.status legacy ở chế độ: [${mode.toUpperCase()}]`
  );

  const report = {
    timestamp: new Date().toISOString(),
    database: process.env.MONGO_URI?.split("@")?.pop() || "ai-lms",
    mode,
    draftAlreadyDeleted: 0,
    ongoingJunkFound: 0,
    ongoingJunkSoftDeleted: 0,
    changes: [], // audit trail: {id, status, name, code, capacity, activeCount, isDeleted trước}
    errors: [],
  };

  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/ai-lms";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
      console.log("✅ [MIGRATE_CLASS_STATUS] Đã kết nối MongoDB thành công.");
    }

    // 1. Xác nhận lại 7 document "Draft" vẫn đang isDeleted=true — chỉ để ghi vào report,
    // không đụng gì (dùng collection thô để không bị plugin softDelete tự lọc mất).
    const rawCollection = mongoose.connection.collection("classes");
    const draftDocs = await rawCollection
      .find({ status: "Draft" })
      .project({ isDeleted: 1 })
      .toArray();
    report.draftAlreadyDeleted = draftDocs.filter((d) => d.isDeleted === true).length;
    if (report.draftAlreadyDeleted !== draftDocs.length) {
      report.errors.push(
        `Có ${draftDocs.length - report.draftAlreadyDeleted} document "Draft" KHÔNG isDeleted=true — cần xem lại thủ công, không tự động xử lý.`
      );
    }

    // 2. Tìm rác "Ongoing" thiếu name/code, còn isDeleted=false.
    const ongoingJunk = await rawCollection
      .find({ status: "Ongoing", isDeleted: false })
      .project({ name: 1, code: 1, capacity: 1, activeCount: 1 })
      .toArray();

    report.ongoingJunkFound = ongoingJunk.length;

    const junkIds = [];
    for (const doc of ongoingJunk) {
      const looksLikeJunk = !doc.name || !doc.code;
      report.changes.push({
        id: String(doc._id),
        status: "Ongoing",
        name: doc.name ?? null,
        code: doc.code ?? null,
        capacity: doc.capacity ?? null,
        activeCount: doc.activeCount ?? null,
        classifiedAsJunk: looksLikeJunk,
      });
      if (looksLikeJunk) junkIds.push(doc._id);
      else {
        report.errors.push(
          `Class ${doc._id} có status="Ongoing" nhưng CÓ đủ name/code — KHÔNG coi là rác, bỏ qua để tránh xoá nhầm lớp thật. Cần xử lý thủ công riêng.`
        );
      }
    }

    if (isApply && junkIds.length > 0) {
      const result = await classModel.updateMany(
        { _id: { $in: junkIds } },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      );
      report.ongoingJunkSoftDeleted = result.modifiedCount;
    } else {
      report.ongoingJunkSoftDeleted = isApply ? 0 : junkIds.length; // dry-run: số SẼ bị xoá
    }

    console.log(`\n📊 [MIGRATE_CLASS_STATUS] Báo Cáo (${mode.toUpperCase()}):`);
    console.log(JSON.stringify(report, null, 2));

    if (reportFlag) {
      const reportPath = path.resolve(reportFlag);
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📁 [MIGRATE_CLASS_STATUS] Đã xuất report JSON ra file: ${reportPath}`);
    }

    return report;
  } catch (error) {
    console.error("❌ [MIGRATE_CLASS_STATUS] Lỗi thực thi migration:", error);
    report.errors.push(error.message);
    throw error;
  }
}

// Chạy trực tiếp nếu script được gọi độc lập từ CLI
if (process.argv[1]?.includes("migrateClassStatusLegacy.js")) {
  migrateClassStatusLegacy()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
