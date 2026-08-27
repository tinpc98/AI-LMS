// Chốt việc lưu tạm bài làm — điều kiện tiên quyết của cron tự động nộp bài.
//
// Nếu hàm này hỏng, hậu quả không hiện ra ngay: bài làm vẫn ở localStorage nên học sinh không
// thấy gì bất thường, cho tới lúc hết giờ và máy chủ chấm một bài RỖNG. Đó là lý do nó cần
// test kỹ hơn mức bình thường.
//
// Cập nhật theo service hiện tại (canonical storage): ghi vào attempt.questions[i].answer bằng
// findOneAndUpdate + $set theo path động (không còn attempt.answers[] + attempt.save()). Hạn nộp
// dùng thẳng attempt.expiresAt (không còn tra thêm Exam.findById để tính startTime+duration).
import { describe, it, expect, vi, beforeEach } from "vitest";

const findById = vi.fn();
const findOneAndUpdate = vi.fn();
const gradeSubmission = vi.fn();

vi.mock("#modules/exam-attempt/examAttempt.model.js", () => ({
  default: {
    findById: (...a) => findById(...a),
    findOneAndUpdate: (...a) => findOneAndUpdate(...a),
  },
}));
vi.mock("#modules/exam-attempt/examAttempt.service.js", () => ({
  gradeSubmission: (...a) => gradeSubmission(...a),
}));

const { saveDraftAnswers } = await import("#modules/exam-attempt/draftAnswers.service.js");

const SINH_VIEN = "hs-1";
const PHUT = 60 * 1000;
const MOC = new Date("2026-08-01T10:00:00Z");

const phienGia = (over = {}) => ({
  studentId: SINH_VIEN,
  status: "IN_PROGRESS",
  expiresAt: new Date(MOC.getTime() + 60 * PHUT), // hạn 60 phút sau MOC
  sessionToken: undefined,
  answersVersion: 0,
  questions: [{ questionId: "q1" }, { questionId: "q2" }],
  ...over,
});

// findOneAndUpdate atomic — mô phỏng đúng field thật sự đổi (expiresAt/answersVersion), không
// cần mô phỏng $set vào questions[] vì các test không đọc lại attempt qua đường này.
const moPhongUpdate = (attempt) =>
  findOneAndUpdate.mockResolvedValue({
    ...attempt,
    answersVersion: attempt.answersVersion + 1,
  });

const datGio = (phutSauMoc) => vi.setSystemTime(new Date(MOC.getTime() + phutSauMoc * PHUT));

beforeEach(() => {
  vi.useFakeTimers();
  datGio(10);
  findById.mockReset();
  findOneAndUpdate.mockReset();
  gradeSubmission.mockReset().mockResolvedValue({});
});

