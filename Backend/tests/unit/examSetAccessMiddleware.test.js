// Port từ src/scripts/runExamSetAccessMiddlewareTests.js (characterization test).
// Nhóm: A. VIEW access (10) | B. EDIT access (5) | C. Integrity (8) | D. Request context (6) | E. Route integration (9)
import { describe, it, expect, afterEach, vi } from "vitest";
import {
  requireExamSetAccess,
  requireExamSetEditAccess,
} from "../../src/middlewares/examSetAccess.middleware.js";
import ExamSet from "../../src/models/examSet.model.js";
import ExamSetShare from "../../src/models/examSetShare.model.js";

const VALID_EXAM_SET_ID = "607f1f77bcf86cd799439111";
const OWNER_ID = "507f1f77bcf86cd799439011";
const SHARED_USER_ID = "607f1f77bcf86cd799439222";
const OTHER_USER_ID = "607f1f77bcf86cd799439333";
const SHARE_ID = "707f1f77bcf86cd799439999";

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

const makeReq = (opts = {}) => ({
  user:
    opts.user !== undefined
      ? opts.user
      : { id: opts.userId || SHARED_USER_ID, role: opts.role || "Teacher" },
  params: {
    id: opts.paramId || VALID_EXAM_SET_ID,
    examSetId: opts.paramExamSetId || undefined,
    ...opts.params,
  },
});

const makeRes = () => {
  const res = { _status: null, _body: null };
  res.status = (code) => {
    res._status = code;
    return res;
  };
  res.json = (body) => {
    res._body = body;
    return res;
  };
  return res;
};

const runMiddleware = async (permission, reqOpts = {}, options = {}) => {
  const middleware = requireExamSetAccess(permission, options);
  const req = makeReq(reqOpts);
  const res = makeRes();
  let nextCalled = false;
  await middleware(req, res, () => {
    nextCalled = true;
  });
  return { status: res._status, body: res._body, nextCalled, req };
};

const mockExamSet = (doc) =>
  vi.spyOn(ExamSet, "findOne").mockImplementation(() => Promise.resolve(doc));
const mockShare = (doc) =>
  vi.spyOn(ExamSetShare, "findOne").mockImplementation(() => Promise.resolve(doc));
