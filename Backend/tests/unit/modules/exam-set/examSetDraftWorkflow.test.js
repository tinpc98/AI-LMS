// Port từ src/scripts/runExamSetDraftWorkflowTests.js (characterization test).
import { describe, it, expect, afterEach, vi } from "vitest";
import ExamSet from "#modules/exam-set/examSet.model.js";
import { requireExamSetDraftAccess } from "#modules/exam-set/examSetAccess.middleware.js";
import { saveDraftExamSetService } from "#modules/exam-set/examSet.service.js";

const createReq = (overrides = {}) => ({
  headers: {},
  params: {},
  body: {},
  user: null,
  ...overrides,
});

const createRes = () => {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload) => {
    res.payload = payload;
    return res;
  };
  return res;
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ExamSet draft workflow", () => {
  it("saveDraft service keeps draft status and updates metadata", async () => {
    const examSet = {
      _id: "507f1f77bcf86cd799439021",
      ownerId: "owner-1",
      folderId: "folder-1",
      title: "Old title",
      description: "Old description",
      status: "draft",
      tags: ["old"],
      questions: [],
      isDeleted: false,
      async save() {
        return this;
      },
    };

    const updated = await saveDraftExamSetService(examSet, {
      title: "New title",
      description: "New description",
      tags: ["new"],
    });

    expect(updated.status).toBe("draft");
    expect(updated.title).toBe("New title");
    expect(updated.description).toBe("New description");
    expect(updated.tags).toEqual(["new"]);
  });

  it("save draft middleware denies non-owner and non-admin with 403", async () => {
    const examSet = { _id: "507f1f77bcf86cd799439022", ownerId: "owner-1", isDeleted: false };
    vi.spyOn(ExamSet, "findOne").mockImplementation(async () => examSet);

    const req = createReq({
      params: { examSetId: examSet._id },
      user: { id: "student-1", role: "Student" },
    });
    const res = createRes();

    let nextCalled = false;
    await requireExamSetDraftAccess(req, res, () => {
      nextCalled = true;
    });

    expect(res.statusCode).toBe(403);
    expect(nextCalled).toBe(false);
  });
});
