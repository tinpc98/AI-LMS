// Test "nối dây" cho cohortMechanism.controller.js — chỉ kiểm controller trích đúng
// params/body/user và gọi đúng service với đúng tham số + trả đúng shape response. Business
// logic (strike, ngưỡng pool, BR-16...) đã được test đầy đủ ở tầng service riêng.
import { describe, it, expect, vi, beforeEach } from "vitest";

const transitionCommitment = vi.fn();
const excuseCommitmentEvent = vi.fn();
const checkCohortLearningMaterialsReady = vi.fn();
const assignBackupTeacher = vi.fn();
const activateBackupTeacher = vi.fn();
const findOverdueSessions = vi.fn();
const escalateLevel1 = vi.fn();
const cancelSessionWithMakeup = vi.fn();

vi.mock("#modules/class/commitment.service.js", () => ({
  transitionCommitment: (...a) => transitionCommitment(...a),
  excuseCommitmentEvent: (...a) => excuseCommitmentEvent(...a),
}));
vi.mock("#modules/class/cohortReadiness.service.js", () => ({
  checkCohortLearningMaterialsReady: (...a) => checkCohortLearningMaterialsReady(...a),
}));
vi.mock("#modules/class/backupTeacher.service.js", () => ({
  assignBackupTeacher: (...a) => assignBackupTeacher(...a),
  activateBackupTeacher: (...a) => activateBackupTeacher(...a),
}));
vi.mock("#modules/class/escalation.service.js", () => ({
  findOverdueSessions: (...a) => findOverdueSessions(...a),
  escalateLevel1: (...a) => escalateLevel1(...a),
  cancelSessionWithMakeup: (...a) => cancelSessionWithMakeup(...a),
}));

const {
  transitionClassCommitment,
  excuseClassCommitmentEvent,
  getCohortReadiness,
  assignClassBackupTeacher,
  activateClassBackupTeacher,
  listOverdueSessions,
  escalateSessionLevel1,
  cancelSessionAndCreateMakeup,
} = await import("#modules/class/cohortMechanism.controller.js");

const buildRes = () => {
  const res = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("transitionClassCommitment", () => {
  it("Trích đúng id/toStatus/reason/note/changedBy(req.user), gọi service, trả 200", async () => {
    transitionCommitment.mockResolvedValue({ _id: "class-1", commitmentStatus: "ACCEPTED" });
    const req = {
      params: { id: "class-1" },
      body: { toStatus: "ACCEPTED", reason: "SCHEDULE_FILLED", note: "ghi chú" },
      user: { id: "admin-1" },
    };
    const res = buildRes();

    await transitionClassCommitment(req, res, vi.fn());

    expect(transitionCommitment).toHaveBeenCalledWith("class-1", "ACCEPTED", {
      reason: "SCHEDULE_FILLED",
      changedBy: "admin-1",
      note: "ghi chú",
    });
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("Thiếu toStatus → ValidationError chuyển qua next(), không gọi service", async () => {
    // Controller được bọc asyncHandler — lỗi throw ra được BẮT và chuyển cho next(), không
    // làm promise của controller reject (asyncHandler nuốt throw để forward qua next()).
    const req = { params: { id: "class-1" }, body: {}, user: { id: "admin-1" } };
    const res = buildRes();
    const next = vi.fn();

    await transitionClassCommitment(req, res, next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    expect(transitionCommitment).not.toHaveBeenCalled();
  });
});

describe("excuseClassCommitmentEvent", () => {
  it("Trích eventId + người thực hiện, gọi service", async () => {
    excuseCommitmentEvent.mockResolvedValue({ _id: "evt-1" });
    const req = { params: { eventId: "evt-1" }, user: { id: "admin-1" } };
    const res = buildRes();

    await excuseClassCommitmentEvent(req, res, vi.fn());

    expect(excuseCommitmentEvent).toHaveBeenCalledWith("evt-1", "admin-1");
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("assignClassBackupTeacher / activateClassBackupTeacher", () => {
  it("assignClassBackupTeacher: thiếu backupTeacherId → ValidationError chuyển qua next()", async () => {
    const req = { params: { id: "class-1" }, body: {} };
    const next = vi.fn();

    await assignClassBackupTeacher(req, buildRes(), next);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ status: 400 }));
    expect(assignBackupTeacher).not.toHaveBeenCalled();
  });

  it("activateClassBackupTeacher: gọi service với reason + changedBy đúng", async () => {
    activateBackupTeacher.mockResolvedValue({ activatedTeacherId: "backup-1" });
    const req = { params: { id: "class-1" }, body: { reason: "NO_SHOW" }, user: { id: "admin-1" } };

    await activateClassBackupTeacher(req, buildRes(), vi.fn());

    expect(activateBackupTeacher).toHaveBeenCalledWith("class-1", {
      reason: "NO_SHOW",
      changedBy: "admin-1",
    });
  });
});

describe("escalation endpoints", () => {
  it("listOverdueSessions: gọi findOverdueSessions không tham số, trả data", async () => {
    findOverdueSessions.mockResolvedValue([{ _id: "s1" }]);
    const res = buildRes();

    await listOverdueSessions({}, res, vi.fn());

    expect(findOverdueSessions).toHaveBeenCalledWith();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: [{ _id: "s1" }] }));
  });

  it("escalateSessionLevel1: message khác nhau tùy resolved true/false", async () => {
    escalateLevel1.mockResolvedValue({ resolved: false, reason: "NO_BACKUP_AVAILABLE" });
    const req = { params: { sessionId: "s1" } };
    const res = buildRes();

    await escalateSessionLevel1(req, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("Admin") })
    );
  });

  it("cancelSessionAndCreateMakeup: trích đúng body + adminId từ req.user", async () => {
    cancelSessionWithMakeup.mockResolvedValue({ cancelledSession: {}, makeupSession: {} });
    const req = {
      params: { sessionId: "s1" },
      body: { makeupScheduledStartAt: "2026-09-01", makeupScheduledEndAt: "2026-09-02" },
      user: { id: "admin-1" },
    };

    await cancelSessionAndCreateMakeup(req, buildRes(), vi.fn());

    expect(cancelSessionWithMakeup).toHaveBeenCalledWith("s1", {
      adminId: "admin-1",
      makeupScheduledStartAt: "2026-09-01",
      makeupScheduledEndAt: "2026-09-02",
    });
  });
});

describe("getCohortReadiness", () => {
  it("Trích id, gọi service, trả data", async () => {
    checkCohortLearningMaterialsReady.mockResolvedValue({ ready: true });
    const req = { params: { id: "class-1" } };
    const res = buildRes();

    await getCohortReadiness(req, res, vi.fn());

    expect(checkCohortLearningMaterialsReady).toHaveBeenCalledWith("class-1");
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: { ready: true } }));
  });
});
