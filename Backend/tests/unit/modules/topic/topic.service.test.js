// Test cho topic.service.js — TÍNH NĂNG MỚI: Quản lý Topic thật (đặc tả nghiệp vụ mục 2).
// Trước đây Topic chỉ có 3 field và không có CRUD/quy tắc nào; mỗi khóa học chỉ có đúng 1
// Topic mặc định tự sinh lúc tạo Lesson đầu tiên.
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

const topicFindById = vi.fn();
const topicFindOne = vi.fn();
const topicFind = vi.fn();
const topicCreate = vi.fn();
const topicCountDocuments = vi.fn();
const topicUpdateOne = vi.fn();
const courseFindById = vi.fn();
const lessonCountDocuments = vi.fn();
const assignmentCountDocuments = vi.fn();
const examCountDocuments = vi.fn();
const questionCountDocuments = vi.fn();
const perfCountDocuments = vi.fn();
const weaknessCountDocuments = vi.fn();
const evidenceCountDocuments = vi.fn();

vi.mock("#modules/topic/topic.model.js", () => ({
  default: {
    findById: (...a) => topicFindById(...a),
    findOne: (...a) => topicFindOne(...a),
    find: (...a) => topicFind(...a),
    create: (...a) => topicCreate(...a),
    countDocuments: (...a) => topicCountDocuments(...a),
    updateOne: (...a) => topicUpdateOne(...a),
  },
}));
vi.mock("#modules/course", () => ({ Course: { findById: (...a) => courseFindById(...a) } }));
vi.mock("#modules/lesson", () => ({
  Lesson: { countDocuments: (...a) => lessonCountDocuments(...a) },
}));
vi.mock("#modules/assignment", () => ({
  Assignment: { countDocuments: (...a) => assignmentCountDocuments(...a) },
}));
vi.mock("#modules/exam", () => ({ Exam: { countDocuments: (...a) => examCountDocuments(...a) } }));
vi.mock("#modules/question", () => ({
  Question: { countDocuments: (...a) => questionCountDocuments(...a) },
}));
vi.mock("#modules/performance/studentPerformance.model.js", () => ({
  default: { countDocuments: (...a) => perfCountDocuments(...a) },
}));
vi.mock("#modules/performance/weakness.model.js", () => ({
  default: { countDocuments: (...a) => weaknessCountDocuments(...a) },
}));
vi.mock("#modules/performance/performanceEvidence.model.js", () => ({
  default: { countDocuments: (...a) => evidenceCountDocuments(...a) },
}));

const topicService = await import("#modules/topic/topic.service.js");

const COURSE_ID = new mongoose.Types.ObjectId().toString();
const TOPIC_ID = new mongoose.Types.ObjectId().toString();
const TEACHER_ID = new mongoose.Types.ObjectId().toString();
const OTHER_TEACHER_ID = new mongoose.Types.ObjectId().toString();

const mongooseSelectLean = (result) => ({
  select: () => ({ lean: () => Promise.resolve(result) }),
});

beforeEach(() => {
  vi.clearAllMocks();
  lessonCountDocuments.mockResolvedValue(0);
  assignmentCountDocuments.mockResolvedValue(0);
  examCountDocuments.mockResolvedValue(0);
  questionCountDocuments.mockResolvedValue(0);
  perfCountDocuments.mockResolvedValue(0);
  weaknessCountDocuments.mockResolvedValue(0);
  evidenceCountDocuments.mockResolvedValue(0);
});

