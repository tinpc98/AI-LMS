import User from "#modules/auth/user.model.js";
import { shouldExpireStudent } from "#modules/auth/studentLifecycle.service.js";

/**
 * Job kiểm tra vòng đời của tài khoản Học sinh.
 * Các tài khoản học sinh được tạo quá 15 ngày và ĐƯỢC CHẤP THUẬN BỞI
 * StudentLifecycleService (boundary) sẽ tự động bị đổi trạng thái thành 'Expired'.
 *
 * @param {Date} [now] Truyền vào ngày cố định để tiện test
 * @returns {Promise<{expiredCount: number}>} Số lượng học sinh bị hết hạn
 */
export const runStudentExpiryCheck = async (now = new Date()) => {
  try {
    const expiryThreshold = new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000);

    // Tìm các sinh viên CÓ KHẢ NĂNG bị khóa (quá hạn 15 ngày)
    // Giới hạn role và status ngay ở DB query để tiết kiệm resource
    const potentialStudents = await User.find({
      role: "Student",
      status: "Active",
      firstEnrollmentAt: null, // Only check those who never enrolled
      $or: [
        { accountActivatedAt: { $lte: expiryThreshold } },
        { accountActivatedAt: null, createdAt: { $lte: expiryThreshold } }
      ]
    }).select("_id role status createdAt accountActivatedAt firstEnrollmentAt");

    let expiredCount = 0;

    for (const student of potentialStudents) {
      // Xác định chính xác quyền giữ tài khoản qua Service Boundary
      const isEligibleForExpiry = await shouldExpireStudent(student, now);

      if (isEligibleForExpiry) {
        await User.updateOne({ _id: student._id }, { $set: { status: "Expired" } });
        expiredCount++;
      }
    }

    return { expiredCount };
  } catch (error) {
    console.error("[CRON] runStudentExpiryCheck encountered an error:", error);
    throw error;
  }
};
