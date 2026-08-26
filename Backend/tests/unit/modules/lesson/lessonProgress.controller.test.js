// Test cho lessonProgress.controller.js#updateLessonProgress — chốt lại bug đã sửa: enrollment
// check trước đây dùng status:"ACTIVE" (không tồn tại trong enum Enrollment) nên KHÔNG BAO GIỜ
// khớp được document nào, chặn nhầm mọi học sinh hợp lệ đánh dấu hoàn thành bài giảng.
import { describe, it, expect, vi, beforeEach } from "vitest";

const lessonFindById = vi.fn();
const topicFindById = vi.fn();
const enrollmentFindOne = vi.fn();
const progressFindOne = vi.fn();
const progressSave = vi.fn().mockResolvedValue(true);

vi.mock("#modules/lesson/lesson.model.js", () => ({
  default: { findById: (...a) => lessonFindById(...a) },
}));
vi.mock("#modules/topic", () => ({
  Topic: { findById: (...a) => topicFindById(...a) },
}));
vi.mock("#modules/enrollment/enrollment.model.js", () => ({
  default: { findOne: (...a) => enrollmentFindOne(...a) },
}));

// LessonProgress.findOne cũng được gọi tĩnh trong controller (khác với `new LessonProgress`) —
// mock lại named default export để hỗ trợ cả 2 cách dùng.
vi.mock("#modules/lesson/lessonProgress.model.js", () => {
  class LessonProgressMock {
    constructor(data) {
      Object.assign(this, data);
    }
    save = progressSave;
  }
  LessonProgressMock.findOne = (...a) => progressFindOne(...a);
  return { default: LessonProgressMock };
});

const { updateLessonProgress } = await import("#modules/lesson/lessonProgress.controller.js");

const buildRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const LESSON_ID = "lesson-1";
const TOPIC_ID = "topic-1";
const COURSE_ID = "course-1";
const STUDENT_ID = "student-1";

beforeEach(() => {
  vi.clearAllMocks();
  lessonFindById.mockResolvedValue({ _id: LESSON_ID, topicId: TOPIC_ID });
  topicFindById.mockResolvedValue({ _id: TOPIC_ID, courseId: COURSE_ID });
  progressFindOne.mockResolvedValue(null);
});

const buildReq = () => ({
  params: { lessonId: LESSON_ID },
  body: { completed: true },
  user: { id: STUDENT_ID },
});

describe("updateLessonProgress — kiểm tra enrollment", () => {
  it("BUG ĐÃ SỬA: Enrollment.status='APPROVED' (đã đóng tiền, đã duyệt) → cho phép cập nhật tiến độ", async () => {
    enrollmentFindOne.mockResolvedValue({ _id: "enr-1", status: "APPROVED" });
    const res = buildRes();

    await updateLessonProgress(buildReq(), res, vi.fn());

    expect(enrollmentFindOne).toHaveBeenCalledWith({
      studentId: STUDENT_ID,
      courseId: COURSE_ID,
      status: { $in: ["APPROVED", "CLASS_ASSIGNED"] },
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(progressSave).toHaveBeenCalled();
  });

  it("Enrollment.status='CLASS_ASSIGNED' → cũng cho phép", async () => {
    enrollmentFindOne.mockResolvedValue({ _id: "enr-1", status: "CLASS_ASSIGNED" });
    const res = buildRes();

    await updateLessonProgress(buildReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("Chưa thanh toán xong (PENDING_PAYMENT) → KHÔNG được cấp quyền dù có bản ghi Enrollment", async () => {
    // Query có $in:["APPROVED","CLASS_ASSIGNED"] nên Mongo thật sẽ không khớp — mock trả null
    // đúng như hành vi thật của MongoDB khi status thực tế là PENDING_PAYMENT.
    enrollmentFindOne.mockResolvedValue(null);
    const res = buildRes();

    await updateLessonProgress(buildReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(progressSave).not.toHaveBeenCalled();
  });

  it("Không có Enrollment nào → 403, không tạo LessonProgress", async () => {
    enrollmentFindOne.mockResolvedValue(null);
    const res = buildRes();

    await updateLessonProgress(buildReq(), res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("chưa đăng ký") })
    );
  });
});
