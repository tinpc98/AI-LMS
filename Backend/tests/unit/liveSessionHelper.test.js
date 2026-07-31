// Port từ src/utils/liveSessionHelper.test.js — script test thủ công nằm lẫn trong src/
// nên chưa từng được vitest chạy (xem ghi chú tương tự ở answerScoring.test.js).
//
// Giữ nguyên toàn bộ assertion gốc, bổ sung nhánh biên còn thiếu.
import { describe, it, expect } from "vitest";
import mongoose from "mongoose";
import { generateLiveSessionRoomName } from "../../src/modules/live-session/liveSessionHelper.js";

const CLASS_ID = "6794d21e87d15a9907f10001";
const SESSION_ID = "6794e80f98e26b1108a20045";

describe("generateLiveSessionRoomName — các assertion từ script gốc", () => {
  it("sinh roomName đúng định dạng lms_<classId>_<sessionId> từ ObjectId", () => {
    const roomName = generateLiveSessionRoomName(
      new mongoose.Types.ObjectId(CLASS_ID),
      new mongoose.Types.ObjectId(SESSION_ID)
    );
    expect(roomName).toBe(`lms_${CLASS_ID}_${SESSION_ID}`);
  });

  it("nhận cả chuỗi ObjectId, không chỉ instance ObjectId", () => {
    expect(generateLiveSessionRoomName(CLASS_ID, SESSION_ID)).toBe(`lms_${CLASS_ID}_${SESSION_ID}`);
  });

  it("cùng input luôn cho cùng roomName (tính ổn định)", () => {
    const a = generateLiveSessionRoomName(CLASS_ID, SESSION_ID);
    const b = generateLiveSessionRoomName(CLASS_ID, SESSION_ID);
    expect(a).toBe(b);
  });

  it("roomName chỉ chứa chữ, số và gạch dưới — an toàn cho 8x8 JaaS", () => {
    const roomName = generateLiveSessionRoomName(CLASS_ID, SESSION_ID);
    expect(roomName).toMatch(/^[a-zA-Z0-9_]+$/);
  });

  it("ném lỗi khi classId không phải ObjectId hợp lệ", () => {
    expect(() => generateLiveSessionRoomName("invalid_id", SESSION_ID)).toThrow(
      /không phải ObjectId hợp lệ/
    );
  });
});

describe("generateLiveSessionRoomName — nhánh biên bổ sung", () => {
  it("ném lỗi khi thiếu tham số bắt buộc", () => {
    expect(() => generateLiveSessionRoomName(null, SESSION_ID)).toThrow(/bắt buộc/);
    expect(() => generateLiveSessionRoomName(CLASS_ID, null)).toThrow(/bắt buộc/);
    expect(() => generateLiveSessionRoomName()).toThrow(/bắt buộc/);
  });

  it("ném lỗi khi sessionId không hợp lệ (bản gốc chỉ kiểm classId)", () => {
    expect(() => generateLiveSessionRoomName(CLASS_ID, "khong-hop-le")).toThrow(
      /không phải ObjectId hợp lệ/
    );
  });

  it("cắt khoảng trắng thừa quanh id trước khi ghép", () => {
    expect(generateLiveSessionRoomName(`  ${CLASS_ID}  `, SESSION_ID)).toBe(
      `lms_${CLASS_ID}_${SESSION_ID}`
    );
  });

  it("hai phiên khác nhau trong cùng lớp cho ra roomName khác nhau", () => {
    const other = "6794e80f98e26b1108a20046";
    expect(generateLiveSessionRoomName(CLASS_ID, SESSION_ID)).not.toBe(
      generateLiveSessionRoomName(CLASS_ID, other)
    );
  });
});
