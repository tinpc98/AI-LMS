import cron from "node-cron";
import cronService from "../services/cron.service.js";
import { runAIPendingRecovery } from "./jobs/aiPendingRecovery.job.js";

/**
 * initCronJobs – Khởi tạo và đăng ký tất cả các cron job của hệ thống.
 *
 * Nguyên tắc thiết kế:
 *  - File này KHÔNG chứa query DB hay business logic.
 *  - Chỉ định nghĩa lịch (schedule) và ủy thác xử lý cho cronService.
 *  - Mỗi job được wrap trong try-catch riêng → 1 job lỗi không ảnh hưởng job khác.
 *  - Lỗi được log rõ ràng nhưng KHÔNG gọi process.exit() để tránh crash server.
 *
 * @param {boolean} [runImmediately=false] – Nếu true, chạy ngay khi khởi động
 *   (hữu ích để kiểm tra hoặc sync dữ liệu sau khi deploy).
 */
export const initCronJobs = (runImmediately = false) => {
  // ──────────────────────────────────────────────────────────────────────────
  // JOB 1: Tự động cập nhật trạng thái vòng đời lớp học
  //
  // Lịch: Mỗi ngày lúc 00:00:00 (nửa đêm)
  // Timezone: Asia/Ho_Chi_Minh (GMT+7)
  //
  // Luồng xử lý:
  //   Draft/Ready/Upcoming  → Ongoing  (nếu startDate đã qua, endDate chưa qua)
  //   Ongoing/Active        → Completed (nếu endDate đã qua)
  // ──────────────────────────────────────────────────────────────────────────
  cron.schedule(
    "0 0 * * *",
    async () => {
      console.log("[CRON] ⏰ Bắt đầu job: Cập nhật trạng thái lớp học tự động...");

      try {
        const summary = await cronService.runClassStatusUpdate();

        console.log(
          `[CRON] ✅ Automated class status update executed successfully.` +
          ` Activated → Ongoing: ${summary.activatedToOngoing} |` +
          ` Completed: ${summary.completedExpired} |` +
          ` Total modified: ${summary.totalModified} documents.`
        );
      } catch (error) {
        // Log chi tiết lỗi nhưng KHÔNG throw hoặc process.exit()
        // để cron scheduler tiếp tục chạy các lần sau.
        console.error("[CRON ERROR] ❌ Class Status Update Failed:", error);
      }
    },
    {
      scheduled: true,
      timezone: "Asia/Ho_Chi_Minh",
    }
  );

  console.log("[CRON] 📅 Đã đăng ký job: Class Status Update (lịch: 00:00 hàng ngày | GMT+7)");

  // ── Chạy ngay lập tức nếu được yêu cầu (VD: sau khi deploy) ──────────────
  if (runImmediately) {
    console.log("[CRON] 🔄 runImmediately=true — Thực thi ngay lần đầu khi khởi động...");

    cronService.runClassStatusUpdate()
      .then((summary) => {
        console.log(
          `[CRON] ✅ Initial run complete.` +
          ` Activated → Ongoing: ${summary.activatedToOngoing} |` +
          ` Completed: ${summary.completedExpired} |` +
          ` Total modified: ${summary.totalModified} documents.`
        );
      })
      .catch((error) => {
        console.error("[CRON ERROR] ❌ Initial Class Status Update Failed:", error);
      });
  }

  // ──────────────────────────────────────────────────────────────────────────
  // JOB 2: Tự động dọn dẹp AI Usage bị kẹt (Pending Recovery)
  // Lịch: Mỗi 5 phút (*/5 * * * *)
  // ──────────────────────────────────────────────────────────────────────────
  cron.schedule(
    "*/5 * * * *",
    async () => {
      try {
        const result = await runAIPendingRecovery();
        if (result.totalRecovered > 0) {
          console.log(`[CRON] ♻️ AI Pending Recovery: Khôi phục thành công ${result.totalRecovered} requests bị kẹt.`);
        }
      } catch (error) {
        console.error("[CRON ERROR] ❌ AI Pending Recovery Failed:", error);
      }
    },
    { scheduled: true }
  );
  console.log("[CRON] 📅 Đã đăng ký job: AI Pending Recovery (lịch: */5 * * * *)");
};
