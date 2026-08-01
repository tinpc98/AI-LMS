// File: src/modules/exam-set/examSetShare.repository.js
// Truy vấn Mongoose cho ExamSetShare và phần tra cứu User phục vụ chia sẻ.
//
// Tách từ examSetShare.service.js ở Wave 4.2 (§4.2). Service đó dài 672 dòng và trộn ba
// việc: kiểm quyền, dựng câu truy vấn phân trang/lọc, và ghép dữ liệu trả về. Đưa phần
// truy vấn ra đây để service còn lại thuần logic nghiệp vụ.
import ExamSetShare from "./examSetShare.model.js";
import { User } from "#modules/auth";

// ── ExamSetShare ────────────────────────────────────────────────────────────

/** Bản ghi chia sẻ của một bộ đề tới một người cụ thể (kể cả đã thu hồi). */
export const findShareByExamSetAndUser = (examSetId, sharedWithUserId) =>
  ExamSetShare.findOne({ examSetId, sharedWithUserId });

export const findShareById = (shareId) => ExamSetShare.findOne({ _id: shareId });

/** Bản ghi chia sẻ PHẢI thuộc đúng bộ đề — chặn thao tác chéo giữa hai bộ đề. */
export const findShareByIdInExamSet = (shareId, examSetId) =>
  ExamSetShare.findOne({ _id: shareId, examSetId });

export const findShares = (filter, { skip, limit, sort } = {}) =>
  ExamSetShare.find(filter).sort(sort).skip(skip).limit(limit);

export const countShares = (filter) => ExamSetShare.countDocuments(filter);

export const aggregateShares = (pipeline) => ExamSetShare.aggregate(pipeline);

export const createShare = (data) => new ExamSetShare(data);

// ── User (module khác, truy cập qua public API #modules/auth) ────────────────

export const findUserById = (userId) => User.findOne({ _id: userId });

/**
 * Tìm người dùng theo tên hoặc email để lọc danh sách chia sẻ.
 * Chỉ lấy _id vì nơi gọi chỉ cần tập id để đưa vào bộ lọc $in.
 */
export const findUserIdsByKeyword = (regex) =>
  User.find({ isDeleted: false, $or: [{ fullName: regex }, { email: regex }] })
    .select("_id")
    .lean();
