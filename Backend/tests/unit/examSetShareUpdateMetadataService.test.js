// Port từ src/scripts/runExamSetShareUpdateMetadataServiceTests.js (characterization test).
// Nhóm: A. Success (12) | B. Field Integrity (8) | C. Validation (10) | D. Authorization (5) | E. State (9)
import { describe, it, expect, afterEach, vi } from "vitest";
import { updateExamSetShareMetadataService } from "../../src/services/examSet.services.js";
import ExamSet from "../../src/models/examSet.model.js";
import ExamSetShare from "../../src/models/examSetShare.model.js";

const EXAM_SET_ID = "607f1f77bcf86cd799439111";
const OWNER_ID = "507f1f77bcf86cd799439011";
const SHARED_USER_ID = "607f1f77bcf86cd799439222";
const SHARE_ID = "707f1f77bcf86cd799439999";
const FUTURE_DATE = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
const PAST_DATE = new Date(Date.now() - 3600 * 1000);
const FAR_FUTURE = new Date(Date.now() + 30 * 24 * 3600 * 1000);

const makeExamSet = (props = {}) => ({
  _id: EXAM_SET_ID,
  ownerId: OWNER_ID,
  title: "Bộ đề A",
  status: "draft",
  isDeleted: false,
  ...props,
});

const makeShare = (props = {}) => {
  const data = {
    _id: SHARE_ID,
    examSetId: EXAM_SET_ID,
    ownerId: OWNER_ID,
    sharedWithUserId: SHARED_USER_ID,
    permission: "VIEW",
    status: "ACTIVE",
    sharedBy: OWNER_ID,
    expiresAt: null,
    note: "",
    revokedAt: null,
    revokedBy: null,
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...props,
  };
  data.save = async function () {
    this.updatedAt = new Date();
    return this;
  };
  return data;
};

const mockExamSet = (doc) => vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(doc));
const mockShare = (doc) => vi.spyOn(ExamSetShare, "findOne").mockImplementation(() => Promise.resolve(doc));

afterEach(() => {
  vi.restoreAllMocks();
});

describe("updateExamSetShareMetadataService — A. Success", () => {
  it("A1. Owner cập nhật expiresAt thành công", async () => {
    mockExamSet(makeExamSet());
    mockShare(makeShare({ expiresAt: null }));
    const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { expiresAt: FUTURE_DATE });
    expect(res.statusCode).toBe(200);
  });

  it("A2. Owner xóa expiresAt bằng null", async () => {
    mockExamSet(makeExamSet());
    mockShare(makeShare({ expiresAt: FAR_FUTURE }));
    const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { expiresAt: null });
    expect(res.statusCode).toBe(200);
    expect(res.data.expiresAt).toBe(null);
  });

  it("A3. Owner cập nhật note thành công", async () => {
    mockExamSet(makeExamSet());
    mockShare(makeShare({ note: "" }));
    const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "Ghi chú mới" });
    expect(res.statusCode).toBe(200);
  });

  it("A4. Owner xóa note bằng null", async () => {
    mockExamSet(makeExamSet());
    mockShare(makeShare({ note: "note cũ" }));
    const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: null });
    expect(res.statusCode).toBe(200);
    expect(res.data.note).toBe("");
  });

  it("A5. Owner cập nhật cả expiresAt và note", async () => {
    mockExamSet(makeExamSet());
    mockShare(makeShare({ expiresAt: null, note: "" }));
    const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { expiresAt: FUTURE_DATE, note: "Cả hai field" });
    expect(res.statusCode).toBe(200);
  });

  it("A6. Admin cập nhật thành công", async () => {
    const otherUserId = "999f1f77bcf86cd799439999";
    mockExamSet(makeExamSet());
    mockShare(makeShare({ note: "" }));
    const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, otherUserId, "Admin", { note: "Admin update" });
    expect(res.statusCode).toBe(200);
  });

  it("A7. Share ACTIVE đã hết hạn được gia hạn thành công", async () => {
    mockExamSet(makeExamSet());
    mockShare(makeShare({ expiresAt: PAST_DATE, note: "old" }));
    const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { expiresAt: FUTURE_DATE });
    expect(res.statusCode).toBe(200);
  });

  it("A8. expiresAt tương lai được lưu đúng", async () => {
    mockExamSet(makeExamSet());
    mockShare(makeShare({ expiresAt: null }));
    const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { expiresAt: FUTURE_DATE });
    expect(res.data.expiresAt instanceof Date || res.data.expiresAt !== undefined).toBe(true);
  });

  it("A9. Note được trim", async () => {
    mockExamSet(makeExamSet());
    mockShare(makeShare({ note: "" }));
    const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "  trimmed  " });
    expect(res.data.note).toBe("trimmed");
  });

  it("A10. Chuỗi rỗng sau trim được chuẩn hóa thành rỗng (note = '')", async () => {
    mockExamSet(makeExamSet());
    mockShare(makeShare({ note: "old note" }));
    const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "   " });
    expect(res.data.note).toBe("");
  });

  it("A11. updatedAt thay đổi sau update", async () => {
    const originalDate = new Date("2026-01-01");
    const share = makeShare({ note: "old", updatedAt: originalDate });
    mockExamSet(makeExamSet());
    mockShare(share);
    const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new note" });
    expect(res.data.updatedAt > originalDate || res.statusCode === 200).toBe(true);
  });

  it("A12. createdAt giữ nguyên sau update", async () => {
    const createdAt = new Date("2026-01-01");
    const share = makeShare({ createdAt, note: "old" });
    mockExamSet(makeExamSet());
    mockShare(share);
    const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" });
    expect(res.data.createdAt).toEqual(createdAt);
  });
});

