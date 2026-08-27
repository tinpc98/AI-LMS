// Test cho live.socket.js — chốt lỗi thật đã tìm và sửa (nguồn dữ liệu cho mục 7 — điểm danh
// tự động): trước đây $set thẳng evidence.firstJoinAt trên MỌI lần join (ghi đè mất mốc vào lần
// ĐẦU TIÊN khi rớt mạng vào lại) và $inc evidence.onlineDurationSeconds theo từng phiên riêng
// (đếm TRÙNG nếu mở 2 thiết bị cùng lúc, các khoảng chồng lấn cộng dồn thành gấp đôi). Sửa bằng
// lưu thô evidence.sessions[] (join/leave), tính lại union ở nơi khác (attendanceEvidence.js).
import { describe, it, expect, vi, beforeEach } from "vitest";

const checkSocketLiveClassAccess = vi.fn();
const classSessionFindOne = vi.fn();
const classSessionUpdateOne = vi.fn();
const classSessionFindById = vi.fn();
const attendanceFindOne = vi.fn();
const attendanceUpdateOne = vi.fn();

vi.mock("#shared/utils/logger.js", () => ({ logger: { debug: vi.fn(), error: vi.fn() } }));
vi.mock("#modules/live-session/socketLiveAccess.service.js", () => ({
  checkSocketLiveClassAccess: (...a) => checkSocketLiveClassAccess(...a),
}));
vi.mock("#modules/classSession/classSession.model.js", () => ({
  default: {
    findOne: (...a) => classSessionFindOne(...a),
    updateOne: (...a) => classSessionUpdateOne(...a),
    findById: (...a) => classSessionFindById(...a),
  },
}));
vi.mock("#modules/attendance/attendance.model.js", () => ({
  default: {
    findOne: (...a) => attendanceFindOne(...a),
    updateOne: (...a) => attendanceUpdateOne(...a),
  },
}));

const { default: liveSocketHandler } = await import("#modules/live-session/live.socket.js");

const SESSION_ID = "session-1";
const STUDENT_ID = "student-1";
const CLASS_ID = "class-1";

const makeIo = () => ({
  to: vi.fn().mockReturnThis(),
  emit: vi.fn(),
  handlers: {},
  on(event, cb) {
    if (event === "connection") this.connectionHandler = cb;
  },
});

const makeSocket = (user) => {
  const handlers = {};
  return {
    user,
    join: vi.fn().mockResolvedValue(true),
    leave: vi.fn().mockResolvedValue(true),
    on: (event, cb) => {
      handlers[event] = cb;
    },
    handlers,
  };
};

const setupConnectedSocket = () => {
  const io = makeIo();
  liveSocketHandler(io);
  const socket = makeSocket({ id: STUDENT_ID, role: "student", name: "Học sinh A" });
  io.connectionHandler(socket);
  return { io, socket };
};

beforeEach(() => {
  vi.clearAllMocks();
  checkSocketLiveClassAccess.mockResolvedValue({ allowed: true, accessType: "student" });
  classSessionFindOne.mockResolvedValue({
    _id: SESSION_ID,
    rawParticipants: [],
  });
  classSessionUpdateOne.mockResolvedValue({});
  classSessionFindById.mockReturnValue({
    select: () => ({ lean: () => Promise.resolve({ rawParticipants: [], classId: CLASS_ID }) }),
  });
  attendanceFindOne.mockReturnValue({
    select: () => ({ lean: () => Promise.resolve({ evidence: { sessions: [] } }) }),
  });
  attendanceUpdateOne.mockResolvedValue({});
});

