// Chốt job tự động nộp bài khi hết giờ (chính sách 1A).
//
// Đây là job có hậu quả nặng nhất hệ thống: nó CHỐT ĐIỂM của học sinh mà không ai bấm nút.
// Sai ở đây nghĩa là nộp sớm bài đang làm, hoặc chấm rỗng bài đã làm xong.
import { describe, it, expect, vi, beforeEach } from "vitest";

const aggregate = vi.fn();
const gradeSubmission = vi.fn();

vi.mock("#modules/exam-attempt/examAttempt.model.js", () => ({
  default: { aggregate: (...a) => aggregate(...a) },
}));
vi.mock("#modules/exam-attempt/examAttempt.service.js", () => ({
  default: { gradeSubmission: (...a) => gradeSubmission(...a) },
}));
vi.mock("#modules/exam", () => ({ Exam: { collection: { name: "exams" } } }));

const { runExamAttemptAutoSubmit, findOverdueAttempts } =
  await import("#jobs/examAttemptAutoSubmit.job.js");

const MOC = new Date("2026-08-01T10:00:00Z");

beforeEach(() => {
  aggregate.mockReset().mockResolvedValue([]);
  gradeSubmission.mockReset().mockResolvedValue({});
});

describe("findOverdueAttempts — điều kiện lọc", () => {
  it("chỉ lấy phiên đang IN_PROGRESS", async () => {
    await findOverdueAttempts(MOC);

    const pipeline = aggregate.mock.calls[0][0];
    expect(pipeline[0]).toEqual({ $match: { status: "IN_PROGRESS" } });
  });

  it("ghép sang collection kỳ thi để lấy thời lượng", async () => {
    // Hạn nộp = startTime của phiên + duration của đề, nên phép so sánh cần dữ liệu hai bảng.
    await findOverdueAttempts(MOC);

    const pipeline = aggregate.mock.calls[0][0];
    expect(pipeline[1].$lookup).toMatchObject({ from: "exams", localField: "examId" });
  });

  it("CỘNG ÂN HẠN vào hạn nộp trước khi so sánh", async () => {
    // Thiếu ân hạn thì học sinh bấm nộp đúng giây cuối trên mạng chậm sẽ bị job cướp mất bài
    // ngay trước đó. Chốt hình dạng biểu thức.
    await findOverdueAttempts(MOC);

    const pipeline = aggregate.mock.calls[0][0];
    const bieuThuc = pipeline[3].$match.$expr.$lt[0].$add;

    expect(bieuThuc).toContain("$startTime");
    expect(bieuThuc).toContainEqual({ $multiply: ["$exam.duration", 60000] });
    expect(bieuThuc).toContain(2 * 60 * 1000); // ân hạn 2 phút
  });

  it("so sánh theo chiều NHỎ HƠN thời điểm hiện tại", async () => {
    // Đảo chiều nghĩa là nộp hộ đúng những phiên CHƯA hết giờ — hỏng ngược hoàn toàn mà vẫn
    // "chạy được".
    await findOverdueAttempts(MOC);

    expect(aggregate.mock.calls[0][0][3].$match.$expr.$lt[1]).toBe(MOC);
  });
});

describe("runExamAttemptAutoSubmit", () => {
  it("không có phiên quá hạn thì KHÔNG gọi chấm điểm", async () => {
    await expect(runExamAttemptAutoSubmit(MOC)).resolves.toEqual({ submitted: 0, failed: 0 });
    expect(gradeSubmission).not.toHaveBeenCalled();
  });

  it("chấm bài theo ĐÚNG những gì đã lưu lên máy chủ", async () => {
    // Điểm mấu chốt của cả chính sách: job không tự bịa bài làm, nó dùng bản nháp mà
    // PATCH /:id/answers đã lưu.
    const answers = [{ questionId: "q1", selectedOption: "A" }];
    aggregate.mockResolvedValue([{ _id: "a1", answers }]);

    await runExamAttemptAutoSubmit(MOC);

    expect(gradeSubmission).toHaveBeenCalledWith("a1", answers);
  });

  it("phiên chưa lưu câu nào vẫn được nộp với danh sách rỗng", async () => {
    // Đó là kết quả trung thực của việc không làm bài — khác hẳn với mất bài do hệ thống
    // không lưu, thứ mà bước tự lưu đã giải quyết.
    aggregate.mockResolvedValue([{ _id: "a1" }]);

    await runExamAttemptAutoSubmit(MOC);

    expect(gradeSubmission).toHaveBeenCalledWith("a1", []);
  });

  it("MỘT phiên hỏng không chặn các phiên còn lại", async () => {
    aggregate.mockResolvedValue([{ _id: "a1" }, { _id: "a2" }, { _id: "a3" }]);
    gradeSubmission.mockImplementation(async (id) => {
      if (id === "a2") throw new Error("lỗi ghi DB");
      return {};
    });

    const kq = await runExamAttemptAutoSubmit(MOC);

    expect(kq).toEqual({ submitted: 2, failed: 1 });
    expect(gradeSubmission).toHaveBeenCalledTimes(3);
  });

  it("đếm đúng số phiên đã nộp", async () => {
    aggregate.mockResolvedValue([{ _id: "a1" }, { _id: "a2" }]);

    await expect(runExamAttemptAutoSubmit(MOC)).resolves.toEqual({ submitted: 2, failed: 0 });
  });
});
