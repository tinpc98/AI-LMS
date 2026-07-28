import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import classModel from "../models/class.model.js";
import LiveSession from "../models/liveSession.model.js";
import { generateLiveSessionRoomName } from "../utils/liveSessionHelper.js";

dotenv.config();

/**
 * Script CLI Migration Dữ Liệu LiveSession V2 (Sprint J3)
 * Hỗ trợ cờ: --dry-run (mặc định), --apply, --report=<path>
 */
export async function migrateLiveSessionV2(options = {}) {
  const isApply = options.apply || process.argv.includes("--apply");
  const mode = isApply ? "apply" : "dry-run";
  const reportFlag = options.report || process.argv.find((arg) => arg.startsWith("--report="))?.split("=")[1];

  console.log(`\n🔍 [MIGRATION_V2] Bắt đầu Migration LiveSession V2 ở chế độ: [${mode.toUpperCase()}]`);

  const report = {
    timestamp: new Date().toISOString(),
    database: process.env.MONGODB_URI?.split("@")?.pop() || "ai-lms",
    mode,
    classesScanned: 0,
    sessionsScanned: 0,
    roomNamesAdded: 0,
    duplicateLiveResolved: 0,
    timestampsFilled: 0,
    indexesCreated: [],
    errors: [],
  };

  try {
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/ai-lms";
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoUri);
      console.log("✅ [MIGRATION_V2] Đã kết nối MongoDB thành công.");
    }

    report.classesScanned = await classModel.countDocuments();
    report.sessionsScanned = await LiveSession.countDocuments();

    // 1. Migrate `roomName` cho các session cũ thiếu roomName
    const missingRoomSessions = await LiveSession.find({
      $or: [{ roomName: null }, { roomName: "" }, { roomName: { $exists: false } }],
    });

    for (const session of missingRoomSessions) {
      const generatedRoom = session.meetingRoomId || generateLiveSessionRoomName(session.classId, session._id);
      report.roomNamesAdded++;

      if (isApply) {
        session.roomName = generatedRoom;
        session.meetingRoomId = session.meetingRoomId || generatedRoom;
        await session.save();
      }
    }

    // 2. Giải quyết Duplicate Active Sessions (Nhiều phiên Live cùng 1 Lớp)
    const activeGroups = await LiveSession.aggregate([
      { $match: { status: "Live", isDeleted: false } },
      { $group: { _id: "$classId", sessions: { $push: "$$ROOT" }, count: { $sum: 1 } } },
      { $match: { count: { $gt: 1 } } },
    ]);

    for (const group of activeGroups) {
      // Sắp xếp giảm dần theo actualStart hoặc createdAt (giữ lại phiên mới nhất)
      const sorted = group.sessions.sort((a, b) => {
        const timeA = new Date(a.actualStart || a.createdAt).getTime();
        const timeB = new Date(b.actualStart || b.createdAt).getTime();
        return timeB - timeA;
      });

      const [keptSession, ...extraSessions] = sorted;

      for (const extra of extraSessions) {
        report.duplicateLiveResolved++;
        if (isApply) {
          await LiveSession.updateOne(
            { _id: extra._id },
            {
              $set: {
                status: "Completed",
                actualEnd: extra.updatedAt || new Date(),
              },
            }
          );
        }
      }
    }

    // 3. Chuẩn hóa Timestamps (actualStart, actualEnd)
    const sessionsNeedingTimestamps = await LiveSession.find({
      $or: [
        { status: "Live", actualStart: null },
        { status: "Completed", actualStart: null },
        { status: "Completed", actualEnd: null },
      ],
    });

    for (const session of sessionsNeedingTimestamps) {
      report.timestampsFilled++;
      if (isApply) {
        if (!session.actualStart) {
          session.actualStart = session.createdAt || new Date();
        }
        if (session.status === "Completed" && !session.actualEnd) {
          session.actualEnd = session.updatedAt || new Date();
        }
        await session.save();
      }
    }

    // 4. Kiểm tra / Khởi tạo Indexes trên MongoDB
    if (isApply) {
      await LiveSession.syncIndexes();
      report.indexesCreated.push("classId_1_status_1", "roomName_1_sparse", "classId_1_sessionNumber_unique", "classId_1_partial_status_Live");
    }

    console.log(`\n📊 [MIGRATION_V2] Báo Cáo Migration (${mode.toUpperCase()}):`);
    console.log(JSON.stringify(report, null, 2));

    if (reportFlag) {
      const reportPath = path.resolve(reportFlag);
      fs.mkdirSync(path.dirname(reportPath), { recursive: true });
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`📁 [MIGRATION_V2] Đã xuất report JSON ra file: ${reportPath}`);
    }

    return report;
  } catch (error) {
    console.error("❌ [MIGRATION_V2] Lỗi thực thi migration:", error);
    report.errors.push(error.message);
    throw error;
  }
}

// Chạy trực tiếp nếu script được gọi độc lập từ CLI
if (process.argv[1]?.includes("migrateLiveSessionV2.js")) {
  migrateLiveSessionV2()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}