describe("createTopicService", () => {
  it("Giáo viên sở hữu khóa học → tạo thành công, order = số Topic hiện có", async () => {
    courseFindById.mockResolvedValue({ _id: COURSE_ID, createdBy: TEACHER_ID });
    topicCountDocuments.mockResolvedValue(3);
    topicCreate.mockResolvedValue({ _id: TOPIC_ID, name: "Đạo hàm", order: 3, status: "DRAFT" });

    const result = await topicService.createTopicService(
      { courseId: COURSE_ID, name: "Đạo hàm" },
      TEACHER_ID,
      "teacher"
    );

    expect(topicCreate).toHaveBeenCalledWith(
      expect.objectContaining({ order: 3, status: "DRAFT", createdBy: TEACHER_ID })
    );
    expect(result.order).toBe(3);
  });

  it("Giáo viên KHÔNG sở hữu khóa học → 403", async () => {
    courseFindById.mockResolvedValue({ _id: COURSE_ID, createdBy: TEACHER_ID });

    await expect(
      topicService.createTopicService(
        { courseId: COURSE_ID, name: "X" },
        OTHER_TEACHER_ID,
        "teacher"
      )
    ).rejects.toMatchObject({ status: 403 });
    expect(topicCreate).not.toHaveBeenCalled();
  });

  it("Admin tạo được cho bất kỳ khóa học nào", async () => {
    courseFindById.mockResolvedValue({ _id: COURSE_ID, createdBy: TEACHER_ID });
    topicCountDocuments.mockResolvedValue(0);
    topicCreate.mockResolvedValue({ _id: TOPIC_ID });

    await topicService.createTopicService({ courseId: COURSE_ID, name: "X" }, "admin-id", "admin");
    expect(topicCreate).toHaveBeenCalled();
  });

  it("Khóa học không tồn tại → 404", async () => {
    courseFindById.mockResolvedValue(null);
    await expect(
      topicService.createTopicService({ courseId: COURSE_ID, name: "X" }, TEACHER_ID, "teacher")
    ).rejects.toMatchObject({ status: 404 });
  });
});

describe("getTopicsByCourseService", () => {
  it("Mặc định (học sinh) → lọc bỏ ARCHIVED", async () => {
    topicFind.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve([]) }) });

    await topicService.getTopicsByCourseService(COURSE_ID);

    expect(topicFind).toHaveBeenCalledWith({ courseId: COURSE_ID, status: { $ne: "ARCHIVED" } });
  });

  it("includeArchived=true (giáo viên/admin) → lấy cả ARCHIVED", async () => {
    topicFind.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve([]) }) });

    await topicService.getTopicsByCourseService(COURSE_ID, { includeArchived: true });

    expect(topicFind).toHaveBeenCalledWith({ courseId: COURSE_ID });
  });
});

