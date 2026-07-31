// Chốt hạn nộp bài phía máy chủ — nguồn sự thật duy nhất về thời gian làm bài.
//
// Trước đây hạn nộp chỉ tồn tại trong localStorage của trình duyệt học sinh, và bài nộp muộn
// đi qua hệ thống không để lại dấu vết. Các quy tắc dưới đây quyết định trực tiếp việc một học
// sinh có bị ghi nhận nộp muộn hay không, nên chúng cần được ghim chặt.
import { describe, it, expect } from "vitest";
import {
  GRACE_PERIOD_MS,
  evaluateLateness,
  resolveAttemptDeadline,
} from "#modules/exam-attempt/attemptDeadline.js";

const MOC = new Date("2026-08-01T10:00:00Z");
const PHUT = 60 * 1000;
const luc = (phutSauMoc) => new Date(MOC.getTime() + phutSauMoc * PHUT);

describe("resolveAttemptDeadline", () => {
  it("tính từ lúc HỌC SINH bắt đầu, không phải giờ mở đề", () => {
    // Mỗi học sinh bấm bắt đầu ở thời điểm khác nhau; thời lượng làm bài là của từng người.
    // Lấy theo exam.startTime sẽ cắt oan thời gian của người vào muộn.
    expect(resolveAttemptDeadline(MOC, 45)).toEqual(luc(45));
  });

  it("thiếu dữ liệu thì trả null, không đoán bừa", () => {
    expect(resolveAttemptDeadline(null, 45)).toBeNull();
    expect(resolveAttemptDeadline(MOC, null)).toBeNull();
    expect(resolveAttemptDeadline(MOC, 0)).toBeNull();
  });

  it("nhận cả chuỗi ISO lẫn Date", () => {
    expect(resolveAttemptDeadline(MOC.toISOString(), 30)).toEqual(luc(30));
  });
});

describe("evaluateLateness", () => {
  it("nộp trong giờ thì không muộn", () => {
    expect(evaluateLateness(MOC, 60, luc(45))).toMatchObject({ isLate: false, lateBySeconds: 0 });
  });

  it("nộp đúng hạn thì không muộn", () => {
    expect(evaluateLateness(MOC, 60, luc(60)).isLate).toBe(false);
  });

  it("TRONG ÂN HẠN 2 PHÚT thì không tính là muộn", () => {
    // Ân hạn bù cho độ trễ mạng và lệch đồng hồ máy khách. Không có nó, một học sinh bấm nộp
    // đúng giây cuối trên mạng chậm sẽ bị ghi nhận nộp muộn.
    expect(GRACE_PERIOD_MS).toBe(2 * PHUT);
    expect(evaluateLateness(MOC, 60, luc(61)).isLate).toBe(false);
    expect(evaluateLateness(MOC, 60, luc(62)).isLate).toBe(false);
  });

  it("vượt ân hạn thì tính là muộn, kèm số giây vượt", () => {
    const kq = evaluateLateness(MOC, 60, luc(65));

    expect(kq.isLate).toBe(true);
    // 65 phút - 60 phút hạn - 2 phút ân hạn = 3 phút vượt
    expect(kq.lateBySeconds).toBe(3 * 60);
  });

  it("số giây vượt ĐÃ TRỪ ân hạn, không phải tổng thời gian quá giờ", () => {
    // Nếu báo cả phần ân hạn, giáo viên sẽ thấy "muộn 5 phút" cho một học sinh chỉ thực sự
    // vượt 3 phút — con số dùng để đánh giá học sinh thì không được thổi phồng.
    const kq = evaluateLateness(MOC, 30, luc(35));
    expect(kq.lateBySeconds).toBe(3 * 60);
  });

  it("trả kèm hạn nộp để nơi gọi ghi lại endTime", () => {
    expect(evaluateLateness(MOC, 60, luc(90)).deadline).toEqual(luc(60));
  });

  it("thiếu dữ liệu thì coi như không muộn, không chặn oan học sinh", () => {
    // Dữ liệu hỏng không được biến thành cáo buộc gian lận. Mặc định an toàn là "không muộn".
    expect(evaluateLateness(null, 60, luc(999))).toMatchObject({ isLate: false, deadline: null });
    expect(evaluateLateness(MOC, null, luc(999))).toMatchObject({ isLate: false });
  });

  it("mặc định so với thời điểm hiện tại nếu không truyền", () => {
    // Bắt đầu cách đây rất lâu -> chắc chắn muộn, dù không truyền mốc nộp.
    const rat_lau_truoc = new Date(Date.now() - 10 * 60 * 60 * 1000);
    expect(evaluateLateness(rat_lau_truoc, 30).isLate).toBe(true);
  });
});
