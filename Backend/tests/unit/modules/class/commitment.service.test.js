// Test cho commitment.service.js — EduSpace mechanism design Phần A (BR-04..BR-08, A.5).
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

const classFindById = vi.fn();
const eventFind = vi.fn();
const eventCreate = vi.fn();
const eventFindById = vi.fn();
const userFindById = vi.fn();

vi.mock("#modules/class/class.model.js", () => ({
  default: { findById: (...a) => classFindById(...a) },
}));
vi.mock("#modules/class/commitmentEvent.model.js", () => ({
  default: {
    find: (...a) => eventFind(...a),
    create: (...a) => eventCreate(...a),
    findById: (...a) => eventFindById(...a),
  },
  COMMITMENT_REASONS: [
    "SCHEDULE_FILLED",
    "SESSION_COMPLETED",
    "COHORT_COMPLETED",
    "WITHDREW_BEFORE_LOCK",
    "CANCELLED_WITH_NOTICE",
    "CANCELLED_LATE",
    "NO_SHOW",
    "FORCE_MAJEURE_EXCUSED",
    "ESCALATION_TERMINATED",
    "COHORT_CLOSED_EARLY_HIGH_PROGRESS",
    "COHORT_CLOSED_EARLY_LOW_PROGRESS",
    "BACKUP_ACTIVATED",
  ],
}));
vi.mock("#modules/auth", () => ({
  User: { findById: (...a) => userFindById(...a) },
}));

const assertCohortReady = vi.fn().mockResolvedValue({ ready: true });
vi.mock("#modules/class/cohortReadiness.service.js", () => ({
  assertCohortReadyForConfirmation: (...a) => assertCohortReady(...a),
}));

const { transitionCommitment, excuseCommitmentEvent } =
  await import("#modules/class/commitment.service.js");

const CLASS_ID = new mongoose.Types.ObjectId().toString();
const TEACHER_ID = new mongoose.Types.ObjectId().toString();

const mockClassDoc = (commitmentStatus, overrides = {}) => ({
  _id: CLASS_ID,
  teacherId: TEACHER_ID,
  commitmentStatus,
  save: vi.fn().mockResolvedValue(true),
  ...overrides,
});

const mockTeacher = (overrides = {}) => ({
  _id: TEACHER_ID,
  reliabilityScore: 100,
  poolStatus: "ACTIVE",
  poolLockedUntil: null,
  save: vi.fn().mockResolvedValue(true),
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  eventFind.mockReturnValue({ lean: () => Promise.resolve([]) });
  eventCreate.mockResolvedValue({});
  assertCohortReady.mockReset().mockResolvedValue({ ready: true });
});

describe("transitionCommitment — BR-16 chặn CONFIRMED khi thiếu học liệu", () => {
  it("Gọi assertCohortReadyForConfirmation khi chuyển sang CONFIRMED, và CHỈ khi đó", async () => {
    const classDoc = mockClassDoc("ACCEPTED");
    classFindById.mockResolvedValue(classDoc);

    await transitionCommitment(CLASS_ID, "CONFIRMED", { reason: "SCHEDULE_FILLED" });

    expect(assertCohortReady).toHaveBeenCalledWith(CLASS_ID);
    expect(classDoc.commitmentStatus).toBe("CONFIRMED");
  });

  it("Không gọi assertCohortReadyForConfirmation cho các transition khác CONFIRMED", async () => {
    const classDoc = mockClassDoc("OFFERED");
    classFindById.mockResolvedValue(classDoc);

    await transitionCommitment(CLASS_ID, "ACCEPTED", { reason: "SCHEDULE_FILLED" });

    expect(assertCohortReady).not.toHaveBeenCalled();
  });

  it("Chặn CONFIRMED nếu học liệu chưa sẵn sàng — lỗi từ BR-16 truyền nguyên vẹn ra ngoài, không commit trạng thái", async () => {
    const classDoc = mockClassDoc("ACCEPTED");
    classFindById.mockResolvedValue(classDoc);
    assertCohortReady.mockRejectedValue(
      Object.assign(new Error("Chưa đủ 2 buổi có đầy đủ học liệu"), { status: 422 })
    );

    await expect(
      transitionCommitment(CLASS_ID, "CONFIRMED", { reason: "SCHEDULE_FILLED" })
    ).rejects.toMatchObject({ status: 422 });

    expect(classDoc.commitmentStatus).toBe("ACCEPTED"); // KHÔNG bị đổi
    expect(classDoc.save).not.toHaveBeenCalled();
    expect(eventCreate).not.toHaveBeenCalled();
  });
});

