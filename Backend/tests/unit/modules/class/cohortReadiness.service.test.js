// Test cho cohortReadiness.service.js — EduSpace mechanism design Phần B.3, BR-15/BR-16.
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

const classFindById = vi.fn();
const topicFind = vi.fn();
const lessonFind = vi.fn();
const assignmentFind = vi.fn();

vi.mock("#modules/class/class.model.js", () => ({
  default: { findById: (...a) => classFindById(...a) },
}));
vi.mock("#modules/topic", () => ({
  Topic: { find: (...a) => topicFind(...a) },
}));
vi.mock("#modules/lesson", () => ({
  Lesson: { find: (...a) => lessonFind(...a) },
}));
vi.mock("#modules/assignment", () => ({
  Assignment: { find: (...a) => assignmentFind(...a) },
}));

const { checkCohortLearningMaterialsReady, assertCohortReadyForConfirmation } =
  await import("#modules/class/cohortReadiness.service.js");

const CLASS_ID = new mongoose.Types.ObjectId().toString();
const COURSE_ID = new mongoose.Types.ObjectId().toString();
const TOPIC_ID = new mongoose.Types.ObjectId().toString();

const mongooseQuery = (result) => ({
  select: () => mongooseQuery(result),
  lean: () => Promise.resolve(result),
});

beforeEach(() => {
  vi.clearAllMocks();
  classFindById.mockReturnValue({
    lean: () => Promise.resolve({ _id: CLASS_ID, courseId: COURSE_ID, cohortSessionCount: 2 }),
  });
  topicFind.mockReturnValue(mongooseQuery([{ _id: TOPIC_ID }]));
});

const readyLesson = (over = {}) => ({
  _id: new mongoose.Types.ObjectId().toString(),
  title: "Buổi 1",
  topicId: TOPIC_ID,
  description: "Học sinh hiểu được X",
  content: [{ id: "c1", type: "TEXT", text: "..." }],
  ...over,
});

const readyAssignment = (over = {}) => ({
  topicId: TOPIC_ID,
  solutionResources: [{ url: "http://x" }],
  ...over,
});

describe("checkCohortLearningMaterialsReady", () => {
  it("Đủ số buổi (đủ 4 thành phần) >= cohortSessionCount → ready=true", async () => {
    lessonFind.mockReturnValue(mongooseQuery([readyLesson(), readyLesson({ title: "Buổi 2" })]));
    assignmentFind.mockReturnValue(mongooseQuery([readyAssignment(), readyAssignment()]));

    const result = await checkCohortLearningMaterialsReady(CLASS_ID);

    expect(result.ready).toBe(true);
    expect(result.readyLessonCount).toBe(2);
  });

  it("Lesson thiếu description (mục tiêu) → không tính là sẵn sàng", async () => {
    lessonFind.mockReturnValue(
      mongooseQuery([readyLesson({ description: "" }), readyLesson({ title: "Buổi 2" })])
    );
    assignmentFind.mockReturnValue(mongooseQuery([readyAssignment(), readyAssignment()]));

    const result = await checkCohortLearningMaterialsReady(CLASS_ID);

    expect(result.ready).toBe(false);
    expect(result.readyLessonCount).toBe(1);
    expect(result.details[0].missingParts).toContain("mục tiêu buổi học (description)");
  });

  it("Lesson thiếu content (học liệu) → không tính là sẵn sàng", async () => {
    lessonFind.mockReturnValue(
      mongooseQuery([readyLesson({ content: [] }), readyLesson({ title: "Buổi 2" })])
    );
    assignmentFind.mockReturnValue(mongooseQuery([readyAssignment(), readyAssignment()]));

    const result = await checkCohortLearningMaterialsReady(CLASS_ID);

    expect(result.details[0].missingParts).toContain("học liệu chính (content)");
  });

  it("Không có Assignment cùng topicId → thiếu bài tập/hoạt động", async () => {
    lessonFind.mockReturnValue(mongooseQuery([readyLesson()]));
    assignmentFind.mockReturnValue(mongooseQuery([])); // không có assignment nào

    const result = await checkCohortLearningMaterialsReady(CLASS_ID);

    expect(result.details[0].missingParts).toContain(
      "bài tập/hoạt động (chưa có Assignment cùng topicId)"
    );
  });

  it("Assignment có nhưng thiếu solutionResources → thiếu đáp án/hướng dẫn chấm", async () => {
    lessonFind.mockReturnValue(mongooseQuery([readyLesson()]));
    assignmentFind.mockReturnValue(mongooseQuery([readyAssignment({ solutionResources: [] })]));

    const result = await checkCohortLearningMaterialsReady(CLASS_ID);

    expect(result.details[0].missingParts).toContain(
      "đáp án/hướng dẫn chấm (Assignment.solutionResources)"
    );
  });

  it("Số buổi sẵn sàng ÍT HƠN cohortSessionCount → ready=false dù các buổi có đều đủ 4 thành phần", async () => {
    lessonFind.mockReturnValue(mongooseQuery([readyLesson()])); // chỉ 1 buổi, cần 2
    assignmentFind.mockReturnValue(mongooseQuery([readyAssignment()]));

    const result = await checkCohortLearningMaterialsReady(CLASS_ID);

    expect(result.ready).toBe(false);
    expect(result.readyLessonCount).toBe(1);
    expect(result.sessionCount).toBe(2);
  });

  it("Lớp không tồn tại → NotFoundError", async () => {
    classFindById.mockReturnValue({ lean: () => Promise.resolve(null) });
    await expect(checkCohortLearningMaterialsReady(CLASS_ID)).rejects.toMatchObject({
      status: 404,
    });
  });

  it("Lớp chưa khai báo cohortSessionCount → BusinessRuleError", async () => {
    classFindById.mockReturnValue({
      lean: () => Promise.resolve({ _id: CLASS_ID, courseId: COURSE_ID, cohortSessionCount: null }),
    });
    await expect(checkCohortLearningMaterialsReady(CLASS_ID)).rejects.toMatchObject({
      status: 422,
    });
  });
});

describe("assertCohortReadyForConfirmation", () => {
  it("Ném BusinessRuleError kèm danh sách buổi thiếu khi chưa sẵn sàng", async () => {
    lessonFind.mockReturnValue(mongooseQuery([readyLesson({ description: "" })]));
    assignmentFind.mockReturnValue(mongooseQuery([readyAssignment()]));

    await expect(assertCohortReadyForConfirmation(CLASS_ID)).rejects.toMatchObject({
      status: 422,
    });
  });

  it("Không ném lỗi khi đã sẵn sàng", async () => {
    lessonFind.mockReturnValue(mongooseQuery([readyLesson(), readyLesson({ title: "Buổi 2" })]));
    assignmentFind.mockReturnValue(mongooseQuery([readyAssignment(), readyAssignment()]));

    await expect(assertCohortReadyForConfirmation(CLASS_ID)).resolves.toMatchObject({
      ready: true,
    });
  });
});
