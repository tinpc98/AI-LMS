import classModel from "../models/class.model.js";

/**
 * CronService – Chứa toàn bộ business logic được gọi bởi các cron job.
 *
 * Nguyên tắc thiết kế:
 *  - Mỗi method chỉ chịu trách nhiệm 1 tác vụ độc lập.
 *  - Trả về object có thuộc tính `modified` (số document bị ảnh hưởng)
 *    để cron.setup.js có thể log kết quả rõ ràng.
 *  - Dùng updateMany() – KHÔNG dùng vòng lặp .save() để tránh N+1 writes.
 */
class CronService {
  // ──────────────────────────────────────────────────────────────────────────
  // JOB 1-A: Chuyển lớp học từ Draft/Upcoming/Ready → Ongoing
  //
  // Điều kiện: startDate đã qua (≤ now) VÀ status chưa là Ongoing/Completed/...
  // Bao gồm các giá trị legacy "Upcoming" và "Active" để đảm bảo backward compat.
  // ──────────────────────────────────────────────────────────────────────────
  async activateOngoingClasses() {
    const now = new Date();

    const result = await classModel.updateMany(
      {
        isDeleted: false,
        startDate: { $lte: now }, // Ngày bắt đầu đã đến hoặc qua
        endDate: { $gt: now }, // Ngày kết thúc chưa đến (chưa xong)
        status: { $in: ["Draft", "Ready", "Upcoming"] }, // Các trạng thái cần chuyển sang Ongoing
      },
      {
        $set: { status: "Ongoing" },
      }
    );

    return { modified: result.modifiedCount };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // JOB 1-B: Chuyển lớp học từ Ongoing/Active → Completed
  //
  // Điều kiện: endDate đã qua (≤ now) VÀ status là Ongoing hoặc Active (legacy)
  // ──────────────────────────────────────────────────────────────────────────
  async completeExpiredClasses() {
    const now = new Date();

    const result = await classModel.updateMany(
      {
        isDeleted: false,
        endDate: { $lte: now }, // Ngày kết thúc đã đến hoặc qua
        status: { $in: ["Ongoing", "Active"] }, // Bao gồm legacy "Active"
      },
      {
        $set: { status: "Completed" },
      }
    );

    return { modified: result.modifiedCount };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Wrapper: Chạy cả 2 bước cập nhật trạng thái lớp học theo đúng thứ tự.
  //
  // Thứ tự quan trọng:
  //   1. completedExpired TRƯỚC: tránh trường hợp lớp startDate = endDate = now
  //      bị activate lên Ongoing rồi không được complete ngay trong cùng 1 run.
  //   2. activateOngoing SAU: các lớp mới bắt đầu hôm nay sẽ được activate.
  //
  // Trả về summary object để cron.setup.js log.
  // ──────────────────────────────────────────────────────────────────────────
  async runClassStatusUpdate() {
    const [completedResult, ongoingResult] = await Promise.all([
      this.completeExpiredClasses(),
      this.activateOngoingClasses(),
    ]);

    return {
      activatedToOngoing: ongoingResult.modified,
      completedExpired: completedResult.modified,
      totalModified: ongoingResult.modified + completedResult.modified,
    };
  }
}

export default new CronService();