describe("transitionCommitment — validate chuyển trạng thái", () => {
  it("OFFERED → ACCEPTED hợp lệ khi giáo viên poolStatus=ACTIVE, không strike, không đổi reliability", async () => {
    const classDoc = mockClassDoc("OFFERED");
    classFindById.mockResolvedValue(classDoc);
    userFindById.mockResolvedValue(mockTeacher()); // poolStatus mặc định "ACTIVE"

    await transitionCommitment(CLASS_ID, "ACCEPTED", { reason: "SCHEDULE_FILLED" });

    expect(classDoc.commitmentStatus).toBe("ACCEPTED");
    expect(classDoc.save).toHaveBeenCalled();
  });

  it("A.5: chặn OFFERED → ACCEPTED nếu giáo viên đang LOCKED/REMOVED khỏi pool", async () => {
    classFindById.mockResolvedValue(mockClassDoc("OFFERED"));
    userFindById.mockResolvedValue(
      mockTeacher({ poolStatus: "LOCKED", poolLockedUntil: new Date(Date.now() + 999999) })
    );

    await expect(
      transitionCommitment(CLASS_ID, "ACCEPTED", { reason: "SCHEDULE_FILLED" })
    ).rejects.toMatchObject({ status: 422 });
  });

  it("Tự động mở khóa nếu poolLockedUntil đã qua, rồi cho phép ACCEPTED bình thường", async () => {
    const classDoc = mockClassDoc("OFFERED");
    classFindById.mockResolvedValue(classDoc);
    const teacher = mockTeacher({
      poolStatus: "LOCKED",
      poolLockedUntil: new Date(Date.now() - 1000),
    });
    userFindById.mockResolvedValue(teacher);

    await transitionCommitment(CLASS_ID, "ACCEPTED", { reason: "SCHEDULE_FILLED" });

    expect(teacher.poolStatus).toBe("ACTIVE");
    expect(teacher.poolLockedUntil).toBeNull();
    expect(classDoc.commitmentStatus).toBe("ACCEPTED");
  });

  it("Chuyển KHÔNG hợp lệ (OFFERED → ACTIVE) → BusinessRuleError, không ghi gì", async () => {
    classFindById.mockResolvedValue(mockClassDoc("OFFERED"));

    await expect(
      transitionCommitment(CLASS_ID, "ACTIVE", { reason: "SCHEDULE_FILLED" })
    ).rejects.toMatchObject({ status: 422 });
    expect(eventCreate).not.toHaveBeenCalled();
  });

  it("reason không thuộc danh mục cố định → ValidationError", async () => {
    await expect(
      transitionCommitment(CLASS_ID, "ACCEPTED", { reason: "TỰ_BỊA_LÝ_DO" })
    ).rejects.toMatchObject({ status: 400 });
    expect(classFindById).not.toHaveBeenCalled();
  });

  it("Lớp không tồn tại → NotFoundError", async () => {
    classFindById.mockResolvedValue(null);
    await expect(
      transitionCommitment(CLASS_ID, "ACCEPTED", { reason: "SCHEDULE_FILLED" })
    ).rejects.toMatchObject({ status: 404 });
  });

  it("Lớp chưa có teacherId → BusinessRuleError", async () => {
    classFindById.mockResolvedValue(mockClassDoc("OFFERED", { teacherId: null }));
    await expect(
      transitionCommitment(CLASS_ID, "ACCEPTED", { reason: "SCHEDULE_FILLED" })
    ).rejects.toMatchObject({ status: 422 });
  });
});

