// Port từ src/scripts/runExamSetShareListServiceTests.js (characterization test).
import { describe, it, expect, afterEach, vi } from "vitest";
import { listExamSetSharesService } from "#modules/exam-set/examSet.service.js";
import ExamSet from "#modules/exam-set/examSet.model.js";
import ExamSetShare from "#modules/exam-set/examSetShare.model.js";
import { User } from "#modules/auth";

const createExamSet = (props = {}) => ({
  _id: props._id || "607f1f77bcf86cd799439111",
  ownerId: props.ownerId || "507f1f77bcf86cd799439011",
  isDeleted: props.isDeleted || false,
});

const createShare = (props = {}) => ({
  _id: props._id || "707f1f77bcf86cd799439999",
  examSetId: props.examSetId || "607f1f77bcf86cd799439111",
  ownerId: props.ownerId || "507f1f77bcf86cd799439011",
  sharedWithUserId: props.sharedWithUserId || "607f1f77bcf86cd799439222",
  permission: props.permission || "VIEW",
  status: props.status || "ACTIVE",
  expiresAt: props.expiresAt || null,
  note: props.note || "",
  sharedBy: props.sharedBy || "507f1f77bcf86cd799439011",
  revokedAt: props.revokedAt || null,
  revokedBy: props.revokedBy || null,
  createdAt: props.createdAt || new Date("2026-01-01T00:00:00Z"),
  updatedAt: props.updatedAt || new Date("2026-01-01T00:00:00Z"),
  toObject() {
    return { ...this };
  },
});

const mockFindChain = (result) => ({
  sort: () => ({
    skip: () => ({
      limit: () => ({
        populate: () => ({ populate: () => ({ populate: () => Promise.resolve(result) }) }),
      }),
    }),
  }),
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("listExamSetSharesService", () => {
  it("Owner retrieves shares successfully", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet()));
    vi.spyOn(ExamSetShare, "find").mockImplementation(() => mockFindChain([createShare()]));
    vi.spyOn(ExamSetShare, "countDocuments").mockImplementation(() => Promise.resolve(1));
    vi.spyOn(User, "find").mockImplementation(() => Promise.resolve([]));

    const result = await listExamSetSharesService(
      "607f1f77bcf86cd799439111",
      "507f1f77bcf86cd799439011",
      "Teacher",
      { page: 1, limit: 10 }
    );
    expect(result.items.length).toBe(1);
    expect(result.pagination.totalItems).toBe(1);
  });

  it("Admin retrieves shares successfully", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() =>
      Promise.resolve(createExamSet({ ownerId: "some-owner" }))
    );
    vi.spyOn(ExamSetShare, "find").mockImplementation(() =>
      mockFindChain([
        createShare({
          sharedWithUserId: {
            _id: "607f1f77bcf86cd799439222",
            fullName: "B",
            email: "b@example.com",
            role: "Teacher",
            avatar: "",
            status: "Active",
          },
        }),
      ])
    );
    vi.spyOn(ExamSetShare, "countDocuments").mockImplementation(() => Promise.resolve(1));
    vi.spyOn(User, "find").mockImplementation(() => Promise.resolve([]));

    const result = await listExamSetSharesService("607f1f77bcf86cd799439111", "admin-id", "Admin", {
      page: 1,
      limit: 10,
    });
    expect(result.items[0].sharedWithUser.email).toBe("b@example.com");
  });

  it("Returns effectiveStatus EXPIRED when active share expired", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet()));
    const expired = createShare({
      status: "ACTIVE",
      expiresAt: new Date(Date.now() - 1000),
      sharedWithUserId: {
        _id: "607f1f77bcf86cd799439222",
        fullName: "C",
        email: "c@example.com",
        role: "Teacher",
        avatar: "",
        status: "Active",
      },
    });
    vi.spyOn(ExamSetShare, "find").mockImplementation(() => mockFindChain([expired]));
    vi.spyOn(ExamSetShare, "countDocuments").mockImplementation(() => Promise.resolve(1));
    vi.spyOn(User, "find").mockImplementation(() => Promise.resolve([]));

    const result = await listExamSetSharesService(
      "607f1f77bcf86cd799439111",
      "507f1f77bcf86cd799439011",
      "Teacher",
      { page: 1, limit: 10 }
    );
    expect(result.items[0].status).toBe("ACTIVE");
    expect(result.items[0].effectiveStatus).toBe("EXPIRED");
  });

  it("Permission filter works", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet()));
    vi.spyOn(ExamSetShare, "find").mockImplementation((filter) => {
      expect(filter.permission).toBe("EDIT");
      return mockFindChain([]);
    });
    vi.spyOn(ExamSetShare, "countDocuments").mockImplementation(() => Promise.resolve(0));
    vi.spyOn(User, "find").mockImplementation(() => Promise.resolve([]));

    const result = await listExamSetSharesService(
      "607f1f77bcf86cd799439111",
      "507f1f77bcf86cd799439011",
      "Teacher",
      { page: 1, limit: 10, permission: "EDIT" }
    );
    expect(result.pagination.totalItems).toBe(0);
  });

  it("Status filter works", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet()));
    vi.spyOn(ExamSetShare, "find").mockImplementation((filter) => {
      expect(filter.status).toBe("REVOKED");
      return mockFindChain([]);
    });
    vi.spyOn(ExamSetShare, "countDocuments").mockImplementation(() => Promise.resolve(0));
    vi.spyOn(User, "find").mockImplementation(() => Promise.resolve([]));

    const result = await listExamSetSharesService(
      "607f1f77bcf86cd799439111",
      "507f1f77bcf86cd799439011",
      "Teacher",
      { page: 1, limit: 10, status: "REVOKED" }
    );
    expect(result.pagination.totalItems).toBe(0);
  });

  it("Search filters by user email and name", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet()));
    vi.spyOn(User, "find").mockImplementation(() => ({
      select: () => Promise.resolve([{ _id: "607f1f77bcf86cd799439222" }]),
    }));
    vi.spyOn(ExamSetShare, "find").mockImplementation((filter) => {
      expect(filter.sharedWithUserId).toEqual({ $in: ["607f1f77bcf86cd799439222"] });
      return mockFindChain([]);
    });
    vi.spyOn(ExamSetShare, "countDocuments").mockImplementation(() => Promise.resolve(0));

    const result = await listExamSetSharesService(
      "607f1f77bcf86cd799439111",
      "507f1f77bcf86cd799439011",
      "Teacher",
      { page: 1, limit: 10, search: "a@example.com" }
    );
    expect(result.pagination.totalItems).toBe(0);
  });

  it("Teacher not owner gets 403", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() =>
      Promise.resolve(createExamSet({ ownerId: "507f1f77bcf86cd799439013" }))
    );
    vi.spyOn(User, "find").mockImplementation(() => Promise.resolve([]));

    await expect(
      listExamSetSharesService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", {
        page: 1,
        limit: 10,
      })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("Student gets 403", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() =>
      Promise.resolve(createExamSet({ ownerId: "507f1f77bcf86cd799439013" }))
    );
    vi.spyOn(User, "find").mockImplementation(() => Promise.resolve([]));

    await expect(
      listExamSetSharesService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Student", {
        page: 1,
        limit: 10,
      })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("Exam set not found returns 404", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(null));
    vi.spyOn(User, "find").mockImplementation(() => Promise.resolve([]));

    await expect(
      listExamSetSharesService("607f1f77bcf86cd799439999", "507f1f77bcf86cd799439011", "Admin", {
        page: 1,
        limit: 10,
      })
    ).rejects.toMatchObject({ status: 404 });
  });
});
