// Port từ src/scripts/runExamSetShareRevokeServiceTests.js (characterization test).
import { describe, it, expect, afterEach, vi } from "vitest";
import { revokeExamSetShareService } from "../../src/services/examSet.service.js";
import ExamSet from "../../src/models/examSet.model.js";
import ExamSetShare from "../../src/models/examSetShare.model.js";

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
  revokedAt: props.revokedAt || null,
  revokedBy: props.revokedBy || null,
  save: async function () {
    return this;
  },
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("revokeExamSetShareService", () => {
  it("Revoke success", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet({ ownerId: "507f1f77bcf86cd799439011", _id: "607f1f77bcf86cd799439111" })));
    const sh = createShare({ status: "ACTIVE", examSetId: "607f1f77bcf86cd799439111", ownerId: "507f1f77bcf86cd799439011" });
    vi.spyOn(ExamSetShare, "findOne").mockImplementation(() => Promise.resolve(sh));
    sh.save = async function () {
      this.status = "REVOKED";
      this.revokedBy = "507f1f77bcf86cd799439011";
      this.revokedAt = new Date();
      return this;
    };

    const res = await revokeExamSetShareService("607f1f77bcf86cd799439111", sh._id, "507f1f77bcf86cd799439011", "Teacher");
    expect(res.statusCode).toBe(200);
    expect(res.data.status).toBe("REVOKED");
    expect(res.data.revokedBy).toBe("507f1f77bcf86cd799439011");
    expect(res.data.revokedAt).toBeTruthy();
  });

  it("Share not exist", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet()));
    vi.spyOn(ExamSetShare, "findOne").mockImplementation(() => Promise.resolve(null));

    await expect(
      revokeExamSetShareService("607f1f77bcf86cd799439111", "707f1f77bcf86cd799439999", "507f1f77bcf86cd799439011", "Teacher")
    ).rejects.toMatchObject({ status: 404 });
  });

  it("Exam set not exist", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(null));

    await expect(
      revokeExamSetShareService("607f1f77bcf86cd799439999", "707f1f77bcf86cd799439999", "507f1f77bcf86cd799439011", "Teacher")
    ).rejects.toMatchObject({ status: 404 });
  });

  it("Teacher not owner cannot revoke", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet({ ownerId: "507f1f77bcf86cd799439011", _id: "607f1f77bcf86cd799439111" })));
    const sh = createShare({ status: "ACTIVE", examSetId: "607f1f77bcf86cd799439111", ownerId: "507f1f77bcf86cd799439011" });
    vi.spyOn(ExamSetShare, "findOne").mockImplementation(() => Promise.resolve(sh));

    await expect(
      revokeExamSetShareService("607f1f77bcf86cd799439111", sh._id, "507f1f77bcf86cd799439012", "Teacher")
    ).rejects.toMatchObject({ status: 403 });
  });

  it("Student cannot revoke", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet({ ownerId: "507f1f77bcf86cd799439011", _id: "607f1f77bcf86cd799439111" })));
    const sh = createShare({ status: "ACTIVE", examSetId: "607f1f77bcf86cd799439111", ownerId: "507f1f77bcf86cd799439011" });
    vi.spyOn(ExamSetShare, "findOne").mockImplementation(() => Promise.resolve(sh));

    await expect(
      revokeExamSetShareService("607f1f77bcf86cd799439111", sh._id, "507f1f77bcf86cd799439013", "Student")
    ).rejects.toMatchObject({ status: 403 });
  });

  it("Revoke twice returns 409", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet()));
    vi.spyOn(ExamSetShare, "findOne").mockImplementation(() => Promise.resolve(createShare({ status: "REVOKED" })));

    await expect(
      revokeExamSetShareService("607f1f77bcf86cd799439111", "707f1f77bcf86cd799439999", "507f1f77bcf86cd799439011", "Teacher")
    ).rejects.toMatchObject({ status: 409 });
  });

  it("Revoke expired returns 409", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet()));
    vi.spyOn(ExamSetShare, "findOne").mockImplementation(() => Promise.resolve(createShare({ status: "EXPIRED" })));

    await expect(
      revokeExamSetShareService("607f1f77bcf86cd799439111", "707f1f77bcf86cd799439999", "507f1f77bcf86cd799439011", "Teacher")
    ).rejects.toMatchObject({ status: 409 });
  });

  it("Invalid ObjectId", async () => {
    await expect(
      revokeExamSetShareService("not-objectid", "also-not-objectid", "507f1f77bcf86cd799439011", "Teacher")
    ).rejects.toMatchObject({ status: 400 });
  });

  it("Share not belong to exam set", async () => {
    vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(createExamSet({ _id: "607f1f77bcf86cd799439aaa", ownerId: "507f1f77bcf86cd799439011" })));
    vi.spyOn(ExamSetShare, "findOne").mockImplementation(() => Promise.resolve(createShare({ examSetId: "607f1f77bcf86cd799439bbb" })));

    await expect(
      revokeExamSetShareService("607f1f77bcf86cd799439aaa", "707f1f77bcf86cd799439999", "507f1f77bcf86cd799439011", "Teacher")
    ).rejects.toMatchObject({ status: 400 });
  });
});