describe("transitionCommitment — BR-05 miễn strike trước khi chốt lịch", () => {
  it("ACCEPTED → WITHDRAWN_EARLY luôn ghi reason=WITHDREW_BEFORE_LOCK, bất kể reason truyền vào", async () => {
    const classDoc = mockClassDoc("ACCEPTED");
    classFindById.mockResolvedValue(classDoc);

    // Cố ý truyền reason khác để chứng minh service TỰ ép về WITHDREW_BEFORE_LOCK, không tin
    // reason do caller gửi lên cho trường hợp này.
    await transitionCommitment(CLASS_ID, "WITHDRAWN_EARLY", { reason: "NO_SHOW" });

    expect(eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "WITHDREW_BEFORE_LOCK", strikeApplied: 0 })
    );
    expect(userFindById).not.toHaveBeenCalled();
  });
});

describe("transitionCommitment — BR-06/07 strike theo lý do hủy", () => {
  it("CANCELLED_LATE: -5 độ tin cậy, strikeApplied=1", async () => {
    const classDoc = mockClassDoc("ACTIVE");
    classFindById.mockResolvedValue(classDoc);
    const teacher = mockTeacher();
    userFindById.mockResolvedValue(teacher);

    await transitionCommitment(CLASS_ID, "WITHDRAWN_MIDWAY", { reason: "CANCELLED_LATE" });

    expect(teacher.reliabilityScore).toBe(95);
    expect(eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({ reason: "CANCELLED_LATE", strikeApplied: 1 })
    );
  });

  it("NO_SHOW: -15 độ tin cậy, strikeApplied=1", async () => {
    const classDoc = mockClassDoc("ACTIVE");
    classFindById.mockResolvedValue(classDoc);
    const teacher = mockTeacher();
    userFindById.mockResolvedValue(teacher);

    await transitionCommitment(CLASS_ID, "WITHDRAWN_MIDWAY", { reason: "NO_SHOW" });

    expect(teacher.reliabilityScore).toBe(85);
  });

  it("reliabilityScore không xuống dưới 0 dù trừ nhiều lần", async () => {
    const classDoc = mockClassDoc("ACTIVE");
    classFindById.mockResolvedValue(classDoc);
    const teacher = mockTeacher({ reliabilityScore: 3 });
    userFindById.mockResolvedValue(teacher);

    await transitionCommitment(CLASS_ID, "WITHDRAWN_MIDWAY", { reason: "NO_SHOW" });

    expect(teacher.reliabilityScore).toBe(0);
  });
});

