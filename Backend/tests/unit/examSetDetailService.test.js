// Port từ src/scripts/runExamSetDetailServiceTests.js (characterization test).
import { describe, it, expect, afterEach, vi } from "vitest";
import ExamSet from "../../src/models/examSet.model.js";
import { getExamSetDetailService } from "../../src/services/examSet.service.js";

const createExamSet = (props = {}) => ({
  ...props,
  toObject() {
    const { toObject, populate, ...rest } = this;
    return rest;
  },
  populate() {
    return this;
  },
});

const createQueryMock = (result) => ({
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

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getExamSetDetailService", () => {
  it("Invalid examSetId should reject with 400", async () => {
    await expect(
      getExamSetDetailService("invalid-id", { id: "user-1", role: "Teacher" })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("Owner can retrieve own exam set detail", async () => {
    const examSet = createExamSet({
      _id: "507f1f77bcf86cd799439011",
      ownerId: { _id: "user-1", fullName: "Teacher A", avatar: "avatar.png" },
      folderId: { _id: "folder-1", name: "Math" },
      title: "Exam Set 1",
      description: "Description",
      status: "draft",
      tags: ["math"],
      questionCount: 1,
      totalPoints: 10,
      version: 1,
      questions: [{ questionId: "q-1", order: 0, type: "short_answer", content: "What is 2+2?", points: 10, correctAnswer: "4" }],
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    });
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => createQueryMock(examSet));

    const result = await getExamSetDetailService(examSet._id, { id: "user-1", role: "Teacher" });

    expect(result?.id).toBe(String(examSet._id));
    expect(result?.access?.isOwner).toBe(true);
  });

  it("Admin can retrieve any exam set detail", async () => {
    const examSet = createExamSet({
      _id: "507f1f77bcf86cd799439012",
      ownerId: { _id: "user-2", fullName: "Teacher B", avatar: "avatar2.png" },
      folderId: { _id: "folder-2", name: "Physics" },
      title: "Exam Set 2",
      status: "published",
      questionCount: 0,
      totalPoints: 0,
      version: 1,
      questions: [],
      createdAt: new Date("2024-01-02T00:00:00.000Z"),
      updatedAt: new Date("2024-01-03T00:00:00.000Z"),
    });
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => createQueryMock(examSet));

    const result = await getExamSetDetailService(examSet._id, { id: "admin-1", role: "Admin" });

    expect(result?.access?.permission).toBe("ADMIN");
    expect(result?.access?.canEdit).toBeFalsy();
  });

  it("Non-owner non-admin cannot retrieve exam set detail", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => createQueryMock(null));

    await expect(
      getExamSetDetailService("507f1f77bcf86cd799439013", { id: "user-3", role: "Teacher" })
    ).rejects.toMatchObject({ status: 404 });
  });
});
