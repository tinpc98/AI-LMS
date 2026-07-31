// Job đóng kỳ thi hết giờ (§6.7).
//
// Nằm ở tầng jobs chứ không nằm trong module exam vì nó chạm tới HAI module: đóng kỳ thi
// (exam) rồi đếm các phiên làm bài còn kẹt (exam-attempt). Đặt trong module exam thì module
// đó phải import ngược sang exam-attempt, trong khi exam-attempt đã import exam — một vòng
// phụ thuộc mà rào chắn depcruise sẽ chặn, và đáng bị chặn.
import { closeExpiredExams, findClosedExamIds } from "#modules/exam";
import { ExamAttempt } from "#modules/exam-attempt";

/**
 * Đếm phiên làm bài còn kẹt ở IN_PROGRESS thuộc các kỳ thi đã đóng.
 *
 * CHỈ ĐẾM, KHÔNG SỬA — có chủ đích.
 *
 * Đây là lỗ hổng có thật: học sinh mất mạng hoặc đóng trình duyệt giữa chừng để lại một phiên
 * IN_PROGRESS vĩnh viễn. Kỳ thi đóng rồi thì họ không nộp được nữa, mà hàng chờ chấm bài của
 * giáo viên chỉ lọc status "SUBMITTED" — nên bài đó BIẾN MẤT khỏi mọi màn hình. Không ai biết
 * là có một học sinh đã vào thi mà không có kết quả.
 *
 * Không tự xử lý ở đây vì mọi cách xử lý đều là quyết định nghiệp vụ chứ không phải kỹ thuật:
 * chấm tự động nghĩa là cho điểm 0 (bài làm chưa từng lên tới máy chủ — frontend chỉ giữ
 * trong localStorage cho tới lúc nộp), còn đánh dấu SUBMITTED nghĩa là đẩy một bài trống vào
 * hàng chờ chấm của giáo viên. Cả hai đều động thẳng vào điểm của học sinh.
 *
 * Nên job ĐẾM và ghi log — biến một lỗ hổng vô hình thành con số nhìn thấy được, để người có
 * thẩm quyền quyết định thay vì để mã tự quyết hộ.
 */
const countDanglingAttempts = async (now) => {
  const closedExamIds = await findClosedExamIds(now);
  if (closedExamIds.length === 0) return 0;

  return ExamAttempt.countDocuments({
    examId: { $in: closedExamIds },
    status: "IN_PROGRESS",
  });
};

export const runExamAutoClose = async (now = new Date()) => {
  const { closed } = await closeExpiredExams(now);
  const dangling = await countDanglingAttempts(now);
  return { closed, dangling };
};

export default { runExamAutoClose };
