// Test cho lessonProgress.service.js — chốt lại bug đã sửa: enrollment check trước đây dùng
// status:"ACTIVE" (không tồn tại trong enum Enrollment) nên KHÔNG BAO GIỜ khớp được document
// nào, chặn nhầm mọi học sinh hợp lệ ghi nhận tiến độ. Logic enrollment giờ nằm ở
// lessonProgress.service.js#assertEnrolled, dùng chung cho mọi endpoint ghi tiến độ block
// (trước đây chỉ có 1 endpoint updateLessonProgress duy nhất, giờ tách theo loại block —
// dùng recordDocumentOpenService làm đại diện vì ít tham số nhất, không đổi lý do test).
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
vi.mock("#modules/enrollment", () => ({
  Enrollment: { findOne: (...a) => enrollmentFindOne(...a) },
}));
vi.mock("#modules/question", () => ({ Question: { find: vi.fn() } }));
vi.mock("#modules/lesson/practiceQuiz.model.js", () => ({ default: {} }));
vi.mock("#modules/lesson/practiceQuizAttempt.model.js", () => ({ default: {} }));
vi.mock("#shared/services/storage.service.js", () => ({
  default: {
    getSignedUrl: () => ({
      signedUrl: "https://signed.example/doc",
      expiresAt: "2099-01-01T00:00:00.000Z",
    }),
  },
}));

vi.mock("#modules/lesson/lessonProgress.model.js", () => {
  class LessonProgressMock {
    constructor(data) {
      Object.assign(this, data);
      this.blocks = [];
    }
    save = progressSave;
  }
  LessonProgressMock.findOne = (...a) => progressFindOne(...a);
  return { default: LessonProgressMock };
});

const { recordDocumentOpenService } = await import("#modules/lesson/lessonProgress.service.js");

const LESSON_ID = "lesson-1";
const TOPIC_ID = "topic-1";
const COURSE_ID = "course-1";
const STUDENT_ID = "student-1";
const BLOCK_ID = "block-1";

const buildBlock = () => ({ _id: BLOCK_ID, type: "DOCUMENT", document: { publicId: "doc-1" } });

beforeEach(() => {
  vi.clearAllMocks();
  const block = buildBlock();
  const blocks = [block];
  blocks.id = (id) => blocks.find((b) => String(b._id) === String(id)) || null;
  lessonFindById.mockResolvedValue({ _id: LESSON_ID, topicId: TOPIC_ID, blocks });
  topicFindById.mockReturnValue({
    lean: () => Promise.resolve({ _id: TOPIC_ID, courseId: COURSE_ID }),
  });
  progressFindOne.mockResolvedValue(null);
});

describe("lessonProgress.service — kiểm tra enrollment (assertEnrolled)", () => {
  it("BUG ĐÃ SỬA: Enrollment.status='APPROVED' (đã đóng tiền, đã duyệt) → cho phép ghi tiến độ", async () => {
    enrollmentFindOne.mockResolvedValue({ _id: "enr-1", status: "APPROVED" });

    const result = await recordDocumentOpenService(LESSON_ID, BLOCK_ID, STUDENT_ID);

    expect(enrollmentFindOne).toHaveBeenCalledWith({
      studentId: STUDENT_ID,
      courseId: COURSE_ID,
      status: { $in: ["APPROVED", "CLASS_ASSIGNED"] },
    });
    expect(progressSave).toHaveBeenCalled();
    expect(result.progress.blocks[0].firstOpenedAt).toBeTruthy();
    expect(result.documentUrl).toBe("https://signed.example/doc");
  });

  it("Enrollment.status='CLASS_ASSIGNED' → cũng cho phép", async () => {
    enrollmentFindOne.mockResolvedValue({ _id: "enr-1", status: "CLASS_ASSIGNED" });

    await expect(recordDocumentOpenService(LESSON_ID, BLOCK_ID, STUDENT_ID)).resolves.toBeTruthy();
  });

  it("Chưa thanh toán xong (PENDING_PAYMENT) → KHÔNG được cấp quyền dù có bản ghi Enrollment", async () => {
    // Query có $in:["APPROVED","CLASS_ASSIGNED"] nên Mongo thật sẽ không khớp — mock trả null
    // đúng như hành vi thật của MongoDB khi status thực tế là PENDING_PAYMENT.
    enrollmentFindOne.mockResolvedValue(null);

    await expect(recordDocumentOpenService(LESSON_ID, BLOCK_ID, STUDENT_ID)).rejects.toThrow(
      /chưa đăng ký/
    );
    expect(progressSave).not.toHaveBeenCalled();
  });

  it("Không có Enrollment nào → lỗi, không tạo LessonProgress", async () => {
    enrollmentFindOne.mockResolvedValue(null);

    await expect(recordDocumentOpenService(LESSON_ID, BLOCK_ID, STUDENT_ID)).rejects.toThrow(
      /chưa đăng ký/
    );
  });
});
