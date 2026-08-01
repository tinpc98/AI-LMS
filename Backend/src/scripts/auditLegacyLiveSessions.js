import mongoose from "mongoose";
import dotenv from "dotenv";
import { Class as classModel } from "#modules/class";
import { LiveSession } from "#modules/live-session";

dotenv.config();

/**
 * Script Kiểm Tra Dữ Liệu Legacy Live Sessions (Sprint J1 Audit Script)
 * KHÔNG SỬA HAY THAO TÁC XÓA DỮ LIỆU. CHỈ ĐỌC VÀ BÁO CÁO THỐNG KÊ.
 */
export async function auditLegacyLiveSessions() {
  console.log("🔍 [J1_AUDIT] Bắt đầu kiểm tra dữ liệu Legacy Live Sessions...");

  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ai-lms";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
      console.log("✅ [J1_AUDIT] Đã kết nối MongoDB thành công.");
    }

    // 1. Thống kê Lớp học có meetingRoomId
    const totalClasses = await classModel.countDocuments();
    const classesWithRoom = await classModel.countDocuments({ meetingRoomId: { $ne: null } });

    // 2. Thống kê LiveSessions
    const totalSessions = await LiveSession.countDocuments();
    const sessionsWithRoomName = await LiveSession.countDocuments({ roomName: { $ne: null } });
    const activeLiveSessions = await LiveSession.countDocuments({
      status: "Live",
      isDeleted: false,
    });

    // 3. Kiểm tra lớp học bị trùng phiên Live (Multiple Active Live Sessions)
    const activeGroups = await LiveSession.aggregate([
      { $match: { status: "Live", isDeleted: false } },
      { $group: { _id: "$classId", count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]);

    const auditReport = {
      timestamp: new Date().toISOString(),
      classes: {
        total: totalClasses,
        withLegacyMeetingRoomId: classesWithRoom,
      },
      liveSessions: {
        total: totalSessions,
        withNewRoomName: sessionsWithRoomName,
        currentlyActiveLive: activeLiveSessions,
        classesWithDuplicateActiveSessions: activeGroups.length,
      },
    };

    console.log("📊 [J1_AUDIT] Kết quả Báo Cáo Audit:");
    console.log(JSON.stringify(auditReport, null, 2));

    return auditReport;
  } catch (error) {
    console.error("❌ [J1_AUDIT] Lỗi khi thực thi audit script:", error);
    throw error;
  }
}

// Chạy trực tiếp nếu script được gọi độc lập
if (process.argv[1]?.includes("auditLegacyLiveSessions.js")) {
  auditLegacyLiveSessions()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
