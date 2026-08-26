// Test cho cohortFeedback.service.js — EduSpace mechanism design Phần C.3, BR-25/26.
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

const classFindById = vi.fn();
const feedbackFindOne = vi.fn();
const feedbackFind = vi.fn();
const feedbackCreate = vi.fn();
const enrollmentExists = vi.fn();

vi.mock("#modules/feedback/cohortFeedback.model.js", () => ({
  default: {
    findOne: (...a) => feedbackFindOne(...a),
    find: (...a) => feedbackFind(...a),
    create: (...a) => feedbackCreate(...a),
  },
}));
vi.mock("#modules/class", () => ({
  Class: { findById: (...a) => classFindById(...a) },
}));
vi.mock("#modules/classEnrollment", () => ({
  ClassEnrollment: { exists: (...a) => enrollmentExists(...a) },
}));

const { submitFeedback, getTeacherAverageRatings, getFeedbackDetailsForAdmin } =
  await import("#modules/feedback/cohortFeedback.service.js");

const CLASS_ID = new mongoose.Types.ObjectId().toString();
const STUDENT_ID = new mongoose.Types.ObjectId().toString();
const TEACHER_ID = new mongoose.Types.ObjectId().toString();

const mongooseSelectLean = (result) => ({
  select: () => ({ lean: () => Promise.resolve(result) }),
});
const mongooseLean = (result) => ({ lean: () => Promise.resolve(result) });

beforeEach(() => {
  vi.clearAllMocks();
  enrollmentExists.mockResolvedValue(true);
});

