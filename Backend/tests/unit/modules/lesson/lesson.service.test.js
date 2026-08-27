// Test cho lesson.service.js — TÍNH NĂNG MỚI (mục 1): CRUD Lesson theo block, BR-1.1/BR-1.2.
import { describe, it, expect, vi, beforeEach } from "vitest";

const lessonFindById = vi.fn();
const lessonSave = vi.fn().mockResolvedValue(true);
const topicFindById = vi.fn();
const quizCreate = vi.fn();

vi.mock("#modules/lesson/lesson.model.js", () => {
  class LessonMock {
    constructor(data) {
      Object.assign(this, data);
    }
    save = lessonSave;
  }
  LessonMock.findById = (...a) => lessonFindById(...a);
  return { default: LessonMock };
});
vi.mock("#modules/lesson/practiceQuiz.model.js", () => ({
  default: { create: (...a) => quizCreate(...a) },
}));
vi.mock("#modules/topic", () => ({
  Topic: { findById: (...a) => topicFindById(...a) },
}));
vi.mock("../course/course.model.js", () => ({ default: {} }));
const uploadFile = vi.fn();
vi.mock("#shared/services/storage.service.js", () => ({
  default: { uploadFile: (...a) => uploadFile(...a) },
}));
const progressCountDocuments = vi.fn();
vi.mock("#modules/lesson/lessonProgress.model.js", () => ({
  default: { countDocuments: (...a) => progressCountDocuments(...a) },
}));

const {
  createLessonService,
  updateLessonService,
  updateLessonStatusService,
  createPracticeQuizService,
  uploadLessonDocumentService,
  deleteLessonService,
  checkTopicTeacherOwnership,
} = await import("#modules/lesson/lesson.service.js");

const TOPIC_ID = "topic-1";
const TEACHER_ID = "teacher-1";
const OTHER_TEACHER_ID = "teacher-2";

const populateTopic = (createdBy) => ({
  populate: () =>
    Promise.resolve({ _id: TOPIC_ID, courseId: { createdBy: { toString: () => createdBy } } }),
});

beforeEach(() => {
  vi.clearAllMocks();
  topicFindById.mockReturnValue(populateTopic(TEACHER_ID));
  progressCountDocuments.mockResolvedValue(0);
});

describe("checkTopicTeacherOwnership", () => {
  it("Admin luôn được phép, bất kể chủ Topic là ai", async () => {
    const result = await checkTopicTeacherOwnership(TOPIC_ID, OTHER_TEACHER_ID, "admin");
    expect(result).toBe(true);
  });

  it("Đúng giáo viên sở hữu Course chứa Topic → được phép", async () => {
    const result = await checkTopicTeacherOwnership(TOPIC_ID, TEACHER_ID, "teacher");
    expect(result).toBe(true);
  });

  it("Giáo viên khác (không sở hữu) → bị từ chối", async () => {
    const result = await checkTopicTeacherOwnership(TOPIC_ID, OTHER_TEACHER_ID, "teacher");
    expect(result).toBe(false);
  });
});