describe("transitionCommitment — A.5 ngưỡng khóa/loại khỏi pool", () => {
  it("Strike thứ 2 trong 6 tháng → khóa pool 14 ngày", async () => {
    const classDoc = mockClassDoc("ACTIVE");
    classFindById.mockResolvedValue(classDoc);
    const teacher = mockTeacher();
    userFindById.mockResolvedValue(teacher);
    // Giả lập ĐÃ có 1 strike trước đó + strike NO_SHOW vừa create() ở lần gọi này = 2 tổng
    // (trong Mongo thật, find() chạy SAU create() sẽ tự thấy bản ghi mới — mock ở đây phải tự
    // liệt kê đủ để phản ánh đúng điều đó, vì mock không có state thật).
    eventFind.mockReturnValue({
      lean: () =>
        Promise.resolve([
          { reason: "CANCELLED_LATE", createdAt: new Date() },
          { reason: "NO_SHOW", createdAt: new Date() },
        ]),
    });

    await transitionCommitment(CLASS_ID, "WITHDRAWN_MIDWAY", { reason: "NO_SHOW" });

    expect(teacher.poolStatus).toBe("LOCKED");
    expect(teacher.poolLockedUntil).toBeInstanceOf(Date);
    expect(teacher.poolLockedUntil.getTime()).toBeGreaterThan(Date.now());
  });

  it("Strike thứ 3 trong 6 tháng → loại khỏi pool (REMOVED)", async () => {
    const classDoc = mockClassDoc("ACTIVE");
    classFindById.mockResolvedValue(classDoc);
    const teacher = mockTeacher({ poolStatus: "LOCKED" });
    userFindById.mockResolvedValue(teacher);
    // 2 strike cũ + strike vừa create() ở lần gọi này = 3 tổng.
    eventFind.mockReturnValue({
      lean: () =>
        Promise.resolve([
          { reason: "CANCELLED_LATE", createdAt: new Date() },
          { reason: "NO_SHOW", createdAt: new Date() },
          { reason: "NO_SHOW", createdAt: new Date() },
        ]),
    });

    await transitionCommitment(CLASS_ID, "WITHDRAWN_MIDWAY", { reason: "NO_SHOW" });

    expect(teacher.poolStatus).toBe("REMOVED");
  });

  it("ESCALATION_TERMINATED loại khỏi pool NGAY, không cần đủ 3 strike", async () => {
    const classDoc = mockClassDoc("ACTIVE");
    classFindById.mockResolvedValue(classDoc);
    const teacher = mockTeacher(); // chưa từng có strike nào
    userFindById.mockResolvedValue(teacher);

    await transitionCommitment(CLASS_ID, "TERMINATED", { reason: "ESCALATION_TERMINATED" });

    expect(teacher.poolStatus).toBe("REMOVED");
  });

  it("Strike đã decay quá 6 tháng KHÔNG tính vào ngưỡng", async () => {
    const classDoc = mockClassDoc("ACTIVE");
    classFindById.mockResolvedValue(classDoc);
    const teacher = mockTeacher();
    userFindById.mockResolvedValue(teacher);
    // countActiveStrikes tự lọc theo createdAt >= now-6thang trong query Mongo thật; ở đây mock
    // trả về đã lọc sẵn rỗng để mô phỏng "2 strike cũ đã ngoài cửa sổ 6 tháng".
    eventFind.mockReturnValue({ lean: () => Promise.resolve([]) });

    await transitionCommitment(CLASS_ID, "WITHDRAWN_MIDWAY", { reason: "CANCELLED_LATE" });

    // Đây là strike đầu tiên còn hiệu lực -> chưa đạt ngưỡng 2, không khóa.
    expect(teacher.poolStatus).toBe("ACTIVE");
  });
});

describe("excuseCommitmentEvent — BR-08 miễn strike bất khả kháng", () => {
  it("Hoàn lại điểm độ tin cậy và mở khóa pool nếu strike giảm dưới ngưỡng", async () => {
    const event = {
      _id: "evt1",
      teacherId: TEACHER_ID,
      reason: "NO_SHOW",
      strikeApplied: 1,
      note: "",
      save: vi.fn().mockResolvedValue(true),
    };
    eventFindById.mockResolvedValue(event);
    const teacher = mockTeacher({ reliabilityScore: 85, poolStatus: "LOCKED" });
    userFindById.mockResolvedValue(teacher);
    eventFind.mockReturnValue({ lean: () => Promise.resolve([]) }); // sau khi miễn, còn 0 strike

    await excuseCommitmentEvent("evt1", "admin-1");

    expect(teacher.reliabilityScore).toBe(100); // hoàn lại +15
    expect(teacher.poolStatus).toBe("ACTIVE");
    expect(event.reason).toBe("FORCE_MAJEURE_EXCUSED");
    expect(event.strikeApplied).toBe(0);
  });

  it("Miễn trừ sự kiện KHÔNG phải strike → BusinessRuleError", async () => {
    eventFindById.mockResolvedValue({
      _id: "evt2",
      teacherId: TEACHER_ID,
      reason: "SESSION_COMPLETED",
      strikeApplied: 0,
    });

    await expect(excuseCommitmentEvent("evt2", "admin-1")).rejects.toMatchObject({ status: 422 });
  });

  it("Sự kiện không tồn tại → NotFoundError", async () => {
    eventFindById.mockResolvedValue(null);
    await expect(excuseCommitmentEvent("evt-khong-ton-tai", "admin-1")).rejects.toMatchObject({
      status: 404,
    });
  });
});
