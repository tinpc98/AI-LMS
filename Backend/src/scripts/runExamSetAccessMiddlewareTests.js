/**
 * Tests cho requireExamSetAccess middleware factory
 *
 * Convention: runTest + assert (không dùng Jest/Mocha)
 * Tất cả test dùng mock – không kết nối DB.
 *
 * Nhóm:
 * A. VIEW access           (10 cases)
 * B. EDIT access           (5 cases)
 * C. Integrity             (8 cases)
 * D. Request context       (6 cases)
 * E. Route integration     (9 cases)
 *
 * Tổng: 38 test cases
 */

import assert from "assert";
import { requireExamSetAccess } from "../middlewares/examSetAccess.middlewares.js";
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

const VALID_EXAM_SET_ID = "607f1f77bcf86cd799439111";
const OWNER_ID          = "507f1f77bcf86cd799439011";
const SHARED_USER_ID    = "607f1f77bcf86cd799439222";
const OTHER_USER_ID     = "607f1f77bcf86cd799439333";
const SHARE_ID          = "707f1f77bcf86cd799439999";
const OTHER_EXAM_ID     = "607f1f77bcf86cd799439444";

const makeExamSet = (props = {}) => ({
  _id: VALID_EXAM_SET_ID,
  ownerId: OWNER_ID,
  title: "Bộ đề A",
  status: "draft",
  isDeleted: false,
  ...props,
});

const makeShare = (props = {}) => ({
  _id: SHARE_ID,
  examSetId: VALID_EXAM_SET_ID,
  sharedWithUserId: SHARED_USER_ID,
  permission: "VIEW",
  status: "ACTIVE",
  expiresAt: null,
  ...props,
});

/**
 * Tạo mock req.
 * @param {{ userId, role, paramId, paramExamSetId }} opts
 */
const makeReq = (opts = {}) => ({
  user: opts.user !== undefined
    ? opts.user
    : { id: opts.userId || SHARED_USER_ID, role: opts.role || "Teacher" },
  params: {
    id: opts.paramId || VALID_EXAM_SET_ID,
    examSetId: opts.paramExamSetId || undefined,
    ...opts.params,
  },
});

/**
 * Tạo mock res – capture status + json call.
 */
const makeRes = () => {
  const res = { _status: null, _body: null };
  res.status = (code) => { res._status = code; return res; };
  res.json = (body) => { res._body = body; return res; };
  return res;
};

/**
 * Chạy middleware và trả về { status, body, nextCalled, req }.
 */
const runMiddleware = async (permission, reqOpts = {}, options = {}) => {
  const middleware = requireExamSetAccess(permission, options);
  const req = makeReq(reqOpts);
  const res = makeRes();
  let nextCalled = false;
  await middleware(req, res, () => { nextCalled = true; });
  return { status: res._status, body: res._body, nextCalled, req };
};

// ──────────────────────────────────────────────────────────────────────────────
// Test suite
// ──────────────────────────────────────────────────────────────────────────────

