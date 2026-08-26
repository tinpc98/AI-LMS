// Backfill các field xác minh/độ tin cậy trên User cho tài khoản ĐÃ TỒN TẠI TRƯỚC khi cơ chế
// này ra đời (EduSpace mechanism design Phần A/C) — cùng nguyên nhân với
// backfillCommitmentStatus.js: Mongoose không tự thêm field mới vào document cũ đã lưu.
//
// Quan trọng hơn cả vấn đề hiển thị: thiếu `vouchLimit` là một BUG THẬT — nếu giáo viên cũ được
// promote lên L3 rồi đi bảo lãnh người khác, `voucher.vouchLimit -= 1` trên `undefined` ra `NaN`,
// hỏng cả field khi lưu lại. `verificationTier`/`poolStatus` thiếu chỉ ảnh hưởng hiển thị (đã có
// fallback ở getOwnVerificationStatus) nhưng backfill luôn cho nhất quán với dữ liệu thật trong
// DB, không chỉ dựa vào fallback ở tầng đọc.
//
// Mặc định chạy DRY RUN (chỉ đếm, không ghi gì). Truyền --apply để ghi thật.
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "#modules/auth/user.model.js";

dotenv.config();

const APPLY = process.argv.includes("--apply");

const FIELDS_WITH_DEFAULTS = {
  verificationTier: "L1",
  reliabilityScore: 100,
  vouchLimit: 2,
  poolStatus: "ACTIVE",
};

async function run() {
  console.log("==================================================");
  console.log(APPLY ? "✍️  APPLY MIGRATION" : "🔍 DRY RUN MIGRATION");
  console.log("Backfill User.verificationTier/reliabilityScore/vouchLimit/poolStatus");
  console.log("==================================================\n");

  try {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("Missing MONGO_URI");
    await mongoose.connect(uri);
    console.log("Connected to MongoDB...");

    const totalUsers = await User.countDocuments();
    console.log(`Tổng số user: ${totalUsers}`);

    for (const [field, defaultValue] of Object.entries(FIELDS_WITH_DEFAULTS)) {
      const filter = { [field]: { $exists: false } };
      const missingCount = await User.countDocuments(filter);
      console.log(`Thiếu "${field}": ${missingCount}`);

      if (missingCount === 0) continue;

      if (!APPLY) {
        console.log(
          `  → sẽ set "${field}" = ${JSON.stringify(defaultValue)} cho ${missingCount} user`
        );
      } else {
        const result = await User.updateMany(filter, { $set: { [field]: defaultValue } });
        console.log(`  → đã cập nhật ${result.modifiedCount} user`);
      }
    }

    if (!APPLY) {
      console.log("\nChạy lại với --apply để ghi thật.");
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
