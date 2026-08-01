// Chốt quy tắc vòng đời kỳ thi (§6.7).
//
// Hai phần tách bạch:
//   - isExamExpired / resolveDisplayStatus: hàm thuần, kiểm trực tiếp.
//   - closeExpiredExams: kiểm ĐIỀU KIỆN gửi xuống MongoDB. Không thể tự tính bằng JS ở tầng
//     ứng dụng được — phép so sánh startTime + duration phút < now phải do MongoDB làm, nếu
//     không thì phải tải cả collection về bộ nhớ. Nên thứ đáng kiểm là bộ lọc $expr có đúng
//     hình dạng không: sai một dấu $lt/$gt là đóng nhầm toàn bộ kỳ thi chưa diễn ra.
import { describe, it, expect, vi, beforeEach } from "vitest";

const updateMany = vi.fn();
const find = vi.fn();

vi.mock("#modules/exam/exam.model.js", () => ({
  default: {
    updateMany: (...args) => updateMany(...args),
    find: (...args) => find(...args),
  },
}));

const { isExamExpired, resolveDisplayStatus, closeExpiredExams, findClosedExamIds } =
  await import("#modules/exam/examLifecycle.service.js");

const MINUTE = 60 * 1000;
const MOC = new Date("2026-08-01T10:00:00Z").getTime();

/** Kỳ thi bắt đầu `phutTruoc` phút trước, kéo dài `duration` phút. */
const ky = (phutTruoc, duration, status = "PUBLISHED") => ({
  startTime: new Date(MOC - phutTruoc * MINUTE),
  duration,
  status,
});

beforeEach(() => {
  updateMany.mockReset().mockResolvedValue({ modifiedCount: 0 });
  find.mockReset();
});

describe("isExamExpired", () => {
  it("chưa hết giờ thì false", () => {
    expect(isExamExpired(ky(10, 60), MOC)).toBe(false);
  });

  it("đã quá giờ thì true", () => {
    expect(isExamExpired(ky(90, 60), MOC)).toBe(true);
  });

  it("đúng khoảnh khắc kết thúc thì CHƯA hết giờ", () => {
    // Biên quan trọng: học sinh bấm nộp đúng giây cuối không được bị coi là quá hạn.
    expect(isExamExpired(ky(60, 60), MOC)).toBe(false);
  });

  it("kỳ thi chưa bắt đầu (startTime tương lai) thì không thể hết giờ", () => {
    expect(isExamExpired({ startTime: new Date(MOC + 60 * MINUTE), duration: 30 }, MOC)).toBe(
      false
    );
  });

  it("thiếu startTime hoặc duration thì false, không ném lỗi", () => {
    expect(isExamExpired({ duration: 60 }, MOC)).toBe(false);
    expect(isExamExpired({ startTime: new Date(MOC) }, MOC)).toBe(false);
    expect(isExamExpired(null, MOC)).toBe(false);
    expect(isExamExpired(undefined, MOC)).toBe(false);
  });
});

describe("resolveDisplayStatus", () => {
  it("PUBLISHED đã quá giờ -> hiển thị COMPLETED", () => {
    expect(resolveDisplayStatus(ky(90, 60), MOC)).toBe("COMPLETED");
  });

  it("PUBLISHED chưa quá giờ -> giữ nguyên", () => {
    expect(resolveDisplayStatus(ky(10, 60), MOC)).toBe("PUBLISHED");
  });

  it("DRAFT quá giờ vẫn là DRAFT — không tự công bố rồi đóng", () => {
    // Kỳ thi nháp chưa từng được công bố thì không có khái niệm "hết giờ".
    expect(resolveDisplayStatus(ky(90, 60, "DRAFT"), MOC)).toBe("DRAFT");
  });

  it("COMPLETED giữ nguyên COMPLETED", () => {
    expect(resolveDisplayStatus(ky(90, 60, "COMPLETED"), MOC)).toBe("COMPLETED");
  });
});

describe("closeExpiredExams — điều kiện gửi xuống MongoDB", () => {
  it("chỉ động vào kỳ thi đang PUBLISHED", async () => {
    await closeExpiredExams(new Date(MOC));

    const [filter, update] = updateMany.mock.calls[0];
    expect(filter.status).toBe("PUBLISHED");
    expect(update).toEqual({ $set: { status: "COMPLETED" } });
  });

  it("so sánh startTime + duration PHÚT với thời điểm hiện tại, chiều nhỏ hơn", async () => {
    // Nếu ai đó đổi $lt thành $gt, hệ thống sẽ đóng đúng những kỳ thi CHƯA diễn ra và bỏ qua
    // những kỳ đã xong — hỏng ngược hoàn toàn mà vẫn "chạy được". Chốt hình dạng biểu thức.
    const now = new Date(MOC);
    await closeExpiredExams(now);

    const [filter] = updateMany.mock.calls[0];
    expect(filter.$expr).toEqual({
      $lt: [{ $add: ["$startTime", { $multiply: ["$duration", 60000] }] }, now],
    });
  });

  it("trả về số kỳ thi thực sự bị đóng", async () => {
    updateMany.mockResolvedValue({ modifiedCount: 7 });
    await expect(closeExpiredExams(new Date(MOC))).resolves.toEqual({ closed: 7 });
  });

  it("không có kỳ nào hết giờ thì trả 0, không lỗi", async () => {
    updateMany.mockResolvedValue({ modifiedCount: 0 });
    await expect(closeExpiredExams(new Date(MOC))).resolves.toEqual({ closed: 0 });
  });
});

describe("findClosedExamIds", () => {
  const chainLean = (docs) => ({ select: () => ({ lean: () => Promise.resolve(docs) }) });

  it("chỉ lấy id, không kéo cả document về", async () => {
    const select = vi.fn(() => ({ lean: () => Promise.resolve([]) }));
    find.mockReturnValue({ select });

    await findClosedExamIds(new Date(MOC));

    expect(select).toHaveBeenCalledWith("_id");
  });

  it("trả về mảng id phẳng", async () => {
    find.mockReturnValue(chainLean([{ _id: "e1" }, { _id: "e2" }]));
    await expect(findClosedExamIds(new Date(MOC))).resolves.toEqual(["e1", "e2"]);
  });

  it("không có kỳ nào đã đóng thì trả mảng rỗng", async () => {
    find.mockReturnValue(chainLean([]));
    await expect(findClosedExamIds(new Date(MOC))).resolves.toEqual([]);
  });
});
