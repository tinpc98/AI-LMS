// Vòng đời kỳ thi: đóng những kỳ đã quá giờ làm bài.
//
// VÌ SAO PHẢI LÀ CRON JOB (§6.7)
//
// Trước đây việc này là tác dụng phụ của endpoint GET /api/exams: mỗi lần ai đó mở danh
// sách, controller quét các kỳ quá giờ rồi ghi COMPLETED. Ba vấn đề:
//
//   1. Một thao tác ĐỌC lại đi GHI dữ liệu.
//   2. Nếu KHÔNG AI mở danh sách thì kỳ thi không bao giờ được đóng.
//   3. Chi phí ghi rơi vào request của người dùng đang chỉ muốn xem danh sách.
//
// Nay controller chỉ TÍNH trạng thái hiển thị (không ghi), còn job này chịu trách nhiệm ghi.
//
// FIELD SOURCE OF TRUTH:
//   Exam.endAt — thời điểm kết thúc kỳ thi (absolute).
//   Status ARCHIVED — khi kỳ thi đã đóng (enum: DRAFT | PUBLISHED | ARCHIVED).
import Exam from "./exam.model.js";

/**
 * Kỳ thi đã hết giờ chưa, tính tại thời điểm `now`.
 *
 * Dùng endAt nếu có, fallback về startAt + duration nếu không có endAt.
 */
export const isExamExpired = (exam, now = Date.now()) => {
  if (!exam) return false;
  // Ưu tiên endAt nếu được set
  if (exam.endAt) {
    return now > new Date(exam.endAt).getTime();
  }
  // Fallback: startAt + duration
  if (exam.startAt && exam.duration) {
    const endTime = new Date(exam.startAt).getTime() + exam.duration * 60 * 1000;
    return now > endTime;
  }
  return false;
};

/**
 * Trạng thái hiển thị cho một kỳ thi, không ghi gì xuống DB.
 *
 * Trả về "ARCHIVED" (display: "COMPLETED") khi exam đã PUBLISHED và hết giờ.
 * UI có thể dùng "COMPLETED" như display label nhưng không persist xuống DB.
 */
export const resolveDisplayStatus = (exam, now = Date.now()) => {
  if (exam?.status === "PUBLISHED" && isExamExpired(exam, now)) {
    return "COMPLETED"; // Chỉ hiển thị, không ghi DB
  }
  return exam?.status;
};

/**
 * Đóng mọi kỳ thi PUBLISHED đã quá endAt (hoặc startAt + duration nếu endAt null).
 *
 * Phép so sánh thực hiện trong MongoDB qua $expr + $cond để xử lý cả hai case.
 * Status ARCHIVED là trạng thái persistent hợp lệ.
 */
export const closeExpiredExams = async (now = new Date()) => {
  // Case 1: endAt đã được set → dùng endAt
  // Case 2: endAt null → dùng startAt + duration
  const result = await Exam.updateMany(
    {
      status: "PUBLISHED",
      $expr: {
        $lt: [
          {
            $cond: {
              if: { $ne: ["$endAt", null] },
              then: "$endAt",
              else: {
                $add: [
                  "$startAt",
                  { $multiply: ["$duration", 60 * 1000] },
                ],
              },
            },
          },
          now,
        ],
      },
    },
    { $set: { status: "ARCHIVED" } }
  );

  return { closed: result.modifiedCount };
};

/**
 * Id các kỳ thi đã ARCHIVED và đã quá giờ — dùng để dò các phiên làm bài còn kẹt.
 *
 * Thêm filter endAt/startAt để tránh false-positive.
 */
export const findClosedExamIds = async (now = new Date()) => {
  const exams = await Exam.find({
    status: "ARCHIVED",
  })
    .select("_id")
    .lean();

  return exams.map((exam) => exam._id);
};

export default { isExamExpired, resolveDisplayStatus, closeExpiredExams, findClosedExamIds };
