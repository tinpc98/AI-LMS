// Test cho backupTeacher.service.js — EduSpace mechanism design Phần A.6 (BR-09..BR-12).
import { describe, it, expect, vi, beforeEach } from "vitest";
import mongoose from "mongoose";

const classFindById = vi.fn();
const classCountDocuments = vi.fn();
const eventCreate = vi.fn();
const userFindById = vi.fn();

// assignBackupTeacher giờ chạy trong mongoose transaction (session.startTransaction/commit/abort)
// để sửa race BR-12 (đếm-rồi-ghi không nguyên tử) — giả lập session tối thiểu, giữ nguyên phần
// còn lại của mongoose thật (mongoose.Types.ObjectId vẫn cần dùng để sinh ID test).
// vi.mock bị hoist lên đầu file, PHẢI dùng vi.hoisted() để biến fakeSession khởi tạo trước đó.
const { fakeSession } = vi.hoisted(() => ({
  fakeSession: {
    startTransaction: vi.fn(),
    commitTransaction: vi.fn().mockResolvedValue(undefined),
    abortTransaction: vi.fn().mockResolvedValue(undefined),
    endSession: vi.fn(),
  },
}));
vi.mock("mongoose", async () => {
  const actual = await vi.importActual("mongoose");
  return {
    ...actual,
    default: {
      ...actual.default,
      startSession: vi.fn().mockResolvedValue(fakeSession),
    },
  };
});

vi.mock("#modules/class/class.model.js", () => ({
  default: {
    findById: (...a) => classFindById(...a),
    countDocuments: (...a) => classCountDocuments(...a),
  },
}));
vi.mock("#modules/class/commitmentEvent.model.js", () => ({
  default: { create: (...a) => eventCreate(...a) },
}));
vi.mock("#modules/auth", () => ({
  User: { findById: (...a) => userFindById(...a) },
}));

const { assignBackupTeacher, activateBackupTeacher, MAX_CONCURRENT_BACKUP_COHORTS } =
  await import("#modules/class/backupTeacher.service.js");

const CLASS_ID = new mongoose.Types.ObjectId().toString();
const TEACHER_ID = new mongoose.Types.ObjectId().toString();
const BACKUP_ID = new mongoose.Types.ObjectId().toString();

const mockClassDoc = (over = {}) => ({
  _id: CLASS_ID,
  teacherId: TEACHER_ID,
  backupTeacherId: null,
  commitmentStatus: "CONFIRMED",
  save: vi.fn().mockResolvedValue(true),
  ...over,
});

const mongooseCountSession = (result) => ({ session: () => Promise.resolve(result) });

beforeEach(() => {
  vi.clearAllMocks();
  classCountDocuments.mockReturnValue(mongooseCountSession(0));
  eventCreate.mockResolvedValue({});
});

describe("assignBackupTeacher", () => {
  it("Gán dự bị thành công khi chưa đạt trần BR-12 — chạy trong transaction, commit khi thành công", async () => {
    const classDoc = mockClassDoc();
    classFindById.mockResolvedValue(classDoc);
    classCountDocuments.mockReturnValue(mongooseCountSession(1)); // đang là dự bị 1 lớp khác, còn dưới trần 3

    await assignBackupTeacher(CLASS_ID, BACKUP_ID);

    expect(classDoc.backupTeacherId).toBe(BACKUP_ID);
    expect(classDoc.save).toHaveBeenCalledWith({ session: fakeSession });
    expect(fakeSession.commitTransaction).toHaveBeenCalled();
    expect(fakeSession.abortTransaction).not.toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });

  it(`BR-12: chặn gán nếu đã làm dự bị đủ ${MAX_CONCURRENT_BACKUP_COHORTS} cohort đang sống — abort transaction, không ghi`, async () => {
    const classDoc = mockClassDoc();
    classFindById.mockResolvedValue(classDoc);
    classCountDocuments.mockReturnValue(mongooseCountSession(MAX_CONCURRENT_BACKUP_COHORTS));

    await expect(assignBackupTeacher(CLASS_ID, BACKUP_ID)).rejects.toMatchObject({ status: 422 });

    expect(classDoc.save).not.toHaveBeenCalled();
    expect(fakeSession.abortTransaction).toHaveBeenCalled();
    expect(fakeSession.commitTransaction).not.toHaveBeenCalled();
    expect(fakeSession.endSession).toHaveBeenCalled();
  });

  it("Không cho gán dự bị trùng giáo viên chính", async () => {
    classFindById.mockResolvedValue(mockClassDoc());

    await expect(assignBackupTeacher(CLASS_ID, TEACHER_ID)).rejects.toMatchObject({
      status: 400,
    });
  });

  it("Lớp chưa có giáo viên chính → BusinessRuleError", async () => {
    classFindById.mockResolvedValue(mockClassDoc({ teacherId: null }));

    await expect(assignBackupTeacher(CLASS_ID, BACKUP_ID)).rejects.toMatchObject({
      status: 422,
    });
  });

  it("Lớp không tồn tại → NotFoundError", async () => {
    classFindById.mockResolvedValue(null);
    await expect(assignBackupTeacher(CLASS_ID, BACKUP_ID)).rejects.toMatchObject({
      status: 404,
    });
  });
});