describe("saveDraftAnswers — quyền và trạng thái", () => {
  it("lưu được câu trả lời của chính mình", async () => {
    const phien = phienGia();
    findById.mockResolvedValue(phien);
    moPhongUpdate(phien);

    const kq = await saveDraftAnswers("a1", SINH_VIEN, [
      { questionId: "q1", selectedOptionIds: ["A"] },
    ]);

    expect(kq.saved).toBe(1);
    const setOps = findOneAndUpdate.mock.calls[0][1].$set;
    expect(setOps["questions.0.answer.selectedOptionIds"]).toEqual(["A"]);
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

  it("CHẶN ghi khi đang làm ở thiết bị/tab khác (sessionToken không khớp)", async () => {
    findById.mockResolvedValue(phienGia({ sessionToken: "token-that" }));

    await expect(
      saveDraftAnswers("a1", SINH_VIEN, [{ questionId: "q1" }], undefined, "token-gia")
    ).rejects.toThrow(/thiết bị khác/);
  });
});

describe("saveDraftAnswers — chốt thời gian", () => {
  it("CHẶN ghi sau khi đã hết giờ (kể cả ân hạn) — tự động thu bài", async () => {
    // Không có chốt này thì học sinh vẫn lưu bài được trong khoảng giữa lúc hết giờ và lúc
    // cron chạy — tức là được thi thêm.
    findById.mockResolvedValue(phienGia());
    datGio(63); // hạn 60 phút + ân hạn 2 phút

    await expect(saveDraftAnswers("a1", SINH_VIEN, [{ questionId: "q1" }])).rejects.toThrow(
      /hết giờ/
    );
    expect(gradeSubmission).toHaveBeenCalledWith("a1");
  });

  it("vẫn cho ghi TRONG ân hạn — mạng chậm không phải lỗi của học sinh", async () => {
    const phien = phienGia();
    findById.mockResolvedValue(phien);
    moPhongUpdate(phien);
    datGio(61);

    await expect(
      saveDraftAnswers("a1", SINH_VIEN, [{ questionId: "q1", selectedOptionIds: ["A"] }])
    ).resolves.toMatchObject({
      saved: 1,
    });
  });
});

describe("saveDraftAnswers — gộp theo câu hỏi (atomic $set theo path động)", () => {
  it("GHI ĐÈ câu cũ, KHÔNG tạo bản trùng — $set đúng đúng index của q1", async () => {
    const phien = phienGia();
    findById.mockResolvedValue(phien);
    moPhongUpdate(phien);

    await saveDraftAnswers("a1", SINH_VIEN, [{ questionId: "q1", selectedOptionIds: ["B"] }]);

    const setOps = findOneAndUpdate.mock.calls[0][1].$set;
    expect(Object.keys(setOps)).toEqual(["questions.0.answer.selectedOptionIds"]);
    expect(setOps["questions.0.answer.selectedOptionIds"]).toEqual(["B"]);
  });

  it("KHÔNG đụng tới câu khác — chỉ $set path của câu được gửi lên", async () => {
    // Cơ chế $set theo path động nghĩa là câu không được gửi lên không hề xuất hiện trong update
    // — khác hẳn việc thay cả mảng answers[] (thứ sẽ xoá sạch các câu khác).
    const phien = phienGia();
    findById.mockResolvedValue(phien);
    moPhongUpdate(phien);

    await saveDraftAnswers("a1", SINH_VIEN, [{ questionId: "q2", selectedOptionIds: ["C"] }]);

    const setOps = findOneAndUpdate.mock.calls[0][1].$set;
    expect(Object.keys(setOps)).toEqual(["questions.1.answer.selectedOptionIds"]);
  });

  it("KHÔNG chấm điểm khi lưu tạm — không có field điểm nào trong $set", async () => {
    // Chấm điểm chỉ xảy ra một lần lúc nộp. saveDraftAnswers không được phép ghi bất kỳ field
    // điểm số nào (pointsEarned/isCorrect) — chỉ ghi phần trả lời thô.
    const phien = phienGia();
    findById.mockResolvedValue(phien);
    moPhongUpdate(phien);

    await saveDraftAnswers("a1", SINH_VIEN, [{ questionId: "q1", selectedOptionIds: ["A"] }]);

    const setOps = findOneAndUpdate.mock.calls[0][1].$set;
    const coDungDiem = Object.keys(setOps).some((k) => /points|isCorrect/i.test(k));
    expect(coDungDiem).toBe(false);
  });

  it("bỏ qua phần tử thiếu questionId, không làm hỏng cả lượt lưu", async () => {
    const phien = phienGia();
    findById.mockResolvedValue(phien);
    moPhongUpdate(phien);

    await saveDraftAnswers("a1", SINH_VIEN, [
      { selectedOptionIds: ["A"] },
      { questionId: "q1", selectedOptionIds: ["A"] },
    ]);

    const setOps = findOneAndUpdate.mock.calls[0][1].$set;
    expect(Object.keys(setOps)).toEqual(["questions.0.answer.selectedOptionIds"]);
  });

  it("bỏ qua câu không thuộc đề thi này (questionId lạ)", async () => {
    const phien = phienGia();
    findById.mockResolvedValue(phien);
    moPhongUpdate(phien);

    const kq = await saveDraftAnswers("a1", SINH_VIEN, [
      { questionId: "q-la-hoac-khong-ton-tai", selectedOptionIds: ["A"] },
    ]);

    // Không có câu hợp lệ nào để lưu -> không gọi findOneAndUpdate, saved = 0
    expect(findOneAndUpdate).not.toHaveBeenCalled();
    expect(kq.saved).toBe(0);
  });

  it("dữ liệu không phải mảng thì báo 400", async () => {
    await expect(saveDraftAnswers("a1", SINH_VIEN, "không-phải-mảng")).rejects.toMatchObject({
      status: 400,
    });
  });

  it("version không khớp (tab khác đã ghi trước) → báo 409", async () => {
    const phien = phienGia({ answersVersion: 3 });
    findById.mockResolvedValue(phien);
    findOneAndUpdate.mockResolvedValue(null); // filter {answersVersion: clientVersion} không khớp nữa

    await expect(
      saveDraftAnswers("a1", SINH_VIEN, [{ questionId: "q1", selectedOptionIds: ["A"] }], 1)
    ).rejects.toThrow(/cập nhật ở nơi khác/);
  });
});
