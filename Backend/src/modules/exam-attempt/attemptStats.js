// Thống kê tình trạng bài thi của một kỳ, dành cho màn hình giáo viên.
//
// Tách khỏi controller vì hai lý do: nó là quy tắc nghiệp vụ thuần (kiểm được bằng một lời gọi
// hàm), và controller đang vượt trần kích thước — thêm code vào đó bị rào chắn chặn, đúng như
// mục đích của rào chắn.
import { GRACE_PERIOD_MS } from "./attemptDeadline.js";

/**
 * Đếm bài thi theo tình trạng.
 *
 * HAI CON SỐ MỚI (Wave 7+) — trước đây giáo viên KHÔNG có cách nào biết:
 *
 *   late       bài nộp quá hạn. Hệ thống vẫn chấp nhận (từ chối là quyết định về chính sách
 *              thi cử), nhưng phải hiện ra để giáo viên tự xử lý.
 *
 *   abandoned  bài còn kẹt IN_PROGRESS — học sinh mất mạng hoặc đóng trình duyệt giữa chừng.
 *              Chúng KHÔNG lọt vào `pending` (chỉ đếm SUBMITTED) nên trước đây biến mất khỏi
 *              mọi màn hình: không ai biết có một học sinh đã vào thi mà không có kết quả.
 */
export const buildAttemptStats = (attempts = []) => {
  const stats = { total: attempts.length, graded: 0, pending: 0, late: 0, abandoned: 0 };

  for (const attempt of attempts) {
    if (attempt.status === "GRADED") stats.graded += 1;
    else if (attempt.status === "SUBMITTED") stats.pending += 1;
    else if (attempt.status === "IN_PROGRESS") stats.abandoned += 1;

    // Độc lập với trạng thái: một bài đã chấm xong vẫn có thể là bài nộp muộn.
    if (attempt.isLate) stats.late += 1;
  }

  return stats;
};

export { GRACE_PERIOD_MS };
