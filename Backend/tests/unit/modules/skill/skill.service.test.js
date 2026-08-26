// Test cho skill.service.js — TÍNH NĂNG MỚI (mục 6): Skill là nhãn phân loại câu hỏi, scope
// theo Topic, không có mastery-level scoring (giai đoạn 2).
import { describe, it, expect, vi, beforeEach } from "vitest";

const skillFindById = vi.fn();
const skillFind = vi.fn();
const skillCreate = vi.fn();
const skillCountDocuments = vi.fn();
const topicFindById = vi.fn();
const courseFindById = vi.fn();
const questionCountDocuments = vi.fn();

vi.mock("#modules/skill/skill.model.js", () => ({
  default: {
    findById: (...a) => skillFindById(...a),
    find: (...a) => skillFind(...a),
    create: (...a) => skillCreate(...a),
    countDocuments: (...a) => skillCountDocuments(...a),
  },
}));
vi.mock("#modules/topic", () => ({ Topic: { findById: (...a) => topicFindById(...a) } }));
vi.mock("#modules/course", () => ({ Course: { findById: (...a) => courseFindById(...a) } }));
vi.mock("#modules/question", () => ({
  Question: { countDocuments: (...a) => questionCountDocuments(...a) },
}));

const {
  createSkillService,
  getSkillsByTopicService,
  updateSkillService,
  archiveSkillService,
  restoreSkillService,
  deleteSkillService,
} = await import("#modules/skill/skill.service.js");

const TOPIC_ID = "topic-1";
const COURSE_ID = "course-1";
const TEACHER_ID = "teacher-1";
const OTHER_TEACHER_ID = "teacher-2";
const SKILL_ID = "507f1f77bcf86cd799439011";

beforeEach(() => {
  vi.clearAllMocks();
  topicFindById.mockResolvedValue({ _id: TOPIC_ID, courseId: COURSE_ID });
  courseFindById.mockReturnValue({
    select: () => ({ lean: () => Promise.resolve({ createdBy: TEACHER_ID }) }),
  });
});

describe("createSkillService", () => {
  it("Thiếu topicId → BusinessRuleError", async () => {
    await expect(createSkillService({ name: "Đạo hàm" }, TEACHER_ID, "teacher")).rejects.toThrow(
      /topicId/
    );
  });

  it("Thiếu tên → BusinessRuleError", async () => {
    await expect(createSkillService({ topicId: TOPIC_ID }, TEACHER_ID, "teacher")).rejects.toThrow(
      /tên/i
    );
  });

  it("Giáo viên không sở hữu Course chứa Topic → AuthorizationError", async () => {
    await expect(
      createSkillService({ topicId: TOPIC_ID, name: "Đạo hàm" }, OTHER_TEACHER_ID, "teacher")
    ).rejects.toThrow(/quyền/);
  });

  it("Hợp lệ → tạo Skill, order = số Skill hiện có trong Topic", async () => {
    skillCountDocuments.mockResolvedValue(3);
    skillCreate.mockResolvedValue({ _id: SKILL_ID });

    await createSkillService({ topicId: TOPIC_ID, name: "Đạo hàm" }, TEACHER_ID, "teacher");

    expect(skillCreate).toHaveBeenCalledWith({
      topicId: TOPIC_ID,
      name: "Đạo hàm",
      description: "",
      order: 3,
    });
  });

  it("Admin luôn được phép, bất kể Topic thuộc Course của ai", async () => {
    skillCountDocuments.mockResolvedValue(0);
    skillCreate.mockResolvedValue({ _id: SKILL_ID });

    await expect(
      createSkillService({ topicId: TOPIC_ID, name: "Đạo hàm" }, OTHER_TEACHER_ID, "admin")
    ).resolves.toBeTruthy();
  });
});