describe("createLessonService", () => {
  it("Thiếu topicId → BusinessRuleError", async () => {
    await expect(createLessonService({ title: "T" }, TEACHER_ID, "teacher")).rejects.toThrow(
      /topicId/
    );
  });

  it("Thiếu title → BusinessRuleError", async () => {
    await expect(createLessonService({ topicId: TOPIC_ID }, TEACHER_ID, "teacher")).rejects.toThrow(
      /tiêu đề/i
    );
  });

  it("Giáo viên không sở hữu Topic → AuthorizationError", async () => {
    await expect(
      createLessonService({ topicId: TOPIC_ID, title: "T" }, OTHER_TEACHER_ID, "teacher")
    ).rejects.toThrow(/quyền/);
  });

  it("BR-1.2: quá 1 block PRACTICE_QUIZ → BusinessRuleError", async () => {
    const blocks = [
      { type: "PRACTICE_QUIZ", quizId: "q1" },
      { type: "PRACTICE_QUIZ", quizId: "q2" },
    ];
    await expect(
      createLessonService({ topicId: TOPIC_ID, title: "T", blocks }, TEACHER_ID, "teacher")
    ).rejects.toThrow(/tối đa 1 block Practice Quiz/);
  });

  it("Block VIDEO thiếu externalId → BusinessRuleError", async () => {
    const blocks = [{ type: "VIDEO", video: {} }];
    await expect(
      createLessonService({ topicId: TOPIC_ID, title: "T", blocks }, TEACHER_ID, "teacher")
    ).rejects.toThrow(/VIDEO thiếu/);
  });

  it("BR-1.1: publish Lesson rỗng (0 block) → BusinessRuleError", async () => {
    await expect(
      createLessonService(
        { topicId: TOPIC_ID, title: "T", status: "PUBLISHED" },
        TEACHER_ID,
        "teacher"
      )
    ).rejects.toThrow(/ít nhất 1 block/);
  });

  it("Hợp lệ → tạo thành công, mặc định status DRAFT", async () => {
    const blocks = [{ type: "VIDEO", video: { externalId: "abc" } }];
    const lesson = await createLessonService(
      { topicId: TOPIC_ID, title: "T", blocks },
      TEACHER_ID,
      "teacher"
    );
    expect(lessonSave).toHaveBeenCalled();
    expect(lesson.status).toBe("DRAFT");
    expect(lesson.createdBy).toBe(TEACHER_ID);
  });
});

describe("updateLessonService", () => {
  it("Lesson không tồn tại → NotFoundError", async () => {
    lessonFindById.mockResolvedValue(null);
    await expect(updateLessonService("l1", { title: "X" }, TEACHER_ID, "teacher")).rejects.toThrow(
      /không tồn tại/
    );
  });

  it("Không sở hữu Topic → AuthorizationError", async () => {
    lessonFindById.mockResolvedValue({ topicId: TOPIC_ID });
    await expect(
      updateLessonService("l1", { title: "X" }, OTHER_TEACHER_ID, "teacher")
    ).rejects.toThrow(/quyền/);
  });

  it("Hợp lệ → cập nhật field truyền vào, giữ nguyên field không truyền", async () => {
    const lesson = { topicId: TOPIC_ID, title: "Old", description: "OldDesc", save: lessonSave };
    lessonFindById.mockResolvedValue(lesson);

    await updateLessonService("l1", { title: "New" }, TEACHER_ID, "teacher");

    expect(lesson.title).toBe("New");
    expect(lesson.description).toBe("OldDesc");
    expect(lessonSave).toHaveBeenCalled();
  });
});

describe("updateLessonStatusService", () => {
  it("Trạng thái không hợp lệ → BusinessRuleError", async () => {
    await expect(updateLessonStatusService("l1", "WEIRD", TEACHER_ID, "teacher")).rejects.toThrow(
      /không hợp lệ/
    );
  });

  it("BR-1.1: publish Lesson không có block → BusinessRuleError", async () => {
    lessonFindById.mockResolvedValue({ topicId: TOPIC_ID, blocks: [], save: lessonSave });
    await expect(
      updateLessonStatusService("l1", "PUBLISHED", TEACHER_ID, "teacher")
    ).rejects.toThrow(/ít nhất 1 block/);
  });

  it("Có block → publish thành công", async () => {
    const lesson = { topicId: TOPIC_ID, blocks: [{ type: "VIDEO" }], save: lessonSave };
    lessonFindById.mockResolvedValue(lesson);
    const result = await updateLessonStatusService("l1", "PUBLISHED", TEACHER_ID, "teacher");
    expect(result.status).toBe("PUBLISHED");
  });
});

