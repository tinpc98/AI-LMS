import dotenv from "dotenv";
import mongoose from "mongoose";
import Attendance from "../models/attendance.model.js";

dotenv.config();

export const cleanDuplicateAttendance = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/ai-lms";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
    }

    console.log("🔍 Đang tìm kiếm các bản ghi điểm danh trùng lặp...");

    // Group theo classId, studentId, date (sau khi normalize)
    const duplicates = await Attendance.aggregate([
      {
        $group: {
          _id: {
            classId: "$classId",
            studentId: "$studentId",
            year: { $year: "$date" },
            month: { $month: "$date" },
            day: { $dayOfMonth: "$date" },
          },
          docs: { $push: { id: "$_id", createdAt: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ]);

    console.log(`📊 Tìm thấy ${duplicates.length} nhóm dữ liệu bị trùng điểm danh.`);

    let totalDeleted = 0;
    for (const dup of duplicates) {
      // Sắp xếp theo createdAt mới nhất để giữ bản ghi mới nhất
      const sortedDocs = dup.docs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      const keepDoc = sortedDocs[0];
      const deleteIds = sortedDocs.slice(1).map((doc) => doc.id);

      await Attendance.deleteMany({ _id: { $in: deleteIds } });
      totalDeleted += deleteIds.length;
    }

    console.log(`✅ Đã xóa ${totalDeleted} bản ghi trùng lặp. Dữ liệu điểm danh hiện đã sạch!`);
  } catch (error) {
    console.error("❌ Lỗi khi dọn dẹp điểm danh trùng:", error.message);
  }
};

if (import.meta.url === `file:///${process.argv[1].replace(/\\/g, "/")}`) {
  cleanDuplicateAttendance().then(() => process.exit(0));
}

export default cleanDuplicateAttendance;