const runAll = async () => {
  let passed = 0;
  const tests = [];

  // ── Lưu originals để restore sau mỗi test ────────────────────────────────
  const origFindOneExamSet  = ExamSet.findOne;
  const origFindOneShare    = ExamSetShare.findOne;

  const mockExamSet = (doc) => { ExamSet.findOne    = () => Promise.resolve(doc); };
  const mockShare   = (doc) => { ExamSetShare.findOne = () => Promise.resolve(doc); };

  const restore = () => {
    ExamSet.findOne    = origFindOneExamSet;
    ExamSetShare.findOne = origFindOneShare;
  };

  // Helper: mock cả hai
  const setup = (examSetDoc, shareDoc) => {
    mockExamSet(examSetDoc);
    mockShare(shareDoc);
  };

  // ══════════════════════════════════════════════════════════════════════════
  // A. VIEW access
  // ══════════════════════════════════════════════════════════════════════════

  tests.push({
    name: "A1. Owner truy cập VIEW thành công",
    fn: async () => {
      setup(makeExamSet({ ownerId: OWNER_ID }), null);
      const { nextCalled } = await runMiddleware("VIEW", { userId: OWNER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, true);
      restore();
    },
  });

  tests.push({
    name: "A2. Admin truy cập VIEW thành công",
    fn: async () => {
      setup(makeExamSet(), null);
      const { nextCalled } = await runMiddleware("VIEW", { userId: OTHER_USER_ID, role: "Admin" });
      assert.strictEqual(nextCalled, true);
      restore();
    },
  });

  tests.push({
    name: "A3. Shared VIEW truy cập VIEW thành công",
    fn: async () => {
      setup(makeExamSet(), makeShare({ permission: "VIEW" }));
      const { nextCalled } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, true);
      restore();
    },
  });

  tests.push({
    name: "A4. Shared EDIT truy cập VIEW thành công (hierarchy)",
    fn: async () => {
      setup(makeExamSet(), makeShare({ permission: "EDIT" }));
      const { nextCalled } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, true);
      restore();
    },
  });

  tests.push({
    name: "A5. User không share bị 403",
    fn: async () => {
      setup(makeExamSet(), null);
      const { status, nextCalled } = await runMiddleware("VIEW", { userId: OTHER_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, false);
      assert.strictEqual(status, 403);
      restore();
    },
  });

  tests.push({
    name: "A6. REVOKED share bị 403",
    fn: async () => {
      // Share REVOKED không khớp filter ACTIVE → findOne trả null
      setup(makeExamSet(), null);
      const { status, nextCalled } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, false);
      assert.strictEqual(status, 403);
      restore();
    },
  });

  tests.push({
    name: "A7. EXPIRED status bị 403",
    fn: async () => {
      // status = EXPIRED không khớp filter ACTIVE → findOne trả null
      setup(makeExamSet(), null);
      const { status } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(status, 403);
      restore();
    },
  });

  tests.push({
    name: "A8. ACTIVE nhưng expiresAt quá khứ bị 403",
    fn: async () => {
      // expiresAt < now → không khớp $gt filter → findOne trả null
      setup(makeExamSet(), null);
      const { status } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(status, 403);
      restore();
    },
  });

  tests.push({
    name: "A9. ACTIVE, expiresAt = null → thành công",
    fn: async () => {
      setup(makeExamSet(), makeShare({ permission: "VIEW", expiresAt: null }));
      const { nextCalled } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, true);
      restore();
    },
  });

  tests.push({
    name: "A10. ACTIVE, expiresAt tương lai → thành công",
    fn: async () => {
      const future = new Date(Date.now() + 3600 * 1000);
      setup(makeExamSet(), makeShare({ permission: "VIEW", expiresAt: future }));
      const { nextCalled } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, true);
      restore();
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // B. EDIT access
  // ══════════════════════════════════════════════════════════════════════════

  tests.push({
    name: "B1. Owner truy cập EDIT thành công",
    fn: async () => {
      setup(makeExamSet({ ownerId: OWNER_ID }), null);
      const { nextCalled } = await runMiddleware("EDIT", { userId: OWNER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, true);
      restore();
    },
  });

  tests.push({
    name: "B2. Admin truy cập EDIT thành công",
    fn: async () => {
      setup(makeExamSet(), null);
      const { nextCalled } = await runMiddleware("EDIT", { userId: OTHER_USER_ID, role: "Admin" });
      assert.strictEqual(nextCalled, true);
      restore();
    },
  });

  tests.push({
    name: "B3. Shared EDIT truy cập EDIT thành công",
    fn: async () => {
      setup(makeExamSet(), makeShare({ permission: "EDIT" }));
      const { nextCalled } = await runMiddleware("EDIT", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, true);
      restore();
    },
  });

  tests.push({
    name: "B4. Shared VIEW truy cập EDIT bị 403",
    fn: async () => {
      setup(makeExamSet(), makeShare({ permission: "VIEW" }));
      const { status, nextCalled } = await runMiddleware("EDIT", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, false);
      assert.strictEqual(status, 403);
      restore();
    },
  });

  tests.push({
    name: "B5. User không share bị 403 (EDIT)",
    fn: async () => {
      setup(makeExamSet(), null);
      const { status, nextCalled } = await runMiddleware("EDIT", { userId: OTHER_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, false);
      assert.strictEqual(status, 403);
      restore();
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // C. Integrity
  // ══════════════════════════════════════════════════════════════════════════

  tests.push({
    name: "C1. Share của ExamSet khác không có quyền",
    fn: async () => {
      // Middleware query với examSet._id = VALID_EXAM_SET_ID.
      // Nếu DB có share nhưng cho examSetId khác → mock trả null (simulate)
      setup(makeExamSet(), null);  // findOne share trả null
      const { status } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(status, 403);
      restore();
    },
  });

  tests.push({
    name: "C2. Share của user khác không có quyền",
    fn: async () => {
      // Middleware filter sharedWithUserId = req.user.id.
      // Share của OTHER_USER_ID không match → mock trả null
      setup(makeExamSet(), null);
      const { status } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(status, 403);
      restore();
    },
  });

  tests.push({
    name: "C3. ExamSet không tồn tại trả 404",
    fn: async () => {
      mockExamSet(null);
      const { status, nextCalled } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, false);
      assert.strictEqual(status, 404);
      restore();
    },
  });

  tests.push({
    name: "C4. ExamSet soft delete trả 404",
    fn: async () => {
      // isDeleted: true → findOne với filter { isDeleted: false } trả null
      mockExamSet(null);
      const { status } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(status, 404);
      restore();
    },
  });

  tests.push({
    name: "C5. examSetId sai ObjectId trả 400",
    fn: async () => {
      const middleware = requireExamSetAccess("VIEW");
      const req = { user: { id: SHARED_USER_ID, role: "Teacher" }, params: { id: "not-valid-id" } };
      const res = makeRes();
      let nextCalled = false;
      await middleware(req, res, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res._status, 400);
      restore();
    },
  });

  tests.push({
    name: "C6. req.user thiếu trả 401",
    fn: async () => {
      const middleware = requireExamSetAccess("VIEW");
      const req = { user: undefined, params: { id: VALID_EXAM_SET_ID } };
      const res = makeRes();
      let nextCalled = false;
      await middleware(req, res, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res._status, 401);
      restore();
    },
  });

  tests.push({
    name: "C7. Share Version 2 không có quyền với Version 3 (khác examSetId)",
    fn: async () => {
      // Simulate: user được share examSetId = OTHER_EXAM_ID nhưng truy cập VALID_EXAM_SET_ID
      // Middleware sẽ query share với examSetId = VALID_EXAM_SET_ID → null
      setup(makeExamSet({ _id: VALID_EXAM_SET_ID }), null);
      const { status } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(status, 403);
      restore();
    },
  });

  tests.push({
    name: "C8. examSetId param rỗng trả 400",
    fn: async () => {
      const middleware = requireExamSetAccess("VIEW");
      const req = { user: { id: SHARED_USER_ID, role: "Teacher" }, params: {} };
      const res = makeRes();
      let nextCalled = false;
      await middleware(req, res, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, false);
      assert.strictEqual(res._status, 400);
      restore();
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // D. Request context
  // ══════════════════════════════════════════════════════════════════════════

  tests.push({
    name: "D1. Owner context: accessType=OWNER, permission=EDIT, shareId=null",
    fn: async () => {
      setup(makeExamSet({ ownerId: OWNER_ID }), null);
      const { req, nextCalled } = await runMiddleware("VIEW", { userId: OWNER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, true);
      assert.ok(req.examSetAccess, "req.examSetAccess phải được gắn");
      assert.strictEqual(req.examSetAccess.accessType, "OWNER");
      assert.strictEqual(req.examSetAccess.permission, "EDIT");
      assert.strictEqual(req.examSetAccess.shareId, null);
      restore();
    },
  });

  tests.push({
    name: "D2. Admin context: accessType=ADMIN, permission=EDIT, shareId=null",
    fn: async () => {
      setup(makeExamSet(), null);
      const { req, nextCalled } = await runMiddleware("VIEW", { userId: OTHER_USER_ID, role: "Admin" });
      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.examSetAccess.accessType, "ADMIN");
      assert.strictEqual(req.examSetAccess.permission, "EDIT");
      assert.strictEqual(req.examSetAccess.shareId, null);
      restore();
    },
  });

  tests.push({
    name: "D3. Shared VIEW context: accessType=SHARED, permission=VIEW, shareId set",
    fn: async () => {
      setup(makeExamSet(), makeShare({ permission: "VIEW", _id: SHARE_ID }));
      const { req, nextCalled } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.examSetAccess.accessType, "SHARED");
      assert.strictEqual(req.examSetAccess.permission, "VIEW");
      assert.ok(req.examSetAccess.shareId, "shareId phải được gắn");
      restore();
    },
  });

  tests.push({
    name: "D4. Shared EDIT context: accessType=SHARED, permission=EDIT, shareId set",
    fn: async () => {
      setup(makeExamSet(), makeShare({ permission: "EDIT", _id: SHARE_ID }));
      const { req, nextCalled } = await runMiddleware("EDIT", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, true);
      assert.strictEqual(req.examSetAccess.accessType, "SHARED");
      assert.strictEqual(req.examSetAccess.permission, "EDIT");
      assert.ok(req.examSetAccess.shareId);
      restore();
    },
  });

  tests.push({
    name: "D5. req.examSet được gắn (backward compat)",
    fn: async () => {
      const examSetDoc = makeExamSet({ ownerId: OWNER_ID });
      setup(examSetDoc, null);
      const { req, nextCalled } = await runMiddleware("VIEW", { userId: OWNER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, true);
      assert.ok(req.examSet, "req.examSet phải được gắn");
      assert.strictEqual(String(req.examSet._id), VALID_EXAM_SET_ID);
      restore();
    },
  });

  tests.push({
    name: "D6. shareId chỉ có khi accessType=SHARED, null cho OWNER/ADMIN",
    fn: async () => {
      // Owner
      setup(makeExamSet({ ownerId: OWNER_ID }), null);
      const { req: ownerReq } = await runMiddleware("VIEW", { userId: OWNER_ID, role: "Teacher" });
      assert.strictEqual(ownerReq.examSetAccess.shareId, null);
      restore();

      // Admin
      setup(makeExamSet(), null);
      const { req: adminReq } = await runMiddleware("VIEW", { userId: OTHER_USER_ID, role: "Admin" });
      assert.strictEqual(adminReq.examSetAccess.shareId, null);
      restore();

      // Shared
      setup(makeExamSet(), makeShare({ _id: SHARE_ID }));
      const { req: sharedReq } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.notStrictEqual(sharedReq.examSetAccess.shareId, null);
      restore();
    },
  });

  // ══════════════════════════════════════════════════════════════════════════
  // E. Route integration (mock req/res pattern)
  // ══════════════════════════════════════════════════════════════════════════

  tests.push({
    name: "E1. Shared VIEW xem detail (VIEW route) → pass",
    fn: async () => {
      setup(makeExamSet(), makeShare({ permission: "VIEW" }));
      const { nextCalled } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, true);
      restore();
    },
  });

  tests.push({
    name: "E2. Shared VIEW gọi update (EDIT route) → 403",
    fn: async () => {
      setup(makeExamSet(), makeShare({ permission: "VIEW" }));
      const { status, nextCalled } = await runMiddleware("EDIT", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, false);
      assert.strictEqual(status, 403);
      restore();
    },
  });

  tests.push({
    name: "E3. Shared EDIT update ExamSet (EDIT route) → pass",
    fn: async () => {
      setup(makeExamSet(), makeShare({ permission: "EDIT" }));
      const { nextCalled } = await runMiddleware("EDIT", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, true);
      restore();
    },
  });

  tests.push({
    name: "E4. Shared EDIT tạo Question (EDIT route) → pass",
    fn: async () => {
      setup(makeExamSet(), makeShare({ permission: "EDIT" }));
      const { nextCalled } = await runMiddleware("EDIT", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, true);
      restore();
    },
  });

  tests.push({
    name: "E5. Shared VIEW tạo Question (EDIT route) → 403",
    fn: async () => {
      setup(makeExamSet(), makeShare({ permission: "VIEW" }));
      const { status, nextCalled } = await runMiddleware("EDIT", { userId: SHARED_USER_ID, role: "Teacher" });
      assert.strictEqual(nextCalled, false);
      assert.strictEqual(status, 403);
      restore();
    },
  });

  tests.push({
    name: "E6. requireExamSetAccess hỗ trợ param :examSetId (sub-resource routes)",
    fn: async () => {
      setup(makeExamSet(), makeShare({ permission: "EDIT" }));
      const middleware = requireExamSetAccess("EDIT");
      const req = {
        user: { id: SHARED_USER_ID, role: "Teacher" },
        params: { examSetId: VALID_EXAM_SET_ID },  // param name khác
      };
      const res = makeRes();
      let nextCalled = false;
      await middleware(req, res, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, true);
      restore();
    },
  });

  tests.push({
    name: "E7. requireExamSetAccess hỗ trợ option paramName custom",
    fn: async () => {
      setup(makeExamSet(), makeShare({ permission: "VIEW" }));
      const middleware = requireExamSetAccess("VIEW", { paramName: "setId" });
      const req = {
        user: { id: SHARED_USER_ID, role: "Teacher" },
        params: { setId: VALID_EXAM_SET_ID },
      };
      const res = makeRes();
      let nextCalled = false;
      await middleware(req, res, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, true);
      restore();
    },
  });

  tests.push({
    name: "E8. Owner route cũ (requireExamSetEditAccess) vẫn hoạt động với Owner",
    fn: async () => {
      const { requireExamSetEditAccess } = await import(
        "../middlewares/examSetAccess.middlewares.js"
      );
      mockExamSet(makeExamSet({ ownerId: OWNER_ID }));
      const req = {
        user: { id: OWNER_ID, role: "Teacher" },
        params: { id: VALID_EXAM_SET_ID },
      };
      const res = makeRes();
      let nextCalled = false;
      await requireExamSetEditAccess(req, res, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, true);
      restore();
    },
  });

  tests.push({
    name: "E9. Admin route cũ (requireExamSetEditAccess) vẫn hoạt động với Admin",
    fn: async () => {
      const { requireExamSetEditAccess } = await import(
        "../middlewares/examSetAccess.middlewares.js"
      );
      mockExamSet(makeExamSet());
      const req = {
        user: { id: OTHER_USER_ID, role: "Admin" },
        params: { id: VALID_EXAM_SET_ID },
      };
      const res = makeRes();
      let nextCalled = false;
      await requireExamSetEditAccess(req, res, () => { nextCalled = true; });
      assert.strictEqual(nextCalled, true);
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