describe("getSkillsByTopicService", () => {
  it("Mặc định ẩn Skill ARCHIVED", async () => {
    skillFind.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve([]) }) });

    await getSkillsByTopicService(TOPIC_ID);

    expect(skillFind).toHaveBeenCalledWith({ topicId: TOPIC_ID, status: "ACTIVE" });
  });

  it("includeArchived=true → lấy cả ARCHIVED", async () => {
    skillFind.mockReturnValue({ sort: () => ({ lean: () => Promise.resolve([]) }) });

    await getSkillsByTopicService(TOPIC_ID, { includeArchived: true });

    expect(skillFind).toHaveBeenCalledWith({ topicId: TOPIC_ID });
  });
});

describe("updateSkillService", () => {
  it("Không tìm thấy Skill → NotFoundError", async () => {
    skillFindById.mockResolvedValue(null);
    await expect(
      updateSkillService(SKILL_ID, { name: "X" }, TEACHER_ID, "teacher")
    ).rejects.toThrow(/không tồn tại|Không tìm thấy/);
  });

  it("Không sở hữu → AuthorizationError", async () => {
    skillFindById.mockResolvedValue({ topicId: TOPIC_ID, save: vi.fn() });
    await expect(
      updateSkillService(SKILL_ID, { name: "X" }, OTHER_TEACHER_ID, "teacher")
    ).rejects.toThrow(/quyền/);
  });

  it("Hợp lệ → cập nhật field truyền vào", async () => {
    const save = vi.fn().mockResolvedValue(true);
    const skill = { topicId: TOPIC_ID, name: "Cũ", description: "Mô tả cũ", save };
    skillFindById.mockResolvedValue(skill);

    await updateSkillService(SKILL_ID, { name: "Mới" }, TEACHER_ID, "teacher");

    expect(skill.name).toBe("Mới");
    expect(skill.description).toBe("Mô tả cũ");
    expect(save).toHaveBeenCalled();
  });
});

describe("archiveSkillService / restoreSkillService", () => {
  it("Archive Skill đang ACTIVE → chuyển ARCHIVED", async () => {
    const save = vi.fn().mockResolvedValue(true);
    skillFindById.mockResolvedValue({ topicId: TOPIC_ID, status: "ACTIVE", save });

    const result = await archiveSkillService(SKILL_ID, TEACHER_ID, "teacher");
    expect(result.status).toBe("ARCHIVED");
  });

  it("Archive Skill đã ARCHIVED → BusinessRuleError", async () => {
    skillFindById.mockResolvedValue({ topicId: TOPIC_ID, status: "ARCHIVED", save: vi.fn() });
    await expect(archiveSkillService(SKILL_ID, TEACHER_ID, "teacher")).rejects.toThrow(/ARCHIVED/);
  });

  it("Restore Skill đã ARCHIVED → chuyển ACTIVE", async () => {
    const save = vi.fn().mockResolvedValue(true);
    skillFindById.mockResolvedValue({ topicId: TOPIC_ID, status: "ARCHIVED", save });

    const result = await restoreSkillService(SKILL_ID, TEACHER_ID, "teacher");
    expect(result.status).toBe("ACTIVE");
  });
});

describe("deleteSkillService", () => {
  it("Còn câu hỏi gắn Skill này → BusinessRuleError, không xóa", async () => {
    const softDelete = vi.fn();
    skillFindById.mockResolvedValue({ topicId: TOPIC_ID, softDelete });
    questionCountDocuments.mockResolvedValue(2);

    await expect(deleteSkillService(SKILL_ID, TEACHER_ID, "teacher")).rejects.toThrow(
      /không thể xóa/i
    );
    expect(softDelete).not.toHaveBeenCalled();
  });

  it("Không còn câu hỏi nào gắn Skill → xóa mềm thành công", async () => {
    const softDelete = vi.fn().mockResolvedValue(true);
    skillFindById.mockResolvedValue({ topicId: TOPIC_ID, softDelete });
    questionCountDocuments.mockResolvedValue(0);

    await deleteSkillService(SKILL_ID, TEACHER_ID, "teacher");
    expect(softDelete).toHaveBeenCalledWith(TEACHER_ID);
  });
});