describe("publishTopicService / archiveTopicService", () => {
  it("DRAFT → publish thành công", async () => {
    const topic = { _id: TOPIC_ID, courseId: COURSE_ID, status: "DRAFT", save: vi.fn() };
    topicFindById.mockResolvedValue(topic);
    courseFindById.mockResolvedValue({ createdBy: TEACHER_ID });

    await topicService.publishTopicService(TOPIC_ID, TEACHER_ID, "teacher");
    expect(topic.status).toBe("PUBLISHED");
    expect(topic.save).toHaveBeenCalled();
  });

  it("Đã PUBLISHED → publish lại bị chặn", async () => {
    const topic = { _id: TOPIC_ID, courseId: COURSE_ID, status: "PUBLISHED", save: vi.fn() };
    topicFindById.mockResolvedValue(topic);
    courseFindById.mockResolvedValue({ createdBy: TEACHER_ID });

    await expect(
      topicService.publishTopicService(TOPIC_ID, TEACHER_ID, "teacher")
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it("Đã ARCHIVED → archive lại bị chặn", async () => {
    const topic = { _id: TOPIC_ID, courseId: COURSE_ID, status: "ARCHIVED", save: vi.fn() };
    topicFindById.mockResolvedValue(topic);
    courseFindById.mockResolvedValue({ createdBy: TEACHER_ID });

    await expect(
      topicService.archiveTopicService(TOPIC_ID, TEACHER_ID, "teacher")
    ).rejects.toMatchObject({
      status: 422,
    });
  });
});

describe("reorderTopicsService", () => {
  it("Danh sách khớp đủ → cập nhật order theo vị trí trong mảng", async () => {
    courseFindById.mockResolvedValue({ createdBy: TEACHER_ID });
    const ids = ["t1", "t2", "t3"];
    topicFind
      .mockReturnValueOnce({
        select: () => ({ lean: () => Promise.resolve(ids.map((_id) => ({ _id }))) }),
      })
      .mockReturnValueOnce({ sort: () => ({ lean: () => Promise.resolve([]) }) });
    topicUpdateOne.mockResolvedValue({});

    await topicService.reorderTopicsService(COURSE_ID, ["t2", "t3", "t1"], TEACHER_ID, "teacher");

    expect(topicUpdateOne).toHaveBeenCalledWith({ _id: "t2" }, { order: 0 });
    expect(topicUpdateOne).toHaveBeenCalledWith({ _id: "t3" }, { order: 1 });
    expect(topicUpdateOne).toHaveBeenCalledWith({ _id: "t1" }, { order: 2 });
  });

  it("Danh sách KHÔNG khớp (thiếu/thừa id) → từ chối, không ghi gì", async () => {
    courseFindById.mockResolvedValue({ createdBy: TEACHER_ID });
    topicFind.mockReturnValueOnce({
      select: () => ({ lean: () => Promise.resolve([{ _id: "t1" }, { _id: "t2" }]) }),
    });

    await expect(
      topicService.reorderTopicsService(COURSE_ID, ["t1"], TEACHER_ID, "teacher")
    ).rejects.toMatchObject({ status: 422 });
    expect(topicUpdateOne).not.toHaveBeenCalled();
  });
});

describe("deleteTopicService — BR-2.2/BR-2.3: chặn xóa nếu còn item hoặc còn dữ liệu học sinh", () => {
  const mockTopicFound = () => {
    const topic = {
      _id: TOPIC_ID,
      courseId: COURSE_ID,
      softDelete: vi.fn().mockResolvedValue(true),
    };
    topicFindById.mockResolvedValue(topic);
    courseFindById.mockResolvedValue({ createdBy: TEACHER_ID });
    return topic;
  };

  it("Còn Lesson đang hoạt động → chặn xóa", async () => {
    mockTopicFound();
    lessonCountDocuments.mockResolvedValue(2);

    await expect(
      topicService.deleteTopicService(TOPIC_ID, TEACHER_ID, "teacher")
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it("Còn Question đang hoạt động → chặn xóa", async () => {
    mockTopicFound();
    questionCountDocuments.mockResolvedValue(5);

    await expect(
      topicService.deleteTopicService(TOPIC_ID, TEACHER_ID, "teacher")
    ).rejects.toMatchObject({
      status: 422,
    });
  });

  it("0 item nhưng còn dữ liệu StudentPerformance → chặn xóa (chỉ archive được)", async () => {
    mockTopicFound();
    perfCountDocuments.mockResolvedValue(1);

    await expect(topicService.deleteTopicService(TOPIC_ID, TEACHER_ID, "teacher")).rejects.toThrow(
      /archive/
    );
  });

  it("0 item, 0 dữ liệu học sinh → xóa thành công (soft delete)", async () => {
    const topic = mockTopicFound();

    await topicService.deleteTopicService(TOPIC_ID, TEACHER_ID, "teacher");

    expect(topic.softDelete).toHaveBeenCalledWith(TEACHER_ID);
  });

  it("Giáo viên không sở hữu khóa học → 403, không xóa", async () => {
    const topic = mockTopicFound();
    courseFindById.mockResolvedValue({ createdBy: OTHER_TEACHER_ID });

    await expect(
      topicService.deleteTopicService(TOPIC_ID, TEACHER_ID, "teacher")
    ).rejects.toMatchObject({
      status: 403,
    });
    expect(topic.softDelete).not.toHaveBeenCalled();
  });
});
