// Test cho escalation.service.js — EduSpace mechanism design Phần B.1 (BR-13/14).
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

const sessionFind = vi.fn();
const sessionFindById = vi.fn();
const sessionCreate = vi.fn();
const sessionCountDocuments = vi.fn();
const classFindById = vi.fn();
const classUpdateOne = vi.fn();
const classFind = vi.fn();
const activateBackup = vi.fn();

vi.mock("#modules/classSession", () => ({
  ClassSession: {
    find: (...a) => sessionFind(...a),
    findById: (...a) => sessionFindById(...a),
    create: (...a) => sessionCreate(...a),
    countDocuments: (...a) => sessionCountDocuments(...a),
  },
}));
vi.mock("#modules/class/class.model.js", () => ({
  default: {
    findById: (...a) => classFindById(...a),
    updateOne: (...a) => classUpdateOne(...a),
    find: (...a) => classFind(...a),
  },
}));
vi.mock("#modules/class/backupTeacher.service.js", () => ({
  activateBackupTeacher: (...a) => activateBackup(...a),
}));

const {
  findOverdueSessions,
  escalateLevel1,
  cancelSessionWithMakeup,
  checkCancelledSessionThreshold,
  listCohortsFlaggedForReview,
  CHECKIN_GRACE_MINUTES,
  MAX_CANCELLED_SESSIONS_BEFORE_REVIEW,
} = await import("#modules/class/escalation.service.js");

const CLASS_ID = new mongoose.Types.ObjectId().toString();
const SESSION_ID = new mongoose.Types.ObjectId().toString();

beforeEach(() => {
  vi.clearAllMocks();
  classUpdateOne.mockResolvedValue({ modifiedCount: 1 });
});

describe("findOverdueSessions", () => {
  it(`Lọc đúng: status=SCHEDULED, actualStartAt=null, scheduledStartAt <= now - ${CHECKIN_GRACE_MINUTES} phút`, async () => {
    sessionFind.mockReturnValue({ lean: () => Promise.resolve([]) });
    const now = new Date("2026-08-01T10:00:00Z");

    await findOverdueSessions(now);

    const filter = sessionFind.mock.calls[0][0];
    expect(filter.status).toBe("SCHEDULED");
    expect(filter.actualStartAt).toBeNull();
    const expectedCutoff = new Date(now.getTime() - CHECKIN_GRACE_MINUTES * 60 * 1000);
    expect(filter.scheduledStartAt.$lte.getTime()).toBe(expectedCutoff.getTime());
  });
});

describe("escalateLevel1", () => {
  it("Có dự bị → kích hoạt thành công, resolved=true", async () => {
    sessionFindById.mockResolvedValue({ _id: SESSION_ID, classId: CLASS_ID });
    classFindById.mockReturnValue({
      select: () => ({ lean: () => Promise.resolve({ backupTeacherId: "backup-1" }) }),
    });
    activateBackup.mockResolvedValue({});

    const result = await escalateLevel1(SESSION_ID);

    expect(result.resolved).toBe(true);
    expect(result.reason).toBe("BACKUP_ACTIVATED");
    expect(activateBackup).toHaveBeenCalledWith(CLASS_ID, { reason: "NO_SHOW" });
  });

  it("Không có dự bị → resolved=false, đẩy lên Mức 2, KHÔNG gọi activateBackupTeacher", async () => {
    sessionFindById.mockResolvedValue({ _id: SESSION_ID, classId: CLASS_ID });
    classFindById.mockReturnValue({
      select: () => ({ lean: () => Promise.resolve({ backupTeacherId: null }) }),
    });

    const result = await escalateLevel1(SESSION_ID);

    expect(result.resolved).toBe(false);
    expect(result.reason).toBe("NO_BACKUP_AVAILABLE");
    expect(activateBackup).not.toHaveBeenCalled();
  });

  it("Kích hoạt dự bị lỗi → resolved=false, vẫn trả lỗi cụ thể (không throw ra ngoài, để job hàng loạt không bị chặn giữa chừng)", async () => {
    sessionFindById.mockResolvedValue({ _id: SESSION_ID, classId: CLASS_ID });
    classFindById.mockReturnValue({
      select: () => ({ lean: () => Promise.resolve({ backupTeacherId: "backup-1" }) }),
    });
    activateBackup.mockRejectedValue(new Error("lỗi giả lập"));

    const result = await escalateLevel1(SESSION_ID);

    expect(result.resolved).toBe(false);
    expect(result.reason).toBe("BACKUP_ACTIVATION_FAILED");
  });

  it("Buổi không tồn tại → NotFoundError", async () => {
    sessionFindById.mockResolvedValue(null);
    await expect(escalateLevel1(SESSION_ID)).rejects.toMatchObject({ status: 404 });
  });
});

