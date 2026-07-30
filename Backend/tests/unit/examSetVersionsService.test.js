// Port từ src/scripts/runExamSetVersionsServiceTests.js (characterization test).
import { describe, it, expect, afterEach, vi } from "vitest";
import ExamSet from "../../src/models/examSet.model.js";
import { getExamSetVersionsService } from "../../src/services/examSet.services.js";

const createExamSet = (props = {}) => ({
  _id: "607f1f77bcf86cd799439111",
  ownerId: "507f1f77bcf86cd799439011",
  title: "Sample Exam",
  versionNumber: 1,
  status: "published",
  rootExamSetId: null,
  previousVersionId: null,
  isLatestVersion: true,
  questionCount: 1,
  totalPoints: 10,
  createdAt: new Date("2024-01-01T00:00:00Z"),
  updatedAt: new Date("2024-01-02T00:00:00Z"),
  publishedAt: new Date("2024-01-03T00:00:00Z"),
  ...props,
});

const mockFindList = (versions) => ({
  select() {
    return this;
  },
  lean() {
    return this;
  },
  sort() {
    return this;
  },
  skip() {
    return this;
  },
  limit() {
    return this;
  },
  exec: async () => versions,
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getExamSetVersionsService", () => {
  it("Owner can retrieve full lineage versions sorted desc", async () => {
    const source = createExamSet({ _id: "607f1f77bcf86cd799439101", ownerId: "owner-1", rootExamSetId: null, versionNumber: 2 });
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => ({ lean: () => source }));

    const versions = [
      { _id: "607f1f77bcf86cd799439103", title: "v3", versionNumber: 3, isLatestVersion: true, ownerId: "owner-1", questionCount: 3, totalPoints: 30, createdAt: new Date(), updatedAt: new Date(), publishedAt: null },
      { _id: "607f1f77bcf86cd799439102", title: "v2", versionNumber: 2, isLatestVersion: false, ownerId: "owner-1", questionCount: 2, totalPoints: 20, createdAt: new Date(), updatedAt: new Date(), publishedAt: null },
      { _id: "607f1f77bcf86cd799439101", title: "v1", versionNumber: 1, isLatestVersion: false, ownerId: "owner-1", questionCount: 1, totalPoints: 10, createdAt: new Date(), updatedAt: new Date(), publishedAt: null },
    ];
    vi.spyOn(ExamSet, "find").mockImplementation(() => mockFindList(versions));
    vi.spyOn(ExamSet, "countDocuments").mockImplementation(async () => versions.length);

    const res = await getExamSetVersionsService(source._id, "owner-1", "teacher", { page: 1, limit: 10, sort: "desc" });

    expect(res.versions.length).toBe(3);
    expect(res.versions[0].versionNumber).toBe(3);
    expect(res.pagination.totalItems).toBe(3);
  });

  it("Sort asc works", async () => {
    const source = createExamSet({ _id: "607f1f77bcf86cd799439201", ownerId: "owner-2", rootExamSetId: "607f1f77bcf86cd799439201", versionNumber: 2 });
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => ({ lean: () => source }));

    const versions = [
      { _id: "607f1f77bcf86cd799439202", versionNumber: 1, ownerId: "owner-2", questionCount: 1, totalPoints: 10, createdAt: new Date(), updatedAt: new Date() },
      { _id: "607f1f77bcf86cd799439203", versionNumber: 2, ownerId: "owner-2", questionCount: 2, totalPoints: 20, createdAt: new Date(), updatedAt: new Date() },
    ];
    vi.spyOn(ExamSet, "find").mockImplementation(() => mockFindList(versions));
    vi.spyOn(ExamSet, "countDocuments").mockImplementation(async () => versions.length);

    const res = await getExamSetVersionsService(source._id, "owner-2", "teacher", { page: 1, limit: 10, sort: "asc" });
    expect(res.versions[0].versionNumber).toBe(1);
  });

  it("Source without rootExamSetId uses its own id as root", async () => {
    const source = createExamSet({ _id: "607f1f77bcf86cd799439301", ownerId: "owner-3", rootExamSetId: null, versionNumber: 1 });
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => ({ lean: () => source }));

    const versions = [{ _id: "607f1f77bcf86cd799439301", versionNumber: 1, ownerId: "owner-3", questionCount: 1, totalPoints: 10, createdAt: new Date(), updatedAt: new Date() }];
    vi.spyOn(ExamSet, "find").mockImplementation(() => mockFindList(versions));
    vi.spyOn(ExamSet, "countDocuments").mockImplementation(async () => 1);

    const res = await getExamSetVersionsService(source._id, "owner-3", "teacher", {});
    expect(res.versions.length).toBe(1);
    expect(res.rootExamSetId).toBe(String(source._id));
  });

  it("Unauthorized user cannot access lineage", async () => {
    const source = createExamSet({ _id: "607f1f77bcf86cd799439401", ownerId: "owner-x", rootExamSetId: null });
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => ({ lean: () => source }));

    await expect(
      getExamSetVersionsService(source._id, "someone-else", "teacher", {})
    ).rejects.toMatchObject({ status: 404 });
  });
});
