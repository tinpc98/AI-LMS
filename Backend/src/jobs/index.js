import cron from "node-cron";
import cronService from "./cron.service.js";
import { runAIPendingRecovery } from "./aiPendingRecovery.job.js";
import { runExamAutoClose } from "./examLifecycle.job.js";
import { runExamAttemptAutoSubmit } from "./examAttemptAutoSubmit.job.js";

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

    cronService
      .runClassStatusUpdate()
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
          console.log(
            `[CRON] ♻️ AI Pending Recovery: Khôi phục thành công ${result.totalRecovered} requests bị kẹt.`
          );
        }
      } catch (error) {
        console.error("[CRON ERROR] ❌ AI Pending Recovery Failed:", error);
      }
    },
    { scheduled: true }
  );
  console.log("[CRON] 📅 Đã đăng ký job: AI Pending Recovery (lịch: */5 * * * *)");

  // ──────────────────────────────────────────────────────────────────────────
  // JOB 3: Tự động đóng kỳ thi đã hết giờ làm bài (§6.7)
  //
  // Lịch: mỗi 10 phút.
  //
  // Vì sao 10 phút chứ không phải mỗi ngày như job lớp học: kỳ thi kết thúc theo GIỜ
  // (startTime + duration phút), không theo ngày. Đóng muộn nửa ngày nghĩa là nửa ngày đó
  // học sinh vẫn thấy kỳ thi ở trạng thái "đang diễn ra".
  //
  // Vì sao không phải mỗi phút: endpoint danh sách đã tự tính trạng thái hiển thị đúng ngay
  // lập tức (resolveDisplayStatus), nên độ trễ của job chỉ ảnh hưởng tới dữ liệu lưu trữ,
  // không ảnh hưởng tới thứ người dùng nhìn thấy. Chạy dày hơn chỉ tốn truy vấn.
  // ──────────────────────────────────────────────────────────────────────────
  cron.schedule(
    "*/10 * * * *",
    async () => {
      try {
        const { closed, dangling } = await runExamAutoClose();

        if (closed > 0) {
          console.log(`[CRON] 🔒 Exam Auto-Close: đã đóng ${closed} kỳ thi hết giờ.`);
        }

        // Cảnh báo, không phải thông tin: mỗi phiên kẹt là một học sinh đã vào thi mà không
        // có kết quả ở bất kỳ màn hình nào. Xem ghi chú trong examLifecycle.job.js về lý do
        // job chỉ đếm chứ không tự xử lý.
        if (dangling > 0) {
          console.warn(
            `[CRON] ⚠️ Exam Auto-Close: ${dangling} phiên làm bài còn kẹt IN_PROGRESS ở các kỳ` +
              ` thi đã đóng. Những bài này KHÔNG xuất hiện trong hàng chờ chấm của giáo viên.`
          );
        }
      } catch (error) {
        console.error("[CRON ERROR] ❌ Exam Auto-Close Failed:", error);
      }
    },
    { scheduled: true, timezone: "Asia/Ho_Chi_Minh" }
  );
  console.log("[CRON] 📅 Đã đăng ký job: Exam Auto-Close (lịch: */10 * * * *)");

  // ──────────────────────────────────────────────────────────────────────────
  // JOB 4: Tự động nộp bài cho phiên thi đã hết giờ (chính sách 1A)
  //
  // Lịch: MỖI PHÚT. Dày hơn hẳn các job khác, và có lý do: đây là thứ duy nhất chốt lại thời
  // gian làm bài. Để phiên treo lâu là một trạng thái mập mờ — bài chưa nộp, điểm chưa có, và
  // học sinh không xuất hiện ở bất kỳ danh sách nào của giáo viên.
  //
  // An toàn khi chạy dày: truy vấn lọc theo status trước, và số phiên quá hạn ở mỗi lần chạy
  // vốn nhỏ vì lần trước đã dọn.
  //
  // ĐIỀU KIỆN TIÊN QUYẾT: job chấm theo bài làm ĐÃ LƯU LÊN MÁY CHỦ. Nó chỉ công bằng vì
  // PATCH /:id/answers và phần tự đẩy bài ở Frontend đã có trước — không có chúng thì mọi
  // phiên bị đóng đều bị chấm rỗng.
  // ──────────────────────────────────────────────────────────────────────────
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        const { submitted, failed } = await runExamAttemptAutoSubmit();

        if (submitted > 0) {
          console.log("[CRON] ⏱️ Auto-Submit: đã nộp tự động " + submitted + " phiên thi hết giờ.");
        }
        if (failed > 0) {
          console.warn(
            "[CRON] ⚠️ Auto-Submit: " +
              failed +
              " phiên KHÔNG nộp được — xem log lỗi phía trên để truy id."
          );
        }
      } catch (error) {
        console.error("[CRON ERROR] ❌ Exam Attempt Auto-Submit Failed:", error);
      }
    },
    { scheduled: true, timezone: "Asia/Ho_Chi_Minh" }
  );
  console.log("[CRON] 📅 Đã đăng ký job: Exam Attempt Auto-Submit (lịch: mỗi phút)");
};