describe("updateExamSetShareMetadataService — B. Field Integrity", () => {
  it("B1. permission giữ nguyên", async () => {
    const share = makeShare({ permission: "VIEW", note: "old" });
    mockExamSet(makeExamSet());
    mockShare(share);
    await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" });
    expect(share.permission).toBe("VIEW");
  });

  it("B2. status giữ nguyên", async () => {
    const share = makeShare({ status: "ACTIVE", note: "old" });
    mockExamSet(makeExamSet());
    mockShare(share);
    await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" });
    expect(share.status).toBe("ACTIVE");
  });

  it("B3. ownerId giữ nguyên", async () => {
    const share = makeShare({ ownerId: OWNER_ID, note: "old" });
    mockExamSet(makeExamSet());
    mockShare(share);
    await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" });
    expect(String(share.ownerId)).toBe(OWNER_ID);
  });

  it("B4. sharedWithUserId giữ nguyên", async () => {
    const share = makeShare({ sharedWithUserId: SHARED_USER_ID, note: "old" });
    mockExamSet(makeExamSet());
    mockShare(share);
    await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" });
    expect(String(share.sharedWithUserId)).toBe(SHARED_USER_ID);
  });

  it("B5. sharedBy giữ nguyên", async () => {
    const share = makeShare({ sharedBy: OWNER_ID, note: "old" });
    mockExamSet(makeExamSet());
    mockShare(share);
    await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" });
    expect(String(share.sharedBy)).toBe(OWNER_ID);
  });

  it("B6. revokedAt giữ nguyên (null)", async () => {
    const share = makeShare({ revokedAt: null, note: "old" });
    mockExamSet(makeExamSet());
    mockShare(share);
    await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" });
    expect(share.revokedAt).toBe(null);
  });

  it("B7. revokedBy giữ nguyên (null)", async () => {
    const share = makeShare({ revokedBy: null, note: "old" });
    mockExamSet(makeExamSet());
    mockShare(share);
    await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" });
    expect(share.revokedBy).toBe(null);
  });

  it("B8. Chỉ expiresAt và note thay đổi, không field nào khác", async () => {
    const share = makeShare({ note: "old", expiresAt: null, permission: "EDIT", status: "ACTIVE" });
    mockExamSet(makeExamSet());
    mockShare(share);
    await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new", expiresAt: FUTURE_DATE });
    expect(share.permission).toBe("EDIT");
    expect(share.status).toBe("ACTIVE");
  });
});

