// Vòng đời kỳ thi: đóng những kỳ đã quá giờ làm bài.
//
// VÌ SAO PHẢI LÀ CRON JOB (§6.7)
//
// Trước đây việc này là tác dụng phụ của endpoint GET /api/exams: mỗi lần ai đó mở danh
// sách, controller quét các kỳ quá giờ rồi ghi COMPLETED. Ba vấn đề:
//
//   1. Một thao tác ĐỌC lại đi GHI dữ liệu. Hai người cùng mở danh sách là hai lượt ghi
//      cùng lúc cho cùng một tập bản ghi.
//   2. Nếu KHÔNG AI mở danh sách thì kỳ thi không bao giờ được đóng. Trạng thái dữ liệu phụ
//      thuộc vào việc có người vào xem hay không — không phải một hệ thống đáng tin.
//   3. Chi phí ghi rơi vào request của người dùng đang chỉ muốn xem danh sách.
//
// Nay controller chỉ TÍNH trạng thái hiển thị (không ghi), còn job này chịu trách nhiệm ghi.
import Exam from "./exam.model.js";

const MINUTE_MS = 60 * 1000;

/**
 * Kỳ thi đã hết giờ chưa, tính tại thời điểm `now`.
 *
 * Hàm thuần, tách riêng để controller và cron job dùng CHUNG một quy tắc. Trước đây quy tắc
 * này chỉ nằm trong controller; nếu job tự tính lại theo cách khác thì hai nơi sẽ bất đồng
 * và không ai biết cho tới lúc số liệu lệch.
 */
export const isExamExpired = (exam, now = Date.now()) => {
  if (!exam?.startTime || !exam?.duration) return false;
  const endTime = new Date(exam.startTime).getTime() + exam.duration * MINUTE_MS;
  return now > endTime;
};

/** Trạng thái nên hiển thị cho một kỳ thi, không ghi gì xuống DB. */
export const resolveDisplayStatus = (exam, now = Date.now()) =>
  exam?.status === "PUBLISHED" && isExamExpired(exam, now) ? "COMPLETED" : exam?.status;

/**
 * Đóng mọi kỳ thi PUBLISHED đã quá giờ, bằng MỘT lệnh updateMany.
 *
 * Phép so sánh startTime + duration phút < now được tính TRONG MongoDB qua $expr, thay vì
 * tải hết kỳ thi về rồi lọc bằng JavaScript. Khác biệt không chỉ là tốc độ: lọc phía ứng
 * dụng buộc phải đọc toàn bộ collection vào bộ nhớ, và số đó lớn dần theo thời gian.
 */
export const closeExpiredExams = async (now = new Date()) => {
  const result = await Exam.updateMany(
    {
      status: "PUBLISHED",
      $expr: {
        $lt: [{ $add: ["$startTime", { $multiply: ["$duration", MINUTE_MS] }] }, now],
      },
    },
    { $set: { status: "COMPLETED" } }
  );

  return { closed: result.modifiedCount };
};

/** Id các kỳ thi đã đóng và đã quá giờ — dùng để dò các phiên làm bài còn kẹt. */
export const findClosedExamIds = async (now = new Date()) => {
  const exams = await Exam.find({
    status: "COMPLETED",
    $expr: {
      $lt: [{ $add: ["$startTime", { $multiply: ["$duration", MINUTE_MS] }] }, now],
    },
  })
    .select("_id")
    .lean();

  return exams.map((exam) => exam._id);
};

export default { isExamExpired, resolveDisplayStatus, closeExpiredExams, findClosedExamIds };