describe("activateBackupTeacher — BR-10/BR-11", () => {
  it("Dự bị trở thành giáo viên chính, backupTeacherId được xóa", async () => {
    const classDoc = mockClassDoc({ backupTeacherId: BACKUP_ID });
    classFindById.mockResolvedValue(classDoc);
    userFindById.mockResolvedValue({
      _id: BACKUP_ID,
      reliabilityScore: 90,
      save: vi.fn().mockResolvedValue(true),
    });

    const result = await activateBackupTeacher(CLASS_ID, { reason: "CANCELLED_WITH_NOTICE" });

    expect(classDoc.teacherId).toBe(BACKUP_ID);
    expect(classDoc.backupTeacherId).toBeNull();
    expect(result.previousTeacherId).toBe(TEACHER_ID);
    expect(result.activatedTeacherId).toBe(BACKUP_ID);
  });

  it("BR-11: dự bị được cộng +7.5 độ tin cậy (1.5x điểm 1 buổi thường)", async () => {
    const classDoc = mockClassDoc({ backupTeacherId: BACKUP_ID });
    classFindById.mockResolvedValue(classDoc);
    const backupUser = {
      _id: BACKUP_ID,
      reliabilityScore: 90,
      save: vi.fn().mockResolvedValue(true),
    };
    userFindById.mockResolvedValue(backupUser);

    await activateBackupTeacher(CLASS_ID, { reason: "CANCELLED_WITH_NOTICE" });

    expect(backupUser.reliabilityScore).toBe(97.5);
  });

  it("Không cộng điểm quá trần 100", async () => {
    const classDoc = mockClassDoc({ backupTeacherId: BACKUP_ID });
    classFindById.mockResolvedValue(classDoc);
    const backupUser = {
      _id: BACKUP_ID,
      reliabilityScore: 98,
      save: vi.fn().mockResolvedValue(true),
    };
    userFindById.mockResolvedValue(backupUser);

    await activateBackupTeacher(CLASS_ID, { reason: "CANCELLED_WITH_NOTICE" });

    expect(backupUser.reliabilityScore).toBe(100);
  });

  it("Ghi CommitmentEvent với reason=BACKUP_ACTIVATED, strikeApplied=0, gán cho người VỪA kích hoạt (không phải giáo viên cũ)", async () => {
    const classDoc = mockClassDoc({ backupTeacherId: BACKUP_ID });
    classFindById.mockResolvedValue(classDoc);
    userFindById.mockResolvedValue({ _id: BACKUP_ID, reliabilityScore: 90, save: vi.fn() });

    await activateBackupTeacher(CLASS_ID, { reason: "NO_SHOW", changedBy: "admin-1" });

    expect(eventCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        teacherId: BACKUP_ID,
        reason: "BACKUP_ACTIVATED",
        strikeApplied: 0,
        changedBy: "admin-1",
      })
    );
  });

  it("Lớp chưa có dự bị → BusinessRuleError", async () => {
    classFindById.mockResolvedValue(mockClassDoc({ backupTeacherId: null }));
    await expect(activateBackupTeacher(CLASS_ID, { reason: "NO_SHOW" })).rejects.toMatchObject({
      status: 422,
    });
  });

  it("Lớp không tồn tại → NotFoundError", async () => {
    classFindById.mockResolvedValue(null);
    await expect(activateBackupTeacher(CLASS_ID, { reason: "NO_SHOW" })).rejects.toMatchObject({
      status: 404,
    });
  });
});
