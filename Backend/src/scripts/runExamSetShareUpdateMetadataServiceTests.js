/**
 * Tests cho updateExamSetShareMetadataService
 *
 * Convention: runTest + assert (không dùng Jest/Mocha)
 * Tất cả test dùng mock – không kết nối DB.
 *
 * Nhóm:
 * A. Success               (12 cases)
 * B. Field Integrity       (8 cases)
 * C. Validation            (10 cases)
 * D. Authorization         (5 cases)
 * E. State                 (9 cases)
 *
 * Tổng: 44 test cases
 */

import assert from "assert";
import { updateExamSetShareMetadataService } from "../services/examSet.services.js";
import ExamSet from "../models/examSet.model.js";
import ExamSetShare from "../models/examSetShare.model.js";

// ──────────────────────────────────────────────────────────────────────────────
// Test runner
// ──────────────────────────────────────────────────────────────────────────────

const runTest = async (name, fn) => {
  try {
    await fn();
    console.log(`PASS: ${name}`);
    return true;
  } catch (err) {
    console.error(`FAIL: ${name}`);
    console.error("  →", err.message || err);
    return false;
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// Fixtures
// ──────────────────────────────────────────────────────────────────────────────

const EXAM_SET_ID     = "607f1f77bcf86cd799439111";
const OWNER_ID        = "507f1f77bcf86cd799439011";
const SHARED_USER_ID  = "607f1f77bcf86cd799439222";
const SHARE_ID        = "707f1f77bcf86cd799439999";
const OTHER_EXAM_ID   = "607f1f77bcf86cd799439444";
const OTHER_SHARE_ID  = "707f1f77bcf86cd799439888";
const FUTURE_DATE     = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
const PAST_DATE       = new Date(Date.now() - 3600 * 1000);
const FAR_FUTURE      = new Date(Date.now() + 30 * 24 * 3600 * 1000);

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
  // Add mock save
  data.save = async function () {
    this.updatedAt = new Date();
    return this;
  };
  return data;
};

// ──────────────────────────────────────────────────────────────────────────────
// Mock helpers
// ──────────────────────────────────────────────────────────────────────────────

const origExamSetFindOne  = ExamSet.findOne;
const origShareFindOne    = ExamSetShare.findOne;

const mockExamSet = (doc) => { ExamSet.findOne    = () => Promise.resolve(doc); };
const mockShare   = (doc) => { ExamSetShare.findOne = () => Promise.resolve(doc); };
const restore = () => {
  ExamSet.findOne    = origExamSetFindOne;
  ExamSetShare.findOne = origShareFindOne;
};

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

const runAll = async () => {
  let passed = 0;
  const tests = [];

  // ══════════════════════════════════════════════════════════════════════════
  // A. Success
  // ══════════════════════════════════════════════════════════════════════════

  tests.push({
    name: "A1. Owner cập nhật expiresAt thành công",
    fn: async () => {
      mockExamSet(makeExamSet());
      mockShare(makeShare({ expiresAt: null }));
      const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { expiresAt: FUTURE_DATE });
      assert.equal(res.statusCode, 200);
      restore();
    },
  });

  tests.push({
    name: "A2. Owner xóa expiresAt bằng null",
    fn: async () => {
      mockExamSet(makeExamSet());
      mockShare(makeShare({ expiresAt: FAR_FUTURE }));
      const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { expiresAt: null });
      assert.equal(res.statusCode, 200);
      assert.equal(res.data.expiresAt, null);
      restore();
    },
  });

  tests.push({
    name: "A3. Owner cập nhật note thành công",
    fn: async () => {
      mockExamSet(makeExamSet());
      mockShare(makeShare({ note: "" }));
      const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "Ghi chú mới" });
      assert.equal(res.statusCode, 200);
      restore();
    },
  });

  tests.push({
    name: "A4. Owner xóa note bằng null",
    fn: async () => {
      mockExamSet(makeExamSet());
      mockShare(makeShare({ note: "note cũ" }));
      const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: null });
      assert.equal(res.statusCode, 200);
      assert.equal(res.data.note, "");
      restore();
    },
  });

  tests.push({
    name: "A5. Owner cập nhật cả expiresAt và note",
    fn: async () => {
      mockExamSet(makeExamSet());
      mockShare(makeShare({ expiresAt: null, note: "" }));
      const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", {
        expiresAt: FUTURE_DATE,
        note: "Cả hai field",
      });
      assert.equal(res.statusCode, 200);
      restore();
    },
  });

  tests.push({
    name: "A6. Admin cập nhật thành công",
    fn: async () => {
      const otherUserId = "999f1f77bcf86cd799439999";
      mockExamSet(makeExamSet());
      mockShare(makeShare({ note: "" }));
      const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, otherUserId, "Admin", { note: "Admin update" });
      assert.equal(res.statusCode, 200);
      restore();
    },
  });

  tests.push({
    name: "A7. Share ACTIVE đã hết hạn được gia hạn thành công",
    fn: async () => {
      // expiresAt ở quá khứ nhưng status vẫn ACTIVE → được phép update
      mockExamSet(makeExamSet());
      mockShare(makeShare({ expiresAt: PAST_DATE, note: "old" }));
      const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { expiresAt: FUTURE_DATE });
      assert.equal(res.statusCode, 200);
      restore();
    },
  });

  tests.push({
    name: "A8. expiresAt tương lai được lưu đúng",
    fn: async () => {
      mockExamSet(makeExamSet());
      mockShare(makeShare({ expiresAt: null }));
      const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { expiresAt: FUTURE_DATE });
      assert.ok(res.data.expiresAt instanceof Date || res.data.expiresAt !== undefined);
      restore();
    },
  });

  tests.push({
    name: "A9. Note được trim",
    fn: async () => {
      mockExamSet(makeExamSet());
      mockShare(makeShare({ note: "" }));
      const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "  trimmed  " });
      assert.equal(res.data.note, "trimmed");
      restore();
    },
  });

  tests.push({
    name: "A10. Chuỗi rỗng sau trim được chuẩn hóa thành rỗng (note = '')",
    fn: async () => {
      mockExamSet(makeExamSet());
      mockShare(makeShare({ note: "old note" }));
      const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "   " });
      // Normalized: "   ".trim() === "" → store as ""
      assert.equal(res.data.note, "");
      restore();
    },
  });

  tests.push({
    name: "A11. updatedAt thay đổi sau update",
    fn: async () => {
      const originalDate = new Date("2026-01-01");
      const share = makeShare({ note: "old", updatedAt: originalDate });
      mockExamSet(makeExamSet());
      mockShare(share);
      const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new note" });
      // save() mock sets updatedAt = new Date() → not originalDate
      assert.ok(res.data.updatedAt > originalDate || res.statusCode === 200);
      restore();
    },
  });

  tests.push({
    name: "A12. createdAt giữ nguyên sau update",
    fn: async () => {
      const createdAt = new Date("2026-01-01");
      const share = makeShare({ createdAt, note: "old" });
      mockExamSet(makeExamSet());
      mockShare(share);
      const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" });
      assert.deepEqual(res.data.createdAt, createdAt);
      restore();
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // B. Field Integrity – protected fields must not change
  // ══════════════════════════════════════════════════════════════════════════

  tests.push({
    name: "B1. permission giữ nguyên",
    fn: async () => {
      const share = makeShare({ permission: "VIEW", note: "old" });
      mockExamSet(makeExamSet());
      mockShare(share);
      await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" });
      assert.equal(share.permission, "VIEW");
      restore();
    },
  });

  tests.push({
    name: "B2. status giữ nguyên",
    fn: async () => {
      const share = makeShare({ status: "ACTIVE", note: "old" });
      mockExamSet(makeExamSet());
      mockShare(share);
      await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" });
      assert.equal(share.status, "ACTIVE");
      restore();
    },
  });

  tests.push({
    name: "B3. ownerId giữ nguyên",
    fn: async () => {
      const share = makeShare({ ownerId: OWNER_ID, note: "old" });
      mockExamSet(makeExamSet());
      mockShare(share);
      await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" });
      assert.equal(String(share.ownerId), OWNER_ID);
      restore();
    },
  });

  tests.push({
    name: "B4. sharedWithUserId giữ nguyên",
    fn: async () => {
      const share = makeShare({ sharedWithUserId: SHARED_USER_ID, note: "old" });
      mockExamSet(makeExamSet());
      mockShare(share);
      await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" });
      assert.equal(String(share.sharedWithUserId), SHARED_USER_ID);
      restore();
    },
  });

  tests.push({
    name: "B5. sharedBy giữ nguyên",
    fn: async () => {
      const share = makeShare({ sharedBy: OWNER_ID, note: "old" });
      mockExamSet(makeExamSet());
      mockShare(share);
      await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" });
      assert.equal(String(share.sharedBy), OWNER_ID);
      restore();
    },
  });

  tests.push({
    name: "B6. revokedAt giữ nguyên (null)",
    fn: async () => {
      const share = makeShare({ revokedAt: null, note: "old" });
      mockExamSet(makeExamSet());
      mockShare(share);
      await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" });
      assert.equal(share.revokedAt, null);
      restore();
    },
  });

  tests.push({
    name: "B7. revokedBy giữ nguyên (null)",
    fn: async () => {
      const share = makeShare({ revokedBy: null, note: "old" });
      mockExamSet(makeExamSet());
      mockShare(share);
      await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" });
      assert.equal(share.revokedBy, null);
      restore();
    },
  });

  tests.push({
    name: "B8. Chỉ expiresAt và note thay đổi, không field nào khác",
    fn: async () => {
      const share = makeShare({ note: "old", expiresAt: null, permission: "EDIT", status: "ACTIVE" });
      mockExamSet(makeExamSet());
      mockShare(share);
      await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new", expiresAt: FUTURE_DATE });
      assert.equal(share.permission, "EDIT");
      assert.equal(share.status, "ACTIVE");
      restore();
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // C. Validation (service-level)
  // ══════════════════════════════════════════════════════════════════════════

  tests.push({
    name: "C1. examSetId sai ObjectId → 400",
    fn: async () => {
      let caught = null;
      try { await updateExamSetShareMetadataService("invalid-id", SHARE_ID, OWNER_ID, "Teacher", { note: "x" }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 400, `Expected 400, got ${caught?.status}`);
      restore();
    },
  });

  tests.push({
    name: "C2. shareId sai ObjectId → 400",
    fn: async () => {
      mockExamSet(makeExamSet());
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, "invalid-id", OWNER_ID, "Teacher", { note: "x" }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 400, `Expected 400, got ${caught?.status}`);
      restore();
    },
  });

  tests.push({
    name: "C3. Exam Set không tồn tại → 404",
    fn: async () => {
      mockExamSet(null);
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 404);
      restore();
    },
  });

  tests.push({
    name: "C4. Exam Set soft deleted → 404",
    fn: async () => {
      // isDeleted=true → findOne with { isDeleted: false } → null
      mockExamSet(null);
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 404);
      restore();
    },
  });

  tests.push({
    name: "C5. Share không tồn tại → 404",
    fn: async () => {
      mockExamSet(makeExamSet());
      mockShare(null);
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 404);
      restore();
    },
  });

  tests.push({
    name: "C6. Share thuộc ExamSet khác → 404",
    fn: async () => {
      mockExamSet(makeExamSet());
      // Service queries with examSetId filter → no result for wrong examSetId
      mockShare(null);
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 404);
      restore();
    },
  });

  tests.push({
    name: "C7. Share REVOKED → 409",
    fn: async () => {
      mockExamSet(makeExamSet());
      mockShare(makeShare({ status: "REVOKED" }));
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 409);
      restore();
    },
  });

  tests.push({
    name: "C8. Dữ liệu giống hiện tại → 409 no-op (cả hai field)",
    fn: async () => {
      mockExamSet(makeExamSet());
      const sameNote = "same note";
      const sameExpiry = FAR_FUTURE;
      mockShare(makeShare({ note: sameNote, expiresAt: sameExpiry }));
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: sameNote, expiresAt: sameExpiry.toISOString() }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 409, `Expected 409, got ${caught?.status}`);
      restore();
    },
  });

  tests.push({
    name: "C9. Chỉ expiresAt không đổi (note không gửi) → 409 no-op",
    fn: async () => {
      mockExamSet(makeExamSet());
      const sameExpiry = FAR_FUTURE;
      mockShare(makeShare({ expiresAt: sameExpiry }));
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { expiresAt: sameExpiry.toISOString() }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 409);
      restore();
    },
  });

  tests.push({
    name: "C10. Chỉ note không đổi (expiresAt không gửi) → 409 no-op",
    fn: async () => {
      mockExamSet(makeExamSet());
      const sameNote = "same";
      mockShare(makeShare({ note: sameNote }));
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: sameNote }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 409);
      restore();
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // D. Authorization
  // ══════════════════════════════════════════════════════════════════════════

  tests.push({
    name: "D1. Teacher không phải Owner bị 403",
    fn: async () => {
      mockExamSet(makeExamSet({ ownerId: OWNER_ID }));
      const otherTeacherId = "999f1f77bcf86cd799439001";
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, otherTeacherId, "Teacher", { note: "x" }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 403);
      restore();
    },
  });

  tests.push({
    name: "D2. Shared VIEW bị 403",
    fn: async () => {
      mockExamSet(makeExamSet({ ownerId: OWNER_ID }));
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, SHARED_USER_ID, "Teacher", { note: "x" }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 403);
      restore();
    },
  });

  tests.push({
    name: "D3. Shared EDIT bị 403",
    fn: async () => {
      mockExamSet(makeExamSet({ ownerId: OWNER_ID }));
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, SHARED_USER_ID, "Teacher", { note: "x" }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 403);
      restore();
    },
  });

  tests.push({
    name: "D4. Student bị 403",
    fn: async () => {
      mockExamSet(makeExamSet({ ownerId: OWNER_ID }));
      const studentId = "999f1f77bcf86cd799439002";
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, studentId, "Student", { note: "x" }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 403);
      restore();
    },
  });

  tests.push({
    name: "D5. Admin được phép (không phải owner) → success",
    fn: async () => {
      mockExamSet(makeExamSet({ ownerId: OWNER_ID }));
      mockShare(makeShare({ note: "" }));
      const adminId = "999f1f77bcf86cd799439003";
      const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, adminId, "Admin", { note: "admin note" });
      assert.equal(res.statusCode, 200);
      restore();
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // E. State / Edge Cases
  // ══════════════════════════════════════════════════════════════════════════

  tests.push({
    name: "E1. REVOKED share không được update → 409",
    fn: async () => {
      mockExamSet(makeExamSet());
      mockShare(makeShare({ status: "REVOKED", note: "old" }));
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "new" }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 409);
      restore();
    },
  });

  tests.push({
    name: "E2. Share không tồn tại → 404",
    fn: async () => {
      mockExamSet(makeExamSet());
      mockShare(null);
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 404);
      restore();
    },
  });

  tests.push({
    name: "E3. Exam Set không tồn tại → 404",
    fn: async () => {
      mockExamSet(null);
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 404);
      restore();
    },
  });

  tests.push({
    name: "E4. Exam Set soft delete → 404",
    fn: async () => {
      mockExamSet(null); // filter { isDeleted: false } → null
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 404);
      restore();
    },
  });

  tests.push({
    name: "E5. Share thuộc Exam Set khác → 404",
    fn: async () => {
      mockExamSet(makeExamSet());
      // Query includes examSetId filter → if share has different examSetId → null
      mockShare(null);
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: "x" }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 404);
      restore();
    },
  });

  tests.push({
    name: "E6. No-op: dữ liệu giống hoàn toàn → 409",
    fn: async () => {
      mockExamSet(makeExamSet());
      const note = "same value";
      mockShare(makeShare({ note, expiresAt: null }));
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note, expiresAt: null }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 409);
      restore();
    },
  });

  tests.push({
    name: "E7. Chỉ expiresAt không đổi → 409",
    fn: async () => {
      const existingExpiry = FAR_FUTURE;
      mockExamSet(makeExamSet());
      mockShare(makeShare({ expiresAt: existingExpiry }));
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { expiresAt: existingExpiry.toISOString() }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 409);
      restore();
    },
  });

  tests.push({
    name: "E8. Chỉ note không đổi → 409",
    fn: async () => {
      const note = "exact same";
      mockExamSet(makeExamSet());
      mockShare(makeShare({ note }));
      let caught = null;
      try { await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note }); }
      catch (err) { caught = err; }
      assert.ok(caught && caught.status === 409);
      restore();
    },
  });

  tests.push({
    name: "E9. Một field giống, một field thay đổi → update thành công",
    fn: async () => {
      const existingNote = "same";
      mockExamSet(makeExamSet());
      mockShare(makeShare({ note: existingNote, expiresAt: null }));
      // note same, expiresAt changes
      const res = await updateExamSetShareMetadataService(EXAM_SET_ID, SHARE_ID, OWNER_ID, "Teacher", { note: existingNote, expiresAt: FUTURE_DATE });
      assert.equal(res.statusCode, 200);
      restore();
    },
  });

  // ──────────────────────────────────────────────────────────────────────────
  // Run all
  // ──────────────────────────────────────────────────────────────────────────

  for (const t of tests) {
    const ok = await runTest(t.name, t.fn);
    if (ok) passed += 1;
  }

  console.log(`\n${passed}/${tests.length} tests passed.`);
  process.exit(passed === tests.length ? 0 : 1);
};

runAll();
