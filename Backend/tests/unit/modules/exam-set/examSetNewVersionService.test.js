// Port từ src/scripts/runExamSetNewVersionServiceTests.js (characterization test).
import { describe, it, expect, afterEach, vi } from "vitest";
import ExamSet from "#modules/exam-set/examSet.model.js";
import { Folder } from "#modules/folder";
import { createNewExamSetVersionService } from "#modules/exam-set/examSet.service.js";

const createQueryMock = (result) => ({
  sort() {
    return this;
  },
  select() {
    return this;
  },
  lean() {
    return result;
  },
  populate() {
    return this;
  },
  exec: async () => result,
  then: async (resolve, reject) => {
    try {
      const value = await result;
      return resolve ? resolve(value) : value;
    } catch (err) {
      return reject ? reject(err) : Promise.reject(err);
    }
  },
});

const createExamSet = (props = {}) => {
  const base = {
    _id: "607f1f77bcf86cd799439111",
    ownerId: "507f1f77bcf86cd799439011",
    folderId: "607f1f77bcf86cd799439022",
    title: "Sample Exam Set",
    description: "Original description",
    tags: ["math"],
    status: "published",
    versionNumber: 1,
    version: 1,
    rootExamSetId: null,
    previousVersionId: null,
    isLatestVersion: true,
    questions: [
      {
        _id: "507f1f77bcf86cd799439222",
        questionId: "q-1",
        order: 0,
        type: "short_answer",
        content: "What is 2+2?",
        points: 10,
        difficulty: "easy",
        correctAnswer: "4",
        options: [],
        acceptedAnswers: [],
        rubric: [],
        suggestedAnswer: "4",
      },
    ],
    isDeleted: false,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    toObject() {
      return {
        ...this,
        questions: Array.isArray(this.questions) ? this.questions.map((q) => ({ ...q })) : [],
      };
    },
  };

  return {
    ...base,
    save: async function () {
      this.updatedAt = new Date();
      return this;
    },
    ...props,
  };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createNewExamSetVersionService", () => {
  it("Owner can create a new version from the latest published exam set", async () => {
    const sourceExamSet = createExamSet();
    const folder = {
      _id: sourceExamSet.folderId,
      ownerId: sourceExamSet.ownerId,
      isDeleted: false,
    };

    vi.spyOn(ExamSet, "findOne").mockImplementation((query) => {
      if (query && query._id === sourceExamSet._id && query.isDeleted === false) {
        return createQueryMock(sourceExamSet);
      }
      if (query && query.$or) {
        return createQueryMock({ versionNumber: sourceExamSet.versionNumber });
      }
      return createQueryMock(null);
    });
    vi.spyOn(Folder, "findOne").mockImplementation(async () => folder);
    vi.spyOn(ExamSet.prototype, "save").mockImplementation(async function () {
      this.updatedAt = new Date();
      return this;
    });

    const result = await createNewExamSetVersionService(
      sourceExamSet._id,
      sourceExamSet.ownerId,
      "Teacher"
    );

    expect(result.versionNumber).toBe(2);
    expect(result.status).toBe("draft");
    expect(String(result.previousVersionId)).toBe(String(sourceExamSet._id));
    expect(String(result.rootExamSetId)).toBe(String(sourceExamSet._id));
    expect(result.isLatestVersion).toBe(true);
    expect(String(result.ownerId)).toBe(String(sourceExamSet.ownerId));
    expect(result.questions.length).toBe(1);
    expect(result.questions[0]._id).not.toBe(sourceExamSet.questions[0]._id);
    expect(sourceExamSet.isLatestVersion).toBe(false);
    expect(String(sourceExamSet.rootExamSetId)).toBe(String(sourceExamSet._id));
  });

  it("Non-owner non-admin cannot create a new version", async () => {
    const sourceExamSet = createExamSet();
    vi.spyOn(ExamSet, "findOne").mockImplementation((query) => {
      if (query && query._id === sourceExamSet._id && query.isDeleted === false) {
        return createQueryMock(sourceExamSet);
      }
      return createQueryMock(null);
    });
    vi.spyOn(Folder, "findOne").mockImplementation(async () => null);
    vi.spyOn(ExamSet.prototype, "save").mockImplementation(async function () {
      return this;
    });

    await expect(
      createNewExamSetVersionService(sourceExamSet._id, "student-1", "Student")
    ).rejects.toMatchObject({ status: 403 });
  });

  it("Cannot create a new version when source is not latest", async () => {
    const sourceExamSet = createExamSet({ isLatestVersion: false });
    vi.spyOn(ExamSet, "findOne").mockImplementation((query) => {
      if (query && query._id === sourceExamSet._id && query.isDeleted === false) {
        return createQueryMock(sourceExamSet);
      }
      return createQueryMock(null);
    });
    vi.spyOn(Folder, "findOne").mockImplementation(async () => null);
    vi.spyOn(ExamSet.prototype, "save").mockImplementation(async function () {
      return this;
    });

    await expect(
      createNewExamSetVersionService(sourceExamSet._id, sourceExamSet.ownerId, "Teacher")
    ).rejects.toMatchObject({ status: 409 });
  });

  it("Cannot create a new version from a draft source", async () => {
    const sourceExamSet = createExamSet({ status: "draft" });
    vi.spyOn(ExamSet, "findOne").mockImplementation((query) => {
      if (query && query._id === sourceExamSet._id && query.isDeleted === false) {
        return createQueryMock(sourceExamSet);
      }
      return createQueryMock(null);
    });
    vi.spyOn(Folder, "findOne").mockImplementation(async () => null);
    vi.spyOn(ExamSet.prototype, "save").mockImplementation(async function () {
      return this;
    });

    await expect(
      createNewExamSetVersionService(sourceExamSet._id, sourceExamSet.ownerId, "Teacher")
    ).rejects.toMatchObject({ status: 409 });
  });
});
