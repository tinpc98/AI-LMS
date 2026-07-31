// File: src/modules/exam-set/examSet.repository.js
// Truy vấn Mongoose cho ExamSet và Folder. Không chứa logic nghiệp vụ, không ném lỗi
// nghiệp vụ — trả về null để tầng service tự quyết định 403/404 tuỳ ngữ cảnh.
//
// Tách từ 5 service của module ở Wave 4.2. Trước đó 25/38 lời gọi model là cùng vài bộ lọc
// lặp đi lặp lại, viết tay ở từng chỗ:
//
//   { _id, ownerId, isDeleted: false }   9 lần   -> findOwnedExamSet
//   { _id, isDeleted: false }            6 lần   -> findActiveExamSet
//   { _id, ownerId, isDeleted: false }   4 lần   -> findOwnedFolder   (trên Folder)
//
// Rủi ro của việc viết tay: quên `isDeleted: false` ở MỘT chỗ là bộ đề đã xoá vẫn truy cập
// được — một lỗi phân quyền, không phải lỗi hiển thị. Đặt tên cho bộ lọc khiến việc quên
// trở nên khó, và nếu quy tắc đổi thì chỉ sửa một nơi.
import ExamSet from "./examSet.model.js";
import { Folder } from "#modules/folder";

// ── ExamSet ─────────────────────────────────────────────────────────────────

/** Bộ đề đang hoạt động và thuộc sở hữu của người này. */
export const findOwnedExamSet = (examSetId, ownerId) =>
  ExamSet.findOne({ _id: examSetId, ownerId, isDeleted: false });

/** Bộ đề đang hoạt động, KHÔNG xét chủ sở hữu — dùng khi quyền đã được kiểm ở tầng trên. */
export const findActiveExamSet = (examSetId) =>
  ExamSet.findOne({ _id: examSetId, isDeleted: false });

/** Bộ đề đang hoạt động kèm thông tin chủ sở hữu và thư mục, phục vụ màn hình chi tiết. */
export const findActiveExamSetWithRelations = (query) =>
  ExamSet.findOne(query).populate("ownerId", "fullName avatar").populate("folderId", "name");

/** Bộ đề ĐÃ XOÁ MỀM của người này — dùng cho thùng rác và thao tác khôi phục. */
export const findDeletedOwnedExamSet = (examSetId, ownerId) =>
  ExamSet.findOne({ _id: examSetId, ownerId, isDeleted: true }).withDeleted();

export const findExamSets = (filter, { skip, limit, sort } = {}) =>
  ExamSet.find(filter).sort(sort).skip(skip).limit(limit);

export const countExamSets = (filter) => ExamSet.countDocuments(filter);

export const updateExamSetById = (examSetId, update, options = { new: true }) =>
  ExamSet.findByIdAndUpdate(examSetId, update, options);

export const createExamSet = (data) => new ExamSet(data);

// ── Folder (module khác, truy cập qua public API #modules/folder) ────────────

/** Thư mục đang hoạt động và thuộc sở hữu của người này. */
export const findOwnedFolder = (folderId, ownerId) =>
  Folder.findOne({ _id: folderId, ownerId, isDeleted: false });

/** Thư mục đang hoạt động, không xét chủ sở hữu. */
export const findActiveFolder = (folderId) => Folder.findOne({ _id: folderId, isDeleted: false });
