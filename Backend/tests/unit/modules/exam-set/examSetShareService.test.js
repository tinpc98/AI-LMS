// Port từ src/scripts/runExamSetShareServiceTests.js (characterization test).
import { describe, it, expect, afterEach, vi } from "vitest";
import { createExamSetShareService } from "#modules/exam-set/examSetShare.service.js";
import ExamSet from "#modules/exam-set/examSet.model.js";
import { User } from "#modules/auth";
import ExamSetShare from "#modules/exam-set/examSetShare.model.js";

const createExamSet = (props = {}) => ({
  _id: props._id || "607f1f77bcf86cd799439111",
  ownerId: props.ownerId || "507f1f77bcf86cd799439011",
  isDeleted: props.isDeleted || false,
  toObject() {
    return { ...this };
  },
});

const createUser = (props = {}) => ({
  _id: props._id || "507f1f77bcf86cd799439011",
  role: props.role || "Teacher",
  status: props.status || "Active",
});

const createShare = (props = {}) => ({
  _id: props._id || "707f1f77bcf86cd799439999",
  examSetId: props.examSetId || "607f1f77bcf86cd799439111",
  ownerId: props.ownerId || "507f1f77bcf86cd799439011",
  sharedWithUserId: props.sharedWithUserId || "607f1f77bcf86cd799439222",
  permission: props.permission || "VIEW",
  status: props.status || "ACTIVE",
  save: async function () {
    return this;
  },
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("createExamSetShareService", () => {
  it("Share VIEW created", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet()));
    vi.spyOn(User, "findOne").mockImplementation(() =>
      Promise.resolve(createUser({ role: "Teacher" }))
    );
    vi.spyOn(ExamSetShare, "findOne").mockImplementation(() => Promise.resolve(null));
    vi.spyOn(ExamSetShare.prototype, "save").mockImplementation(async function () {
      return this;
    });

    const res = await createExamSetShareService(
      "607f1f77bcf86cd799439111",
      "507f1f77bcf86cd799439011",
      "Teacher",
      {
        sharedWithUserId: "607f1f77bcf86cd799439222",
        permission: "VIEW",
        expiresAt: null,
        note: " hi ",
      }
    );
    expect(res.statusCode).toBe(201);
    expect(res.data.permission).toBe("VIEW");
    expect(String(res.data.ownerId)).toBe("507f1f77bcf86cd799439011");
  });

  it("Share EDIT created", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet()));
    vi.spyOn(User, "findOne").mockImplementation(() =>
      Promise.resolve(createUser({ role: "Teacher" }))
    );
    vi.spyOn(ExamSetShare, "findOne").mockImplementation(() => Promise.resolve(null));
    vi.spyOn(ExamSetShare.prototype, "save").mockImplementation(async function () {
      return this;
    });

    const res = await createExamSetShareService(
      "607f1f77bcf86cd799439111",
      "507f1f77bcf86cd799439011",
      "Teacher",
      {
        sharedWithUserId: "607f1f77bcf86cd799439222",
        permission: "EDIT",
        expiresAt: null,
        note: "",
      }
    );
    expect(res.statusCode).toBe(201);
    expect(res.data.permission).toBe("EDIT");
  });

  it("Duplicate ACTIVE returns 409", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet()));
    vi.spyOn(User, "findOne").mockImplementation(() => Promise.resolve(createUser()));
    vi.spyOn(ExamSetShare, "findOne").mockImplementation(() =>
      Promise.resolve(createShare({ status: "ACTIVE" }))
    );

    await expect(
      createExamSetShareService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", {
        sharedWithUserId: "607f1f77bcf86cd799439222",
        permission: "VIEW",
      })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("Reactivate REVOKED", async () => {
    const ex = createShare({ status: "REVOKED" });
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet()));
    vi.spyOn(User, "findOne").mockImplementation(() => Promise.resolve(createUser()));
    vi.spyOn(ExamSetShare, "findOne").mockImplementation(() => Promise.resolve(ex));
    ex.save = async function () {
      return this;
    };

    const res = await createExamSetShareService(
      "607f1f77bcf86cd799439111",
      "507f1f77bcf86cd799439011",
      "Teacher",
      {
        sharedWithUserId: "607f1f77bcf86cd799439222",
        permission: "EDIT",
        expiresAt: null,
        note: "reactivated",
      }
    );
    expect(res.statusCode).toBe(200);
    expect(res.data.status).toBe("ACTIVE");
    expect(res.data.permission).toBe("EDIT");
  });

  it("Cannot share to self", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() =>
      Promise.resolve(createExamSet({ ownerId: "507f1f77bcf86cd799439011" }))
    );
    vi.spyOn(User, "findOne").mockImplementation(() =>
      Promise.resolve(createUser({ _id: "507f1f77bcf86cd799439011" }))
    );

    await expect(
      createExamSetShareService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", {
        sharedWithUserId: "507f1f77bcf86cd799439011",
        permission: "VIEW",
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("Exam Set not exist", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(null));

    await expect(
      createExamSetShareService("607f1f77bcf86cd799439999", "507f1f77bcf86cd799439011", "Teacher", {
        sharedWithUserId: "607f1f77bcf86cd799439222",
        permission: "VIEW",
      })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("User not exist", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet()));
    vi.spyOn(User, "findOne").mockImplementation(() => Promise.resolve(null));

    await expect(
      createExamSetShareService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", {
        sharedWithUserId: "607f1f77bcf86cd799439222",
        permission: "VIEW",
      })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("Cannot share to Student", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet()));
    vi.spyOn(User, "findOne").mockImplementation(() =>
      Promise.resolve(createUser({ role: "Student" }))
    );

    await expect(
      createExamSetShareService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", {
        sharedWithUserId: "607f1f77bcf86cd799439222",
        permission: "VIEW",
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("Teacher not owner cannot share", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() =>
      Promise.resolve(createExamSet({ ownerId: "owner-1" }))
    );
    vi.spyOn(User, "findOne").mockImplementation(() =>
      Promise.resolve(createUser({ role: "Teacher" }))
    );

    await expect(
      createExamSetShareService("607f1f77bcf86cd799439111", "not-owner", "Teacher", {
        sharedWithUserId: "607f1f77bcf86cd799439222",
        permission: "VIEW",
      })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("expiresAt in past", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet()));
    vi.spyOn(User, "findOne").mockImplementation(() => Promise.resolve(createUser()));

    await expect(
      createExamSetShareService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", {
        sharedWithUserId: "607f1f77bcf86cd799439222",
        permission: "VIEW",
        expiresAt: new Date(Date.now() - 10000),
      })
    ).rejects.toMatchObject({ status: 422 });
  });

  it("permission invalid", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet()));
    vi.spyOn(User, "findOne").mockImplementation(() => Promise.resolve(createUser()));

    await expect(
      createExamSetShareService("607f1f77bcf86cd799439111", "507f1f77bcf86cd799439011", "Teacher", {
        sharedWithUserId: "607f1f77bcf86cd799439222",
        permission: "BAD",
      })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("invalid examSetId", async () => {
    await expect(
      createExamSetShareService("not-objectid", "507f1f77bcf86cd799439011", "Teacher", {
        sharedWithUserId: "607f1f77bcf86cd799439222",
        permission: "VIEW",
      })
    ).rejects.toMatchObject({ status: 400 });
  });
});
