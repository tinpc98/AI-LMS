// Backfill Class.commitmentStatus cho các lớp học ĐÃ TỒN TẠI TRƯỚC khi field này được thêm vào
// schema (EduSpace mechanism design Phần A). Mongoose CHỈ áp default cho document mới tạo, không
// tự thêm field vào document cũ đã lưu trong MongoDB — nên các lớp cũ hiện KHÔNG có field này,
// khiến transitionCommitment() không thể chạy (ALLOWED_TRANSITIONS[undefined] luôn undefined).
//
// Mặc định chạy DRY RUN (chỉ đếm, không ghi gì). Truyền --apply để ghi thật.
import mongoose from "mongoose";
import dotenv from "dotenv";
import Class from "#modules/class/class.model.js";

dotenv.config();

const APPLY = process.argv.includes("--apply");

async function run() {
  console.log("==================================================");
  console.log(APPLY ? "✍️  APPLY MIGRATION" : "🔍 DRY RUN MIGRATION");
  console.log("Backfill Class.commitmentStatus = 'OFFERED' cho lớp cũ");
  console.log("==================================================\n");

  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("Missing MONGO_URI");
    await mongoose.connect(uri);
    console.log("Connected to MongoDB...");

    const totalClasses = await Class.countDocuments();
    console.log(`Tổng số lớp học: ${totalClasses}`);

    const filter = { commitmentStatus: { $exists: false } };
    const missingCount = await Class.countDocuments(filter);
    console.log(`Số lớp THIẾU commitmentStatus: ${missingCount}`);

    if (missingCount === 0) {
      console.log("Không có lớp nào cần backfill.");
      return;
    }

    if (!APPLY) {
      const sample = await Class.find(filter).select("_id name code").limit(5).lean();
      console.log("\nVí dụ 5 lớp sẽ bị ảnh hưởng:");
      sample.forEach((c) => console.log(` - ${c._id} | ${c.name || c.code || "(không tên)"}`));
      console.log(
        `\nSẽ set commitmentStatus = "OFFERED" cho ${missingCount} lớp. Chạy lại với --apply để ghi thật.`
      );
    } else {
      const result = await Class.updateMany(filter, { $set: { commitmentStatus: "OFFERED" } });
      console.log(`Đã cập nhật ${result.modifiedCount} lớp.`);
    }
  } catch (error) {
    console.error("Migration error:", error);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    console.log("\nHoàn tất.");
  }
}

run();