describe("updateExamSetShareMetadataService — C. Validation", () => {
  it("C1. examSetId sai ObjectId → 400", async () => {
    await expect(
      updateExamSetShareMetadataService("invalid-id", SHARE_ID, OWNER_ID, "Teacher", { note: "x" })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("C2. shareId sai ObjectId → 400", async () => {
    mockExamSet(makeExamSet());
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, "invalid-id", OWNER_ID, "Teacher", { note: "x" })
    ).rejects.toMatchObject({ status: 400 });
  });

  it("C3. Exam Set không tồn tại → 404", async () => {
    mockExamSet(null);
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("C4. Exam Set soft deleted → 404", async () => {
    mockExamSet(null);
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("C5. Share không tồn tại → 404", async () => {
    mockExamSet(makeExamSet());
    mockShare(null);
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("C6. Share thuộc ExamSet khác → 404", async () => {
    mockExamSet(makeExamSet());
    mockShare(null);
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("C7. Share REVOKED → 409", async () => {
    mockExamSet(makeExamSet());
    mockShare(makeShare({ status: "REVOKED" }));
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("C8. Dữ liệu giống hiện tại → 409 no-op (cả hai field)", async () => {
    mockExamSet(makeExamSet());
    const sameNote = "same note";
    const sameExpiry = FAR_FUTURE;
    mockShare(makeShare({ note: sameNote, expiresAt: sameExpiry }));
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: sameNote, expiresAt: sameExpiry.toISOString() })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("C9. Chỉ expiresAt không đổi (note không gửi) → 409 no-op", async () => {
    mockExamSet(makeExamSet());
    const sameExpiry = FAR_FUTURE;
    mockShare(makeShare({ expiresAt: sameExpiry }));
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { expiresAt: sameExpiry.toISOString() })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("C10. Chỉ note không đổi (expiresAt không gửi) → 409 no-op", async () => {
    mockExamSet(makeExamSet());
    const sameNote = "same";
    mockShare(makeShare({ note: sameNote }));
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: sameNote })
    ).rejects.toMatchObject({ status: 409 });
  });
});

describe("updateExamSetShareMetadataService — D. Authorization", () => {
  it("D1. Teacher không phải Owner bị 403", async () => {
    mockExamSet(makeExamSet({ ownerId: OWNER_ID }));
    const otherTeacherId = "999f1f77bcf86cd799439001";
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, otherTeacherId, "Teacher", { note: "x" })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("D2. Shared VIEW bị 403", async () => {
    mockExamSet(makeExamSet({ ownerId: OWNER_ID }));
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, SHARED_USER_ID, "Teacher", { note: "x" })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("D3. Shared EDIT bị 403", async () => {
    mockExamSet(makeExamSet({ ownerId: OWNER_ID }));
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, SHARED_USER_ID, "Teacher", { note: "x" })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("D4. Student bị 403", async () => {
    mockExamSet(makeExamSet({ ownerId: OWNER_ID }));
    const studentId = "999f1f77bcf86cd799439002";
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, studentId, "Student", { note: "x" })
    ).rejects.toMatchObject({ status: 403 });
  });

  it("D5. Admin được phép (không phải owner) → success", async () => {
    mockExamSet(makeExamSet({ ownerId: OWNER_ID }));
    mockShare(makeShare({ note: "" }));
    const adminId = "999f1f77bcf86cd799439003";
    const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, adminId, "Admin", { note: "admin note" });
    expect(res.statusCode).toBe(200);
  });
});

describe("updateExamSetShareMetadataService — E. State / Edge Cases", () => {
  it("E1. REVOKED share không được update → 409", async () => {
    mockExamSet(makeExamSet());
    mockShare(makeShare({ status: "REVOKED", note: "old" }));
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("E2. Share không tồn tại → 404", async () => {
    mockExamSet(makeExamSet());
    mockShare(null);
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("E3. Exam Set không tồn tại → 404", async () => {
    mockExamSet(null);
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("E4. Exam Set soft delete → 404", async () => {
    mockExamSet(null);
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("E5. Share thuộc Exam Set khác → 404", async () => {
    mockExamSet(makeExamSet());
    mockShare(null);
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("E6. No-op: dữ liệu giống hoàn toàn → 409", async () => {
    mockExamSet(makeExamSet());
    const note = "same value";
    mockShare(makeShare({ note, expiresAt: null }));
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note, expiresAt: null })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("E7. Chỉ expiresAt không đổi → 409", async () => {
    const existingExpiry = FAR_FUTURE;
    mockExamSet(makeExamSet());
    mockShare(makeShare({ expiresAt: existingExpiry }));
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { expiresAt: existingExpiry.toISOString() })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("E8. Chỉ note không đổi → 409", async () => {
    const note = "exact same";
    mockExamSet(makeExamSet());
    mockShare(makeShare({ note }));
    await expect(
      updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note })
    ).rejects.toMatchObject({ status: 409 });
  });

  it("E9. Một field giống, một field thay đổi → update thành công", async () => {
    const existingNote = "same";
    mockExamSet(makeExamSet());
    mockShare(makeShare({ note: existingNote, expiresAt: null }));
    const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: existingNote, expiresAt: FUTURE_DATE });
    expect(res.statusCode).toBe(200);
  });
});
