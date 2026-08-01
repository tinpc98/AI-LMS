// File: src/modules/class/class.repository.js
// Toàn bộ truy vấn Mongoose cho model Class. Không chứa logic nghiệp vụ, không phụ thuộc
// req/res.
//
// Tách từ class.controller.js ở Wave 4.3. Controller đó có 752 dòng với 14 lời gọi model
// nằm rải rác, trong đó hai truy vấn danh sách lặp lại NGUYÊN chuỗi 5 populate — chỉ khác
// nhau đúng một mắt xích `.withDeleted()`. Sửa cột populate ở một chỗ mà quên chỗ kia là
// lỗi rất dễ xảy ra và rất khó thấy.
import ClassModel from "./class.model.js";

// Chuỗi populate dùng chung cho mọi truy vấn trả về lớp học "đầy đủ".
//
// Trước Wave 4.3, chuỗi này được viết lại NGUYÊN VĂN 8 lần trong controller (dòng 27, 76,
// 214, 277, 335, 400, 566, 698). Đã đối chiếu bằng máy: cả 8 lần có TẬP TRƯỜNG giống hệt
// nhau, chỉ khác thứ tự liệt kê — mà thứ tự thì Mongoose không quan tâm. Nhờ vậy việc gộp
// về một chỗ là tương đương tuyệt đối, không đổi một byte nào trong response.
//
// Giá trị thật của việc gộp: từ nay sửa/thêm một cột populate chỉ còn một chỗ. Trước đây
// sửa 7/8 chỗ rồi quên chỗ thứ 8 là lỗi vừa dễ mắc vừa gần như không thể phát hiện qua test.
const applyFullPopulate = (query) =>
  query
    .populate("teacherId", "fullName email avatar phone teachingSubjects")
    .populate("assignedBy", "fullName email")
    .populate("courseId", "courseName subject grade status description")
    .populate("students.studentId", "fullName email avatar phone")
    .populate("resources.uploadedBy", "fullName email");

/**
 * Danh sách lớp có phân trang, kèm đầy đủ quan hệ.
 * @param {Object} filter
 * @param {Object} options - { skip, limit, sort, withDeleted }
 */
export const findClassesPaginated = (filter, { skip, limit, sort, withDeleted = false } = {}) => {
  let query = ClassModel.find(filter);
  if (withDeleted) query = query.withDeleted();
  return applyFullPopulate(query).sort(sort).skip(skip).limit(limit).lean();
};

export const countClasses = (filter, { withDeleted = false } = {}) => {
  const query = ClassModel.countDocuments(filter);
  return withDeleted ? query.withDeleted() : query;
};

/** Chi tiết một lớp, kèm đầy đủ quan hệ. */
export const findClassByIdPopulated = (id) => applyFullPopulate(ClassModel.findById(id)).lean();

/** Lấy document Mongoose (KHÔNG lean) để còn gọi .save() hoặc method của model. */
export const findClassById = (id) => ClassModel.findById(id);

export const createClass = (data) => new ClassModel(data);

export const softDeleteClass = (id, userId) => ClassModel.softDelete(id, userId);

export const restoreClass = (id) => ClassModel.restore(id);

/** Xoá vĩnh viễn — chỉ áp dụng cho lớp đã nằm trong thùng rác. */
export const permanentlyDeleteClass = (id) =>
  ClassModel.findOneAndDelete({ _id: id, isDeleted: true }).withDeleted();

/** Cập nhật theo id rồi trả về bản ghi đã populate đầy đủ. */
export const updateClassByIdPopulated = (
  id,
  update,
  options = { new: true, runValidators: true }
) => applyFullPopulate(ClassModel.findByIdAndUpdate(id, update, options));

/**
 * Cập nhật theo bộ lọc tuỳ ý rồi populate đầy đủ.
 * Dùng cho các thao tác cần điều kiện nguyên tử trong chính filter — ví dụ ghi danh học
 * sinh chỉ khi lớp còn mở VÀ chưa đầy VÀ học sinh chưa có trong lớp. Giữ điều kiện ở filter
 * thay vì kiểm tra trước rồi mới ghi là chủ ý: tránh race condition khi hai request cùng
 * ghi danh vào chỗ trống cuối cùng.
 */
export const findOneAndUpdateClassPopulated = (
  filter,
  update,
  options = { new: true, runValidators: true }
) => applyFullPopulate(ClassModel.findOneAndUpdate(filter, update, options));

/** Cập nhật không cần populate (dùng cho thao tác chỉ đổi một trường nhỏ). */
export const findOneAndUpdateClass = (
  filter,
  update,
  options = { new: true, runValidators: true }
) => ClassModel.findOneAndUpdate(filter, update, options);
