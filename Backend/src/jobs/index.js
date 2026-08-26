import cron from "node-cron";
import { runAIPendingRecovery } from "./aiPendingRecovery.job.js";
import { runExamAutoClose } from "./examLifecycle.job.js";
import { runExamAttemptAutoSubmit } from "./examAttemptAutoSubmit.job.js";
import { runAssignmentAttemptAutoSubmit } from "./assignmentAttemptAutoSubmit.job.js";
import { runChatCleanup } from "./chatCleanup.job.js";
import { runStudentExpiryCheck } from "./userLifecycle.job.js";
import { runCohortEscalationLevel1 } from "./cohortEscalation.job.js";

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
  // JOB 1: Tự động cập nhật trạng thái vòng đời lớp học — TẠM TẮT, ĐANG HỎNG.
  //
  // cron.service.js (runClassStatusUpdate/activateOngoingClasses/completeExpiredClasses)
  // lọc/set theo enum trạng thái CŨ (Draft/Ready/Upcoming/Ongoing/Active/Completed),
  // nhưng Class.status hiện tại (class.model.js) chỉ có DRAFT/OPEN/FULL/CLOSED/ARCHIVED —
  // không còn "Ongoing"/"Completed" nào cả, và so sánh chuỗi lại phân biệt hoa/thường.
  // Kết quả: filter $in không bao giờ khớp document nào — job này chạy mỗi đêm từ trước
  // tới giờ nhưng CHƯA TỪNG cập nhật một lớp học nào (no-op câm lặng, không log lỗi vì
  // updateMany() khớp 0 document vẫn "thành công").
  //
  // Không tự sửa mapping ở đây: enum mới không có trạng thái nào tương đương "Ongoing",
  // nên cần người nắm nghiệp vụ xác nhận đúng ánh xạ trước khi cho cron này ghi dữ liệu
  // hàng loạt trở lại — đoán sai sẽ âm thầm đổi trạng thái nhiều lớp học mỗi đêm.
  // Tắt hẳn việc đăng ký job (không xoá cron.service.js) cho tới khi có mapping đúng.
  // ──────────────────────────────────────────────────────────────────────────

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

  // ──────────────────────────────────────────────────────────────────────────
  // JOB 5: Dọn dẹp tin nhắn chat đã bị xóa mềm (Hard delete và xóa Cloudinary)
  // Lịch: Lúc 03:00 sáng, Chủ Nhật hàng tuần.
  // ──────────────────────────────────────────────────────────────────────────
  cron.schedule(
    "0 3 * * 0",
    async () => {
      try {
        const { deleted, failedFiles } = await runChatCleanup();
        if (deleted > 0) {
          console.log(`[CRON] 🗑️ Chat Cleanup: Đã xóa vĩnh viễn ${deleted} tin nhắn chat cũ.`);
        }
        if (failedFiles > 0) {
          console.warn(
            `[CRON] ⚠️ Chat Cleanup: Có ${failedFiles} file đính kèm lỗi khi xóa trên Cloudinary.`
          );
        }
      } catch (error) {
        console.error("[CRON ERROR] ❌ Chat Cleanup Failed:", error);
      }
    },
    { scheduled: true, timezone: "Asia/Ho_Chi_Minh" }
  );
  console.log("[CRON] 📅 Đã đăng ký job: Chat Cleanup (lịch: 03:00 Chủ Nhật hàng tuần)");

  // ──────────────────────────────────────────────────────────────────────────
  // JOB 6: Tự động khóa tài khoản Học sinh quá hạn (15 ngày) chưa đăng ký khóa học
  // Lịch: Mỗi ngày lúc 00:00:00 (nửa đêm)
  // ──────────────────────────────────────────────────────────────────────────
  cron.schedule(
    "0 0 * * *",
    async () => {
      try {
        const { expiredCount } = await runStudentExpiryCheck();
        if (expiredCount > 0) {
          console.log(
            `[CRON] 🛑 Student Expiry: Đã vô hiệu hóa ${expiredCount} học sinh hết hạn 15 ngày.`
          );
        }
      } catch (error) {
        console.error("[CRON ERROR] ❌ Student Expiry Check Failed:", error);
      }
    },
    { scheduled: true, timezone: "Asia/Ho_Chi_Minh" }
  );
  console.log("[CRON] 📅 Đã đăng ký job: Student Expiry Check (lịch: 00:00 hàng ngày)");

  // ──────────────────────────────────────────────────────────────────────────
  // JOB 7: Leo thang Mức 1 khi giáo viên vắng mặt — EduSpace mechanism design Phần B.1 (BR-13)
  // Lịch: Mỗi 5 phút.
  //
  // Vì sao 5 phút: ngưỡng phát hiện là CHECKIN_GRACE_MINUTES=15 phút sau giờ học; quét mỗi 5
  // phút nghĩa là độ trễ phát hiện tối đa cộng thêm chỉ ~5 phút — đủ nhanh để dự bị (nếu có)
  // vào lớp trước khi học viên mất kiên nhẫn, không cần dày như job chấm thi (đây không chốt
  // điểm số, chỉ điều phối con người).
  //
  // Mức 2/3 KHÔNG tự động — job chỉ đếm `needsAdminAttention` để log cảnh báo, đúng cùng
  // nguyên tắc với Job 3 (Exam Auto-Close đếm `dangling` thay vì tự xử lý).
  // ──────────────────────────────────────────────────────────────────────────
  cron.schedule(
    "*/5 * * * *",
    async () => {
      try {
        const { checked, resolved, needsAdminAttention, needsAdminAttentionDetails } =
          await runCohortEscalationLevel1();

        if (checked > 0) {
          console.log(
            `[CRON] 👥 Cohort Escalation: ${checked} buổi quá giờ chưa check-in, ${resolved} đã tự kích hoạt dự bị.`
          );
        }
        if (needsAdminAttention > 0) {
          // Trước đây chỉ log ĐẾM số buổi — Admin đọc log thấy "N buổi cần can thiệp" nhưng
          // không biết buổi nào/lý do gì, phải tự tra lại. needsAdminAttentionDetails đã có sẵn
          // từ job (sessionId + reason từng buổi), chỉ là bị bỏ quên khi log — ghi ra để log
          // thật sự hữu ích khi Admin cần tra cứu.
          console.warn(
            `[CRON] ⚠️ Cohort Escalation: ${needsAdminAttention} buổi KHÔNG có dự bị hoặc kích hoạt lỗi — cần Admin can thiệp (Mức 2/3).`,
            needsAdminAttentionDetails
          );
        }
      } catch (error) {
        console.error("[CRON ERROR] ❌ Cohort Escalation Level 1 Failed:", error);
      }
    },
    { scheduled: true, timezone: "Asia/Ho_Chi_Minh" }
  );
  console.log("[CRON] 📅 Đã đăng ký job: Cohort Escalation Level 1 (lịch: mỗi 5 phút)");

  // ──────────────────────────────────────────────────────────────────────────
  // JOB 8: Tự động nộp bài Assignment đã hết giờ — TÍNH NĂNG MỚI, mirror đúng Job 4
  // (Exam Attempt Auto-Submit). Assignment trước đây hoàn toàn không có deadline, xem
  // assignment.model.js/assignmentDeadline.js.
  //
  // Lịch: mỗi phút, cùng lý do với Job 4 — phiên treo lâu là bài chưa nộp, điểm chưa có, học
  // sinh không xuất hiện ở danh sách nào của giáo viên.
  // ──────────────────────────────────────────────────────────────────────────
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        const { submitted, failed } = await runAssignmentAttemptAutoSubmit();

        if (submitted > 0) {
          console.log(
            "[CRON] ⏱️ Assignment Auto-Submit: đã nộp tự động " + submitted + " bài tập hết giờ."
          );
        }
        if (failed > 0) {
          console.warn(
            "[CRON] ⚠️ Assignment Auto-Submit: " +
              failed +
              " bài KHÔNG nộp được — xem log lỗi phía trên để truy id."
          );
        }
      } catch (error) {
        console.error("[CRON ERROR] ❌ Assignment Attempt Auto-Submit Failed:", error);
      }
    },
    { scheduled: true, timezone: "Asia/Ho_Chi_Minh" }
  );
  console.log("[CRON] 📅 Đã đăng ký job: Assignment Attempt Auto-Submit (lịch: mỗi phút)");
};