describe("cancelSessionWithMakeup", () => {
  const makeSession = (over = {}) => ({
    _id: SESSION_ID,
    classId: CLASS_ID,
    teacherId: "teacher-1",
    sessionNumber: 3,
    title: "Buổi 3",
    topicId: "topic-1",
    status: "SCHEDULED",
    save: vi.fn().mockResolvedValue(true),
    ...over,
  });

  it("Huỷ buổi + tạo buổi bù đúng field (makeupForSessionId trỏ về buổi gốc)", async () => {
    const session = makeSession();
    sessionFindById.mockResolvedValue(session);
    sessionCreate.mockResolvedValue({ _id: "makeup-1" });
    sessionCountDocuments.mockResolvedValue(0);

    const result = await cancelSessionWithMakeup(SESSION_ID, {
      adminId: "admin-1",
      makeupScheduledStartAt: new Date("2026-09-01T10:00:00Z"),
      makeupScheduledEndAt: new Date("2026-09-01T11:00:00Z"),
    });

    expect(session.status).toBe("CANCELLED");
    expect(session.cancelledBy).toBe("admin-1");
    expect(sessionCreate).toHaveBeenCalledWith(
      expect.objectContaining({ sessionType: "MAKEUP", makeupForSessionId: SESSION_ID })
    );
    expect(result.makeupSession).toEqual({ _id: "makeup-1" });
  });

  it("Thiếu thời gian buổi bù → BusinessRuleError, không huỷ session", async () => {
    const session = makeSession();
    sessionFindById.mockResolvedValue(session);

    await expect(cancelSessionWithMakeup(SESSION_ID, { adminId: "admin-1" })).rejects.toMatchObject(
      { status: 422 }
    );
    expect(session.save).not.toHaveBeenCalled();
  });

  it("Buổi đã CANCELLED từ trước → BusinessRuleError", async () => {
    sessionFindById.mockResolvedValue(makeSession({ status: "CANCELLED" }));
    await expect(
      cancelSessionWithMakeup(SESSION_ID, {
        adminId: "admin-1",
        makeupScheduledStartAt: new Date(),
        makeupScheduledEndAt: new Date(),
      })
    ).rejects.toMatchObject({ status: 422 });
  });

  it(`BR-14: đủ ${MAX_CANCELLED_SESSIONS_BEFORE_REVIEW} buổi gốc bị huỷ trong cùng cohort → flaggedForReview=true, có trong result.reviewFlag`, async () => {
    const session = makeSession();
    sessionFindById.mockResolvedValue(session);
    sessionCreate.mockResolvedValue({ _id: "makeup-1" });
    sessionCountDocuments.mockResolvedValue(MAX_CANCELLED_SESSIONS_BEFORE_REVIEW);

    const result = await cancelSessionWithMakeup(SESSION_ID, {
      adminId: "admin-1",
      makeupScheduledStartAt: new Date(),
      makeupScheduledEndAt: new Date(),
    });

    // checkCancelledSessionThreshold chạy nội bộ — kiểm gián tiếp qua countDocuments filter
    const filter = sessionCountDocuments.mock.calls[0][0];
    expect(filter.classId).toBe(CLASS_ID);
    expect(filter.sessionType).toEqual({ $ne: "MAKEUP" });
    // Kết quả threshold phải được trả ra ngoài (trước đây bị bỏ quên, không ai đọc được)
    expect(result.reviewFlag).toEqual({
      flaggedForReview: true,
      cancelledCount: MAX_CANCELLED_SESSIONS_BEFORE_REVIEW,
    });
  });
});

describe("checkCancelledSessionThreshold", () => {
  it("Dưới ngưỡng → flaggedForReview=false, KHÔNG ghi gì lên Class", async () => {
    sessionCountDocuments.mockResolvedValue(MAX_CANCELLED_SESSIONS_BEFORE_REVIEW - 1);
    const result = await checkCancelledSessionThreshold(CLASS_ID);
    expect(result.flaggedForReview).toBe(false);
    expect(classUpdateOne).not.toHaveBeenCalled();
  });

  it("Đạt ngưỡng → flaggedForReview=true VÀ ghi cancelledSessionsFlaggedAt lên Class (idempotent qua filter cancelledSessionsFlaggedAt: null)", async () => {
    sessionCountDocuments.mockResolvedValue(MAX_CANCELLED_SESSIONS_BEFORE_REVIEW);
    const result = await checkCancelledSessionThreshold(CLASS_ID);
    expect(result.flaggedForReview).toBe(true);
    expect(classUpdateOne).toHaveBeenCalledWith(
      { _id: CLASS_ID, cancelledSessionsFlaggedAt: null },
      { $set: { cancelledSessionsFlaggedAt: expect.any(Date) } }
    );
  });
});

describe("listCohortsFlaggedForReview", () => {
  it("Chỉ lấy cohort ĐANG SỐNG (chưa COMPLETED/WITHDRAWN/TERMINATED) đã bị đánh dấu", async () => {
    const chain = {
      select: () => chain,
      populate: () => chain,
      sort: () => chain,
      lean: () => Promise.resolve([{ _id: CLASS_ID, name: "Lớp X" }]),
    };
    classFind.mockReturnValue(chain);

    const result = await listCohortsFlaggedForReview();

    expect(result).toEqual([{ _id: CLASS_ID, name: "Lớp X" }]);
    const filter = classFind.mock.calls[0][0];
    expect(filter.cancelledSessionsFlaggedAt).toEqual({ $ne: null });
    expect(filter.commitmentStatus.$in).toEqual(["OFFERED", "ACCEPTED", "CONFIRMED", "ACTIVE"]);
  });
});