describe("createPracticeQuizService", () => {
  it("Thiếu title → BusinessRuleError", async () => {
    await expect(
      createPracticeQuizService({ questions: [{ questionId: "q1" }] }, TEACHER_ID)
    ).rejects.toThrow(/tiêu đề/i);
  });

  it("Không có câu hỏi nào → BusinessRuleError", async () => {
    await expect(
      createPracticeQuizService({ title: "Quiz", questions: [] }, TEACHER_ID)
    ).rejects.toThrow(/ít nhất 1 câu hỏi/);
  });

  it("Hợp lệ → tạo quiz với order mặc định theo index", async () => {
    quizCreate.mockResolvedValue({ _id: "quiz-1" });
    await createPracticeQuizService(
      { title: "Quiz", questions: [{ questionId: "q1" }, { questionId: "q2" }] },
      TEACHER_ID
    );

    expect(quizCreate).toHaveBeenCalledWith({
      title: "Quiz",
      questions: [
        { questionId: "q1", order: 0 },
        { questionId: "q2", order: 1 },
      ],
      createdBy: TEACHER_ID,
    });
  });
});

describe("uploadLessonDocumentService", () => {
  it("Không có file → BusinessRuleError", async () => {
    await expect(uploadLessonDocumentService(null, TEACHER_ID)).rejects.toThrow(/tải lên/);
  });

  it("Ảnh (detectedMime image/*) → resourceType 'image'", async () => {
    uploadFile.mockResolvedValue({ publicId: "pub-1", format: "png", bytes: 1234 });
    const file = { buffer: Buffer.from(""), originalname: "a.png", detectedMime: "image/png" };

    const result = await uploadLessonDocumentService(file, TEACHER_ID);

    expect(uploadFile).toHaveBeenCalledWith(file.buffer, "a.png", {
      folder: `eduspace/lessons/documents/${TEACHER_ID}`,
      resourceType: "image",
    });
    expect(result).toEqual({ publicId: "pub-1", fileType: "png", bytes: 1234, title: "a.png" });
  });

  it("PDF (không phải ảnh) → resourceType 'raw'", async () => {
    uploadFile.mockResolvedValue({ publicId: "pub-2", format: "pdf", bytes: 5678 });
    const file = {
      buffer: Buffer.from(""),
      originalname: "b.pdf",
      detectedMime: "application/pdf",
    };

    await uploadLessonDocumentService(file, TEACHER_ID);

    expect(uploadFile).toHaveBeenCalledWith(
      file.buffer,
      "b.pdf",
      expect.objectContaining({ resourceType: "raw" })
    );
  });
});

describe("deleteLessonService", () => {
  it("Lesson không tồn tại → NotFoundError", async () => {
    lessonFindById.mockResolvedValue(null);
    await expect(deleteLessonService("l1", TEACHER_ID, "teacher")).rejects.toThrow(/không tồn tại/);
  });

  it("Không sở hữu Topic → AuthorizationError", async () => {
    lessonFindById.mockResolvedValue({ topicId: TOPIC_ID });
    await expect(deleteLessonService("l1", OTHER_TEACHER_ID, "teacher")).rejects.toThrow(/quyền/);
  });

  it("Đã có học sinh phát sinh tiến độ → BusinessRuleError, không xóa", async () => {
    const softDelete = vi.fn();
    lessonFindById.mockResolvedValue({ topicId: TOPIC_ID, softDelete });
    progressCountDocuments.mockResolvedValue(3);

    await expect(deleteLessonService("l1", TEACHER_ID, "teacher")).rejects.toThrow(
      /không thể xóa/i
    );
    expect(softDelete).not.toHaveBeenCalled();
  });

  it("Chưa có tiến độ nào → xóa mềm thành công", async () => {
    const softDelete = vi.fn().mockResolvedValue(true);
    lessonFindById.mockResolvedValue({ topicId: TOPIC_ID, softDelete });
    progressCountDocuments.mockResolvedValue(0);

    await deleteLessonService("l1", TEACHER_ID, "teacher");
    expect(softDelete).toHaveBeenCalledWith(TEACHER_ID);
  });
});
