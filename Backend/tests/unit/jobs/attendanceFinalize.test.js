// Chốt job tự động chốt sổ điểm danh buổi học trực tuyến (mục 7 — đặc tả nghiệp vụ).
import { describe, it, expect, vi, beforeEach } from "vitest";

const find = vi.fn();
const finalizeSessionAttendance = vi.fn();

const mongooseQuery = (result) => ({ select: () => ({ lean: async () => result }) });

vi.mock("#modules/classSession/classSession.model.js", () => ({
  default: { find: (...a) => find(...a) },
}));
vi.mock("#modules/attendance/attendance.service.js", () => ({
  default: { finalizeSessionAttendance: (...a) => finalizeSessionAttendance(...a) },
}));

const { runAttendanceFinalize, findSessionsToFinalize } =
  await import("#jobs/attendanceFinalize.job.js");

const MOC = new Date("2026-08-01T10:00:00Z");
const GRACE_MS = 15 * 60 * 1000;

beforeEach(() => {
  find.mockReset().mockReturnValue(mongooseQuery([]));
  finalizeSessionAttendance.mockReset().mockResolvedValue({ updated: 1 });
});

describe("findSessionsToFinalize — điều kiện lọc", () => {
  it("chỉ lấy buổi COMPLETED, chưa chốt sổ (attendanceFinalizedAt=null), có phòng online thật", async () => {
    await findSessionsToFinalize(MOC);

    expect(find.mock.calls[0][0]).toMatchObject({
      status: "COMPLETED",
      attendanceFinalizedAt: null,
      "onlineMeeting.roomId": { $ne: null },
    });
  });

  it("cutoff = now - 15 phút ân hạn (BR-7.3)", async () => {
    await findSessionsToFinalize(MOC);

    const filter = find.mock.calls[0][0];
    const expectedCutoff = new Date(MOC.getTime() - GRACE_MS);
    expect(filter.actualEndAt.$lte.getTime()).toBe(expectedCutoff.getTime());
  });
});

describe("runAttendanceFinalize", () => {
  it("không có buổi nào đủ điều kiện → không gọi chốt sổ", async () => {
    await expect(runAttendanceFinalize(MOC)).resolves.toEqual({ finalized: 0, failed: 0 });
    expect(finalizeSessionAttendance).not.toHaveBeenCalled();
  });

  it("chốt sổ đúng từng buổi đủ điều kiện", async () => {
    find.mockReturnValue(mongooseQuery([{ _id: "s1" }, { _id: "s2" }]));

    await runAttendanceFinalize(MOC);

    expect(finalizeSessionAttendance).toHaveBeenCalledWith("s1");
    expect(finalizeSessionAttendance).toHaveBeenCalledWith("s2");
  });

  it("1 buổi lỗi không chặn các buổi còn lại", async () => {
    find.mockReturnValue(mongooseQuery([{ _id: "s1" }, { _id: "s2" }, { _id: "s3" }]));
    finalizeSessionAttendance.mockImplementation(async (id) => {
      if (id === "s2") throw new Error("lỗi tính toán");
      return { updated: 1 };
    });

    const result = await runAttendanceFinalize(MOC);

    expect(result).toEqual({ finalized: 2, failed: 1 });
    expect(finalizeSessionAttendance).toHaveBeenCalledTimes(3);
  });
});
