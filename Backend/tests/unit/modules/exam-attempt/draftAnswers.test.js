// Chốt việc lưu tạm bài làm — điều kiện tiên quyết của cron tự động nộp bài.
//
// Nếu hàm này hỏng, hậu quả không hiện ra ngay: bài làm vẫn ở localStorage nên học sinh không
// thấy gì bất thường, cho tới lúc hết giờ và máy chủ chấm một bài RỖNG. Đó là lý do nó cần
// test kỹ hơn mức bình thường.
import { describe, it, expect, vi, beforeEach } from "vitest";

const findById = vi.fn();
const examFindById = vi.fn();

vi.mock("#modules/exam-attempt/examAttempt.model.js", () => ({
  default: { findById: (...a) => findById(...a) },
}));
vi.mock("#modules/exam", () => ({
  Exam: { findById: (...a) => examFindById(...a) },
}));

const { saveDraftAnswers } = await import("#modules/exam-attempt/draftAnswers.service.js");

const SINH_VIEN = "hs-1";
const PHUT = 60 * 1000;
const MOC = new Date("2026-08-01T10:00:00Z");

const phienGia = (over = {}) => ({
  studentId: SINH_VIEN,
  status: "IN_PROGRESS",
  startTime: MOC,
  examId: "e1",
  answers: [],
  save: vi.fn().mockResolvedValue(true),
  ...over,
});

const datGio = (phutSauMoc) => vi.setSystemTime(new Date(MOC.getTime() + phutSauMoc * PHUT));

beforeEach(() => {
  vi.useFakeTimers();
  datGio(10);
  findById.mockReset();
  examFindById.mockReset().mockReturnValue({
    select: () => ({ lean: () => Promise.resolve({ duration: 60 }) }),
  });
});

describe("saveDraftAnswers — quyền và trạng thái", () => {
  it("lưu được câu trả lời của chính mình", async () => {
    const phien = phienGia();
    findById.mockResolvedValue(phien);

    const kq = await saveDraftAnswers("a1", SINH_VIEN, [{ questionId: "q1", selectedOption: "A" }]);

    expect(kq.saved).toBe(1);
    expect(phien.save).toHaveBeenCalled();
    expect(phien.answers[0]).toMatchObject({ questionId: "q1", selectedOption: "A" });
  });

  it("CHẶN ghi vào bài của người khác", async () => {
    findById.mockResolvedValue(phienGia({ studentId: "hs-khac" }));

    await expect(saveDraftAnswers("a1", SINH_VIEN, [{ questionId: "q1" }])).rejects.toThrow(
      /không có quyền/
    );
  });

  it("chặn ghi khi bài đã nộp", async () => {
    findById.mockResolvedValue(phienGia({ status: "SUBMITTED" }));

    await expect(saveDraftAnswers("a1", SINH_VIEN, [{ questionId: "q1" }])).rejects.toThrow(
      /đã kết thúc/
    );
  });

  it("không tìm thấy phiên thì báo 404", async () => {
    findById.mockResolvedValue(null);

    await expect(saveDraftAnswers("a1", SINH_VIEN, [])).rejects.toMatchObject({ status: 404 });
  });
});

describe("saveDraftAnswers — chốt thời gian", () => {
  it("CHẶN ghi sau khi đã hết giờ (kể cả ân hạn)", async () => {
    // Không có chốt này thì học sinh vẫn lưu bài được trong khoảng giữa lúc hết giờ và lúc
    // cron chạy — tức là được thi thêm.
    findById.mockResolvedValue(phienGia());
    datGio(63); // hạn 60 phút + ân hạn 2 phút

    await expect(saveDraftAnswers("a1", SINH_VIEN, [{ questionId: "q1" }])).rejects.toThrow(
      /hết giờ/
    );
  });

  it("vẫn cho ghi TRONG ân hạn — mạng chậm không phải lỗi của học sinh", async () => {
    const phien = phienGia();
    findById.mockResolvedValue(phien);
    datGio(61);

    await expect(saveDraftAnswers("a1", SINH_VIEN, [{ questionId: "q1" }])).resolves.toMatchObject({
      saved: 1,
    });
  });
});

describe("saveDraftAnswers — gộp theo câu hỏi", () => {
  it("GHI ĐÈ câu cũ, KHÔNG tạo bản trùng", async () => {
    const phien = phienGia({
      answers: [{ questionId: "q1", selectedOption: "A", pointsEarned: 0 }],
    });
    findById.mockResolvedValue(phien);

    await saveDraftAnswers("a1", SINH_VIEN, [{ questionId: "q1", selectedOption: "B" }]);

    expect(phien.answers).toHaveLength(1);
    expect(phien.answers[0].selectedOption).toBe("B");
  });

  it("KHÔNG xoá các câu đã lưu trước đó", async () => {
    // Máy khách gửi từng câu khi học sinh chọn. Thay cả mảng sẽ xoá sạch phần còn lại —
    // học sinh làm 20 câu, đổi câu 21, mất 20 câu đầu.
    const phien = phienGia({ answers: [{ questionId: "q1", selectedOption: "A" }] });
    findById.mockResolvedValue(phien);

    await saveDraftAnswers("a1", SINH_VIEN, [{ questionId: "q2", selectedOption: "C" }]);

    expect(phien.answers.map((a) => a.questionId).sort()).toEqual(["q1", "q2"]);
  });

  it("KHÔNG chấm điểm khi lưu tạm — pointsEarned luôn 0", async () => {
    // Chấm điểm chỉ xảy ra một lần lúc nộp. Cộng điểm ở đây sẽ khiến điểm nhân lên theo số lần
    // học sinh đổi ý.
    const phien = phienGia();
    findById.mockResolvedValue(phien);

    await saveDraftAnswers("a1", SINH_VIEN, [{ questionId: "q1", selectedOption: "A" }]);

    expect(phien.answers[0].pointsEarned).toBe(0);
  });

  it("bỏ qua phần tử thiếu questionId, không làm hỏng cả lượt lưu", async () => {
    const phien = phienGia();
    findById.mockResolvedValue(phien);

    await saveDraftAnswers("a1", SINH_VIEN, [{ selectedOption: "A" }, { questionId: "q1" }]);

    expect(phien.answers).toHaveLength(1);
  });

  it("dữ liệu không phải mảng thì báo 400", async () => {
    await expect(saveDraftAnswers("a1", SINH_VIEN, "không-phải-mảng")).rejects.toMatchObject({
      status: 400,
    });
  });
});