describe("submitFeedback", () => {
  it("Nộp thành công khi lớp COMPLETED và chưa từng đánh giá", async () => {
    classFindById.mockReturnValue(
      mongooseSelectLean({ teacherId: TEACHER_ID, commitmentStatus: "COMPLETED" })
    );
    feedbackFindOne.mockReturnValue(mongooseLean(null));
    feedbackCreate.mockResolvedValue({ _id: "fb1" });

    await submitFeedback(CLASS_ID, STUDENT_ID, {
      ratingClarity: 5,
      ratingHelpfulness: 4,
      comment: "Tốt",
    });

    expect(feedbackCreate).toHaveBeenCalledWith(
      expect.objectContaining({ classId: CLASS_ID, studentId: STUDENT_ID, teacherId: TEACHER_ID })
    );
  });

  it("COMPLETED_PARTIAL cũng được phép đánh giá", async () => {
    classFindById.mockReturnValue(
      mongooseSelectLean({ teacherId: TEACHER_ID, commitmentStatus: "COMPLETED_PARTIAL" })
    );
    feedbackFindOne.mockReturnValue(mongooseLean(null));
    feedbackCreate.mockResolvedValue({ _id: "fb1" });

    await expect(
      submitFeedback(CLASS_ID, STUDENT_ID, { ratingClarity: 3, ratingHelpfulness: 3 })
    ).resolves.toBeDefined();
  });

  it("Lớp chưa kết thúc (ACTIVE) → BusinessRuleError, không tạo feedback", async () => {
    classFindById.mockReturnValue(
      mongooseSelectLean({ teacherId: TEACHER_ID, commitmentStatus: "ACTIVE" })
    );

    await expect(
      submitFeedback(CLASS_ID, STUDENT_ID, { ratingClarity: 5, ratingHelpfulness: 5 })
    ).rejects.toMatchObject({ status: 422 });
    expect(feedbackCreate).not.toHaveBeenCalled();
  });

  it("Đã đánh giá rồi → ConflictError (409)", async () => {
    classFindById.mockReturnValue(
      mongooseSelectLean({ teacherId: TEACHER_ID, commitmentStatus: "COMPLETED" })
    );
    feedbackFindOne.mockReturnValue(mongooseLean({ _id: "fb-cu" }));

    await expect(
      submitFeedback(CLASS_ID, STUDENT_ID, { ratingClarity: 5, ratingHelpfulness: 5 })
    ).rejects.toMatchObject({ status: 409 });
    expect(feedbackCreate).not.toHaveBeenCalled();
  });

  it("Lớp không tồn tại → NotFoundError", async () => {
    classFindById.mockReturnValue(mongooseSelectLean(null));
    await expect(
      submitFeedback(CLASS_ID, STUDENT_ID, { ratingClarity: 5, ratingHelpfulness: 5 })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("Lớp chưa có giáo viên → BusinessRuleError", async () => {
    classFindById.mockReturnValue(
      mongooseSelectLean({ teacherId: null, commitmentStatus: "COMPLETED" })
    );
    await expect(
      submitFeedback(CLASS_ID, STUDENT_ID, { ratingClarity: 5, ratingHelpfulness: 5 })
    ).rejects.toMatchObject({ status: 422 });
  });

  it("BUG ĐÃ SỬA — học viên CHƯA TỪNG tham gia lớp → BusinessRuleError, không tạo feedback (trước đây bất kỳ ai đăng nhập cũng đánh giá được)", async () => {
    classFindById.mockReturnValue(
      mongooseSelectLean({ teacherId: TEACHER_ID, commitmentStatus: "COMPLETED" })
    );
    enrollmentExists.mockResolvedValue(null);

    await expect(
      submitFeedback(CLASS_ID, STUDENT_ID, { ratingClarity: 5, ratingHelpfulness: 5 })
    ).rejects.toMatchObject({ status: 422 });
    expect(feedbackCreate).not.toHaveBeenCalled();
    expect(feedbackFindOne).not.toHaveBeenCalled(); // chặn sớm, không cần đọc tiếp
  });

  it("Enrollment status=CANCELLED (đã rút hẳn, chưa từng thực học) → BusinessRuleError", async () => {
    classFindById.mockReturnValue(
      mongooseSelectLean({ teacherId: TEACHER_ID, commitmentStatus: "COMPLETED" })
    );
    enrollmentExists.mockResolvedValue(null); // exists({status:{$ne:"CANCELLED"}}) không khớp

    await expect(
      submitFeedback(CLASS_ID, STUDENT_ID, { ratingClarity: 5, ratingHelpfulness: 5 })
    ).rejects.toMatchObject({ status: 422 });
  });

  it("Kiểm enrollment với studentId đúng và loại trừ status CANCELLED", async () => {
    classFindById.mockReturnValue(
      mongooseSelectLean({ teacherId: TEACHER_ID, commitmentStatus: "COMPLETED" })
    );
    feedbackFindOne.mockReturnValue(mongooseLean(null));
    feedbackCreate.mockResolvedValue({ _id: "fb1" });

    await submitFeedback(CLASS_ID, STUDENT_ID, { ratingClarity: 5, ratingHelpfulness: 5 });

    expect(enrollmentExists).toHaveBeenCalledWith({
      classId: CLASS_ID,
      studentId: STUDENT_ID,
      status: { $ne: "CANCELLED" },
    });
  });
});

describe("getTeacherAverageRatings — ẩn danh, chỉ trả số liệu tổng hợp", () => {
  it("Tính đúng trung bình 2 chỉ số", async () => {
    feedbackFind.mockReturnValue({
      select: () =>
        mongooseLean([
          { ratingClarity: 5, ratingHelpfulness: 3 },
          { ratingClarity: 4, ratingHelpfulness: 5 },
        ]),
    });

    const result = await getTeacherAverageRatings(TEACHER_ID);

    expect(result).toEqual({ count: 2, avgClarity: 4.5, avgHelpfulness: 4 });
  });

  it("Chưa có đánh giá nào → count=0, avg=null", async () => {
    feedbackFind.mockReturnValue({ select: () => mongooseLean([]) });

    const result = await getTeacherAverageRatings(TEACHER_ID);

    expect(result).toEqual({ count: 0, avgClarity: null, avgHelpfulness: null });
  });
});

describe("getFeedbackDetailsForAdmin", () => {
  it("Trả về đầy đủ bản ghi (kèm studentId) — chỉ dùng nội bộ cho Admin", async () => {
    const records = [{ _id: "fb1", studentId: STUDENT_ID }];
    feedbackFind.mockReturnValue({ sort: () => mongooseLean(records) });

    const result = await getFeedbackDetailsForAdmin(TEACHER_ID);

    expect(result).toEqual(records);
  });
});
