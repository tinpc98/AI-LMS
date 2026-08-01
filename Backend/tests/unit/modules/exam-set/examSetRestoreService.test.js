// Port từ src/scripts/runExamSetRestoreServiceTests.js (characterization test).
import { describe, it, expect, afterEach, vi } from "vitest";
import ExamSet from "#modules/exam-set/examSet.model.js";
import { Folder } from "#modules/folder";
import { restoreExamSetVersionService } from "#modules/exam-set/examSetVersion.service.js";

const createExamSet = (props = {}) => {
  const base = {
    _id: "607f1f77bcf86cd799439111",
    ownerId: "507f1f77bcf86cd799439011",
    folderId: "607f1f77bcf86cd799439022",
    title: "Orig",
    description: "d",
    tags: ["t"],
    status: "published",
    versionNumber: 1,
    version: 1,
    rootExamSetId: null,
    previousVersionId: null,
    isLatestVersion: true,
    questions: [
      {
        _id: "507f1f77bcf86cd799439222",
        questionId: "q1",
        content: "c1",
        options: [],
        acceptedAnswers: [],
        rubric: [],
        points: 10,
      },
    ],
    isDeleted: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    toObject() {
      return { ...this, questions: this.questions.map((q) => ({ ...q })) };
    },
  };
  return { ...base, ...props };
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("restoreExamSetVersionService", () => {
  it("Owner can restore older version and latest updated", async () => {
    const src = createExamSet({
      _id: "607f1f77bcf86cd799439101",
      versionNumber: 1,
      ownerId: "owner-1",
    });
    const v3 = createExamSet({
      _id: "607f1f77bcf86cd799439103",
      versionNumber: 3,
      ownerId: "owner-1",
      isLatestVersion: true,
    });
    v3.save = async function () {
      return this;
    };

    vi.spyOn(ExamSet, "findOne").mockImplementation((query) => {
      if (query && String(query._id) === String(src._id) && query.isDeleted === false) return src;
      return {
        sort() {
          return v3;
        },
      };
    });
    vi.spyOn(ExamSet.prototype, "save").mockImplementation(async function () {
      return this;
    });
    vi.spyOn(ExamSet.prototype, "populate").mockImplementation(function () {
      return this;
    });
    vi.spyOn(Folder, "findOne").mockImplementation(async () => ({
      _id: src.folderId,
      ownerId: src.ownerId,
      isDeleted: false,
    }));

    const newV = await restoreExamSetVersionService(src._id, "owner-1", "teacher");

    expect(newV.status).toBe("draft");
    expect(newV.versionNumber).toBe(4);
    expect(String(newV.previousVersionId)).toBe(String(v3._id));
    expect(newV.isLatestVersion).toBe(true);
    expect(newV.questions.length).toBe(1);
    expect(String(newV.questions[0]._id)).not.toBe(String(src.questions[0]._id));
  });

  it("Admin can restore", async () => {
    const src = createExamSet({
      _id: "607f1f77bcf86cd799439201",
      versionNumber: 1,
      ownerId: "owner-a",
    });
    const latest = createExamSet({
      _id: "607f1f77bcf86cd799439203",
      versionNumber: 2,
      ownerId: "owner-a",
      isLatestVersion: true,
    });
    latest.save = async function () {
      return this;
    };

    vi.spyOn(ExamSet, "findOne").mockImplementation((query) => {
      if (query && String(query._id) === String(src._id) && query.isDeleted === false) return src;
      return {
        sort() {
          return latest;
        },
      };
    });
    vi.spyOn(ExamSet.prototype, "save").mockImplementation(async function () {
      return this;
    });
    vi.spyOn(Folder, "findOne").mockImplementation(async () => null);

    const newV = await restoreExamSetVersionService(src._id, "admin-1", "Admin");
    expect(newV.status).toBe("draft");
    expect(String(newV.previousVersionId)).toBe(String(latest._id));
  });

  it("Cannot restore soft-deleted source", async () => {
    const src = createExamSet({ _id: "607f1f77bcf86cd799439301", isDeleted: true });
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => null);

    await expect(restoreExamSetVersionService(src._id, "owner-1", "teacher")).rejects.toMatchObject(
      { status: 404 }
    );
  });
});
