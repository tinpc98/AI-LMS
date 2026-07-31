// Port từ src/scripts/runExamSetSharedWithMeServiceTests.js (characterization test).
import { describe, it, expect, afterEach, vi } from "vitest";
import { listSharedExamSetsService } from "#modules/exam-set/examSet.service.js";
import ExamSetShare from "#modules/exam-set/examSetShare.model.js";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("listSharedExamSetsService", () => {
  it("Teacher gets shared exam set with VIEW permission", async () => {
    vi.spyOn(ExamSetShare, "aggregate").mockImplementation(() =>
      Promise.resolve([
        {
          items: [
            {
              share: {
                _id: "707f...",
                permission: "VIEW",
                status: "ACTIVE",
                effectiveStatus: "ACTIVE",
                expiresAt: null,
                note: "",
                sharedAt: new Date("2026-01-01T00:00:00Z"),
                createdAt: new Date("2026-01-01T00:00:00Z"),
                updatedAt: new Date("2026-01-01T00:00:00Z"),
              },
              examSet: {
                _id: "607f...",
                title: "Title X",
                description: "Desc",
                tags: ["math"],
                status: "draft",
                metrics: { totalQuestions: 10, totalPoints: 20 },
                versionNumber: 1,
                rootExamSetId: "607f...",
                isLatestVersion: true,
                createdAt: new Date("2026-01-01T00:00:00Z"),
                updatedAt: new Date("2026-01-01T00:00:00Z"),
              },
              owner: { _id: "507f...", fullName: "Owner", email: "owner@example.com", avatar: "" },
            },
          ],
          totalCount: [{ count: 1 }],
        },
      ])
    );

    const result = await listSharedExamSetsService("607f1f77bcf86cd799439222", "Teacher", {
      page: 1,
      limit: 10,
    });
    expect(result.items.length).toBe(1);
    expect(result.items[0].share.permission).toBe("VIEW");
    expect(result.items[0].examSet.title).toBe("Title X");
  });

  it("Teacher gets shared exam set with EDIT permission", async () => {
    vi.spyOn(ExamSetShare, "aggregate").mockImplementation(() =>
      Promise.resolve([
        {
          items: [
            {
              share: { permission: "EDIT" },
              examSet: { title: "Title Y" },
              owner: { email: "owner@example.com" },
            },
          ],
          totalCount: [{ count: 1 }],
        },
      ])
    );

    const result = await listSharedExamSetsService("607f1f77bcf86cd799439222", "Teacher", {
      page: 1,
      limit: 10,
      permission: "EDIT",
    });
    expect(result.items[0].share.permission).toBe("EDIT");
  });

  it("Empty list returns 200 with pagination totalItems 0", async () => {
    vi.spyOn(ExamSetShare, "aggregate").mockImplementation(() =>
      Promise.resolve([{ items: [], totalCount: [] }])
    );

    const result = await listSharedExamSetsService("607f1f77bcf86cd799439222", "Teacher", {
      page: 1,
      limit: 10,
    });
    expect(result.items.length).toBe(0);
    expect(result.pagination.totalItems).toBe(0);
    expect(result.pagination.totalPages).toBe(0);
  });

  it("Filter ownerId is passed through", async () => {
    let pipeline;
    vi.spyOn(ExamSetShare, "aggregate").mockImplementation((p) => {
      pipeline = p;
      return Promise.resolve([{ items: [], totalCount: [] }]);
    });

    await listSharedExamSetsService("607f1f77bcf86cd799439222", "Teacher", {
      page: 1,
      limit: 10,
      ownerId: "507f1f77bcf86cd799439011",
    });
    expect(pipeline.some((stage) => stage.$match && stage.$match["examSet.ownerId"])).toBe(true);
  });

  it("Search term is escaped and used in pipeline", async () => {
    let pipeline;
    vi.spyOn(ExamSetShare, "aggregate").mockImplementation((p) => {
      pipeline = p;
      return Promise.resolve([{ items: [], totalCount: [] }]);
    });

    await listSharedExamSetsService("607f1f77bcf86cd799439222", "Teacher", {
      page: 1,
      limit: 10,
      search: "Title",
    });
    expect(pipeline.some((stage) => stage.$match && stage.$match.$or)).toBe(true);
  });

  it("Student gets 403", async () => {
    await expect(
      listSharedExamSetsService("607f1f77bcf86cd799439222", "Student", { page: 1, limit: 10 })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("Invalid user id returns 400", async () => {
    await expect(
      listSharedExamSetsService("invalid-id", "Teacher", { page: 1, limit: 10 })
    ).rejects.toMatchObject({ status: 400 });
  });
});