const setup = (examSetDoc, shareDoc) => {
  mockExamSet(examSetDoc);
  mockShare(shareDoc);
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("requireExamSetAccess — A. VIEW access", () => {
  it("A1. Owner truy cập VIEW thành công", async () => {
    setup(makeExamSet({ ownerId: OWNER_ID }), null);
    const { nextCalled } = await runMiddleware("VIEW", { userId: OWNER_ID, role: "Teacher" });
    expect(nextCalled).toBe(true);
  });

  it("A2. Admin truy cập VIEW thành công", async () => {
    setup(makeExamSet(), null);
    const { nextCalled } = await runMiddleware("VIEW", { userId: OTHER_USER_ID, role: "Admin" });
    expect(nextCalled).toBe(true);
  });

  it("A3. Shared VIEW truy cập VIEW thành công", async () => {
    setup(makeExamSet(), makeShare({ permission: "VIEW" }));
    const { nextCalled } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
    expect(nextCalled).toBe(true);
  });

  it("A4. Shared EDIT truy cập VIEW thành công (hierarchy)", async () => {
    setup(makeExamSet(), makeShare({ permission: "EDIT" }));
    const { nextCalled } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
    expect(nextCalled).toBe(true);
  });

  it("A5. User không share bị 403", async () => {
    setup(makeExamSet(), null);
    const { status, nextCalled } = await runMiddleware("VIEW", {
      userId: OTHER_USER_ID,
      role: "Teacher",
    });
    expect(nextCalled).toBe(false);
    expect(status).toBe(403);
  });

  it("A6. REVOKED share bị 403", async () => {
    setup(makeExamSet(), null);
    const { status, nextCalled } = await runMiddleware("VIEW", {
      userId: SHARED_USER_ID,
      role: "Teacher",
    });
    expect(nextCalled).toBe(false);
    expect(status).toBe(403);
  });

  it("A7. EXPIRED status bị 403", async () => {
    setup(makeExamSet(), null);
    const { status } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
    expect(status).toBe(403);
  });

  it("A8. ACTIVE nhưng expiresAt quá khứ bị 403", async () => {
    setup(makeExamSet(), null);
    const { status } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
    expect(status).toBe(403);
  });

  it("A9. ACTIVE, expiresAt = null → thành công", async () => {
    setup(makeExamSet(), makeShare({ permission: "VIEW", expiresAt: null }));
    const { nextCalled } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
    expect(nextCalled).toBe(true);
  });

  it("A10. ACTIVE, expiresAt tương lai → thành công", async () => {
    const future = new Date(Date.now() + 3600 * 1000);
    setup(makeExamSet(), makeShare({ permission: "VIEW", expiresAt: future }));
    const { nextCalled } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
    expect(nextCalled).toBe(true);
  });
});

describe("requireExamSetAccess — B. EDIT access", () => {
  it("B1. Owner truy cập EDIT thành công", async () => {
    setup(makeExamSet({ ownerId: OWNER_ID }), null);
    const { nextCalled } = await runMiddleware("EDIT", { userId: OWNER_ID, role: "Teacher" });
    expect(nextCalled).toBe(true);
  });

  it("B2. Admin truy cập EDIT thành công", async () => {
    setup(makeExamSet(), null);
    const { nextCalled } = await runMiddleware("EDIT", { userId: OTHER_USER_ID, role: "Admin" });
    expect(nextCalled).toBe(true);
  });

  it("B3. Shared EDIT truy cập EDIT thành công", async () => {
    setup(makeExamSet(), makeShare({ permission: "EDIT" }));
    const { nextCalled } = await runMiddleware("EDIT", { userId: SHARED_USER_ID, role: "Teacher" });
    expect(nextCalled).toBe(true);
  });

  it("B4. Shared VIEW truy cập EDIT bị 403", async () => {
    setup(makeExamSet(), makeShare({ permission: "VIEW" }));
    const { status, nextCalled } = await runMiddleware("EDIT", {
      userId: SHARED_USER_ID,
      role: "Teacher",
    });
    expect(nextCalled).toBe(false);
    expect(status).toBe(403);
  });

  it("B5. User không share bị 403 (EDIT)", async () => {
    setup(makeExamSet(), null);
    const { status, nextCalled } = await runMiddleware("EDIT", {
      userId: OTHER_USER_ID,
      role: "Teacher",
    });
    expect(nextCalled).toBe(false);
    expect(status).toBe(403);
  });
});

describe("requireExamSetAccess — C. Integrity", () => {
  it("C1. Share của ExamSet khác không có quyền", async () => {
    setup(makeExamSet(), null);
    const { status } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
    expect(status).toBe(403);
  });

  it("C2. Share của user khác không có quyền", async () => {
    setup(makeExamSet(), null);
    const { status } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
    expect(status).toBe(403);
  });

  it("C3. ExamSet không tồn tại trả 404", async () => {
    mockExamSet(null);
    const { status, nextCalled } = await runMiddleware("VIEW", {
      userId: SHARED_USER_ID,
      role: "Teacher",
    });
    expect(nextCalled).toBe(false);
    expect(status).toBe(404);
  });

  it("C4. ExamSet soft delete trả 404", async () => {
    mockExamSet(null);
    const { status } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
    expect(status).toBe(404);
  });

  it("C5. examSetId sai ObjectId trả 400", async () => {
    const middleware = requireExamSetAccess("VIEW");
    const req = { user: { id: SHARED_USER_ID, role: "Teacher" }, params: { id: "not-valid-id" } };
    const res = makeRes();
    let nextCalled = false;
    await middleware(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(false);
    expect(res._status).toBe(400);
  });

  it("C6. req.user thiếu trả 401", async () => {
    const middleware = requireExamSetAccess("VIEW");
    const req = { user: undefined, params: { id: VALID_EXAM_SET_ID } };
    const res = makeRes();
    let nextCalled = false;
    await middleware(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(false);
    expect(res._status).toBe(401);
  });

  it("C7. Share Version 2 không có quyền với Version 3 (khác examSetId)", async () => {
    setup(makeExamSet({ _id: VALID_EXAM_SET_ID }), null);
    const { status } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
    expect(status).toBe(403);
  });

  it("C8. examSetId param rỗng trả 400", async () => {
    const middleware = requireExamSetAccess("VIEW");
    const req = { user: { id: SHARED_USER_ID, role: "Teacher" }, params: {} };
    const res = makeRes();
    let nextCalled = false;
    await middleware(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(false);
    expect(res._status).toBe(400);
  });
});

describe("requireExamSetAccess — D. Request context", () => {
  it("D1. Owner context: accessType=OWNER, permission=EDIT, shareId=null", async () => {
    setup(makeExamSet({ ownerId: OWNER_ID }), null);
    const { req, nextCalled } = await runMiddleware("VIEW", { userId: OWNER_ID, role: "Teacher" });
    expect(nextCalled).toBe(true);
    expect(req.examSetAccess).toBeTruthy();
    expect(req.examSetAccess.accessType).toBe("OWNER");
    expect(req.examSetAccess.permission).toBe("EDIT");
    expect(req.examSetAccess.shareId).toBe(null);
  });

  it("D2. Admin context: accessType=ADMIN, permission=EDIT, shareId=null", async () => {
    setup(makeExamSet(), null);
    const { req, nextCalled } = await runMiddleware("VIEW", {
      userId: OTHER_USER_ID,
      role: "Admin",
    });
    expect(nextCalled).toBe(true);
    expect(req.examSetAccess.accessType).toBe("ADMIN");
    expect(req.examSetAccess.permission).toBe("EDIT");
    expect(req.examSetAccess.shareId).toBe(null);
  });

  it("D3. Shared VIEW context: accessType=SHARED, permission=VIEW, shareId set", async () => {
    setup(makeExamSet(), makeShare({ permission: "VIEW", _id: SHARE_ID }));
    const { req, nextCalled } = await runMiddleware("VIEW", {
      userId: SHARED_USER_ID,
      role: "Teacher",
    });
    expect(nextCalled).toBe(true);
    expect(req.examSetAccess.accessType).toBe("SHARED");
    expect(req.examSetAccess.permission).toBe("VIEW");
    expect(req.examSetAccess.shareId).toBeTruthy();
  });

  it("D4. Shared EDIT context: accessType=SHARED, permission=EDIT, shareId set", async () => {
    setup(makeExamSet(), makeShare({ permission: "EDIT", _id: SHARE_ID }));
    const { req, nextCalled } = await runMiddleware("EDIT", {
      userId: SHARED_USER_ID,
      role: "Teacher",
    });
    expect(nextCalled).toBe(true);
    expect(req.examSetAccess.accessType).toBe("SHARED");
    expect(req.examSetAccess.permission).toBe("EDIT");
    expect(req.examSetAccess.shareId).toBeTruthy();
  });

  it("D5. req.examSet được gắn (backward compat)", async () => {
    setup(makeExamSet({ ownerId: OWNER_ID }), null);
    const { req, nextCalled } = await runMiddleware("VIEW", { userId: OWNER_ID, role: "Teacher" });
    expect(nextCalled).toBe(true);
    expect(req.examSet).toBeTruthy();
    expect(String(req.examSet._id)).toBe(VALID_EXAM_SET_ID);
  });

  it("D6. shareId chỉ có khi accessType=SHARED, null cho OWNER/ADMIN", async () => {
    setup(makeExamSet({ ownerId: OWNER_ID }), null);
    const { req: ownerReq } = await runMiddleware("VIEW", { userId: OWNER_ID, role: "Teacher" });
    expect(ownerReq.examSetAccess.shareId).toBe(null);

    setup(makeExamSet(), null);
    const { req: adminReq } = await runMiddleware("VIEW", { userId: OTHER_USER_ID, role: "Admin" });
    expect(adminReq.examSetAccess.shareId).toBe(null);

    setup(makeExamSet(), makeShare({ _id: SHARE_ID }));
    const { req: sharedReq } = await runMiddleware("VIEW", {
      userId: SHARED_USER_ID,
      role: "Teacher",
    });
    expect(sharedReq.examSetAccess.shareId).not.toBe(null);
  });
});

describe("requireExamSetAccess — E. Route integration", () => {
  it("E1. Shared VIEW xem detail (VIEW route) → pass", async () => {
    setup(makeExamSet(), makeShare({ permission: "VIEW" }));
    const { nextCalled } = await runMiddleware("VIEW", { userId: SHARED_USER_ID, role: "Teacher" });
    expect(nextCalled).toBe(true);
  });

  it("E2. Shared VIEW gọi update (EDIT route) → 403", async () => {
    setup(makeExamSet(), makeShare({ permission: "VIEW" }));
    const { status, nextCalled } = await runMiddleware("EDIT", {
      userId: SHARED_USER_ID,
      role: "Teacher",
    });
    expect(nextCalled).toBe(false);
    expect(status).toBe(403);
  });

  it("E3. Shared EDIT update ExamSet (EDIT route) → pass", async () => {
    setup(makeExamSet(), makeShare({ permission: "EDIT" }));
    const { nextCalled } = await runMiddleware("EDIT", { userId: SHARED_USER_ID, role: "Teacher" });
    expect(nextCalled).toBe(true);
  });

  it("E4. Shared EDIT tạo Question (EDIT route) → pass", async () => {
    setup(makeExamSet(), makeShare({ permission: "EDIT" }));
    const { nextCalled } = await runMiddleware("EDIT", { userId: SHARED_USER_ID, role: "Teacher" });
    expect(nextCalled).toBe(true);
  });

  it("E5. Shared VIEW tạo Question (EDIT route) → 403", async () => {
    setup(makeExamSet(), makeShare({ permission: "VIEW" }));
    const { status, nextCalled } = await runMiddleware("EDIT", {
      userId: SHARED_USER_ID,
      role: "Teacher",
    });
    expect(nextCalled).toBe(false);
    expect(status).toBe(403);
  });

  it("E6. requireExamSetAccess hỗ trợ param :examSetId (sub-resource routes)", async () => {
    setup(makeExamSet(), makeShare({ permission: "EDIT" }));
    const middleware = requireExamSetAccess("EDIT");
    const req = {
      user: { id: SHARED_USER_ID, role: "Teacher" },
      params: { examSetId: VALID_EXAM_SET_ID },
    };
    const res = makeRes();
    let nextCalled = false;
    await middleware(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
  });

  it("E7. requireExamSetAccess hỗ trợ option paramName custom", async () => {
    setup(makeExamSet(), makeShare({ permission: "VIEW" }));
    const middleware = requireExamSetAccess("VIEW", { paramName: "setId" });
    const req = {
      user: { id: SHARED_USER_ID, role: "Teacher" },
      params: { setId: VALID_EXAM_SET_ID },
    };
    const res = makeRes();
    let nextCalled = false;
    await middleware(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
  });

  it("E8. Owner route cũ (requireExamSetEditAccess) vẫn hoạt động với Owner", async () => {
    mockExamSet(makeExamSet({ ownerId: OWNER_ID }));
    const req = { user: { id: OWNER_ID, role: "Teacher" }, params: { id: VALID_EXAM_SET_ID } };
    const res = makeRes();
    let nextCalled = false;
    await requireExamSetEditAccess(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
  });

  it("E9. Admin route cũ (requireExamSetEditAccess) vẫn hoạt động với Admin", async () => {
    mockExamSet(makeExamSet());
    const req = { user: { id: OTHER_USER_ID, role: "Admin" }, params: { id: VALID_EXAM_SET_ID } };
    const res = makeRes();
    let nextCalled = false;
    await requireExamSetEditAccess(req, res, () => {
      nextCalled = true;
    });
    expect(nextCalled).toBe(true);
  });
});
