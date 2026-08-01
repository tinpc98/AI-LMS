// Chốt job đóng kỳ thi hết giờ (§6.7).
//
// Điều quan trọng nhất cần chốt ở đây là một QUYẾT ĐỊNH, không phải một phép tính: job CHỈ
// ĐẾM phiên làm bài còn kẹt, tuyệt đối không sửa chúng. Chấm tự động nghĩa là cho điểm 0,
// đánh dấu SUBMITTED nghĩa là đẩy bài trống vào hàng chờ chấm — cả hai đều động vào điểm của
// học sinh và phải do con người quyết. Test này khoá quyết định đó lại.
import { describe, it, expect, vi, beforeEach } from "vitest";

const closeExpiredExams = vi.fn();
const findClosedExamIds = vi.fn();
const countDocuments = vi.fn();
const updateMany = vi.fn();
const updateOne = vi.fn();
const deleteMany = vi.fn();

vi.mock("#modules/exam", () => ({
  closeExpiredExams: (...a) => closeExpiredExams(...a),
  findClosedExamIds: (...a) => findClosedExamIds(...a),
}));

vi.mock("#modules/exam-attempt", () => ({
  ExamAttempt: {
    countDocuments: (...a) => countDocuments(...a),
    // Ba hàm ghi dưới đây KHÔNG được job gọi. Đưa vào mock để nếu ai đó thêm lời gọi ghi,
    // test bên dưới bắt được thay vì im lặng cho qua.
    updateMany: (...a) => updateMany(...a),
    updateOne: (...a) => updateOne(...a),
    deleteMany: (...a) => deleteMany(...a),
  },
}));

const { runExamAutoClose } = await import("#jobs/examLifecycle.job.js");

const MOC = new Date("2026-08-01T10:00:00Z");

beforeEach(() => {
  closeExpiredExams.mockReset().mockResolvedValue({ closed: 0 });
  findClosedExamIds.mockReset().mockResolvedValue([]);
  countDocuments.mockReset().mockResolvedValue(0);
  updateMany.mockReset();
  updateOne.mockReset();
  deleteMany.mockReset();
});

describe("runExamAutoClose", () => {
  it("đóng kỳ thi hết giờ và báo lại số lượng", async () => {
    closeExpiredExams.mockResolvedValue({ closed: 3 });

    await expect(runExamAutoClose(MOC)).resolves.toMatchObject({ closed: 3 });
    expect(closeExpiredExams).toHaveBeenCalledWith(MOC);
  });

  it("đếm phiên IN_PROGRESS còn kẹt ở các kỳ thi đã đóng", async () => {
    findClosedExamIds.mockResolvedValue(["e1", "e2"]);
    countDocuments.mockResolvedValue(4);

    const kq = await runExamAutoClose(MOC);

    expect(kq.dangling).toBe(4);
    expect(countDocuments).toHaveBeenCalledWith({
      examId: { $in: ["e1", "e2"] },
      status: "IN_PROGRESS",
    });
  });

  it("KHÔNG SỬA phiên làm bài — chỉ đếm", async () => {
    // Test khoá quyết định nghiệp vụ. Nếu ai đó thêm updateMany để "dọn cho sạch", test đỏ và
    // buộc phải bàn lại thay vì âm thầm cho điểm 0 hàng loạt.
    findClosedExamIds.mockResolvedValue(["e1"]);
    countDocuments.mockResolvedValue(9);

    await runExamAutoClose(MOC);

    expect(updateMany).not.toHaveBeenCalled();
    expect(updateOne).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it("không có kỳ thi nào đã đóng thì bỏ qua luôn bước đếm", async () => {
    findClosedExamIds.mockResolvedValue([]);

    const kq = await runExamAutoClose(MOC);

    expect(kq.dangling).toBe(0);
    expect(countDocuments).not.toHaveBeenCalled(); // không hỏi DB một câu vô nghĩa
  });

  it("lỗi khi đóng kỳ thi được ném ra ngoài để tầng cron ghi log", async () => {
    // Job không tự nuốt lỗi: index.js đã bọc try/catch riêng cho từng job để một job hỏng
    // không kéo theo job khác. Nuốt ở đây nghĩa là lỗi biến mất khỏi log.
    closeExpiredExams.mockRejectedValue(new Error("mất kết nối DB"));

    await expect(runExamAutoClose(MOC)).rejects.toThrow("mất kết nối DB");
  });
});