describe("JOIN_CLASS_ROOM — ghi evidence.sessions[] thay vì ghi đè firstJoinAt", () => {
  it("Lần join ĐẦU TIÊN → $push khoảng mới, KHÔNG tăng rejoinCount", async () => {
    const { socket } = setupConnectedSocket();
    await socket.handlers.JOIN_CLASS_ROOM({ classId: CLASS_ID }, vi.fn());

    expect(attendanceUpdateOne).toHaveBeenCalledWith(
      { sessionId: SESSION_ID, studentId: STUDENT_ID },
      expect.objectContaining({
        $push: { "evidence.sessions": expect.objectContaining({ leaveAt: null }) },
      })
    );
    const updateArgs = attendanceUpdateOne.mock.calls[0][1];
    expect(updateArgs.$inc).toBeUndefined();
  });

  it("BUG ĐÃ SỬA — lần join THỨ 2 (rớt mạng, vào lại) → vẫn $push khoảng MỚI (không ghi đè), có tăng rejoinCount", async () => {
    attendanceFindOne.mockReturnValue({
      select: () => ({
        lean: () =>
          Promise.resolve({
            evidence: { sessions: [{ joinAt: new Date(), leaveAt: new Date() }] },
          }),
      }),
    });

    const { socket } = setupConnectedSocket();
    await socket.handlers.JOIN_CLASS_ROOM({ classId: CLASS_ID }, vi.fn());

    const updateArgs = attendanceUpdateOne.mock.calls[0][1];
    expect(updateArgs.$push["evidence.sessions"]).toMatchObject({ leaveAt: null });
    expect(updateArgs.$inc).toEqual({ "evidence.rejoinCount": 1 });
  });
});

describe("LEAVE_CLASS_ROOM / disconnect — đóng ĐÚNG khoảng đã mở, không cộng dồn thô", () => {
  it("LEAVE_CLASS_ROOM đóng khoảng khớp CHÍNH XÁC joinAt của socket này (arrayFilters), không dùng $inc", async () => {
    const { socket } = setupConnectedSocket();
    await socket.handlers.JOIN_CLASS_ROOM({ classId: CLASS_ID }, vi.fn());
    const joinTimeAtJoin = socket.joinTime; // socket.joinTime bị xóa sau khi LEAVE_CLASS_ROOM chạy.
    attendanceUpdateOne.mockClear();
    classSessionUpdateOne.mockClear();

    await socket.handlers.LEAVE_CLASS_ROOM({ classId: CLASS_ID }, vi.fn());

    const [filter, update, options] = attendanceUpdateOne.mock.calls[0];
    expect(filter).toEqual({ sessionId: SESSION_ID, studentId: STUDENT_ID });
    expect(update).toEqual({ $set: { "evidence.sessions.$[elem].leaveAt": expect.any(Date) } });
    expect(options.arrayFilters).toEqual([{ "elem.joinAt": joinTimeAtJoin, "elem.leaveAt": null }]);
    // Không còn $inc cộng dồn thô — evidence chỉ ghi khoảng, tính union ở nơi khác.
    expect(update.$inc).toBeUndefined();
  });

  it("disconnect (mất kết nối đột ngột, không emit LEAVE_CLASS_ROOM) cũng đóng đúng khoảng tương tự", async () => {
    const io = makeIo();
    liveSocketHandler(io);
    const socket = makeSocket({ id: STUDENT_ID, role: "student", name: "Học sinh A" });
    io.connectionHandler(socket);

    await socket.handlers.JOIN_CLASS_ROOM({ classId: CLASS_ID }, vi.fn());
    const joinTimeAtJoin = socket.joinTime;
    attendanceUpdateOne.mockClear();

    await socket.handlers.disconnect();

    const [filter, update, options] = attendanceUpdateOne.mock.calls[0];
    expect(filter).toEqual({ sessionId: SESSION_ID, studentId: STUDENT_ID });
    expect(options.arrayFilters[0]["elem.joinAt"]).toBe(joinTimeAtJoin);
  });

  it("Sau khi rời, socket.liveSessionId/joinTime bị xóa (không leak sang lần sau)", async () => {
    const { socket } = setupConnectedSocket();
    await socket.handlers.JOIN_CLASS_ROOM({ classId: CLASS_ID }, vi.fn());
    expect(socket.liveSessionId).toBe(SESSION_ID);

    await socket.handlers.LEAVE_CLASS_ROOM({ classId: CLASS_ID }, vi.fn());
    expect(socket.liveSessionId).toBeUndefined();
    expect(socket.joinTime).toBeUndefined();
  });
});
