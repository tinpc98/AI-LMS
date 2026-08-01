// Chốt việc sửa N+1 ở import Excel (Wave 4.6 / BC 09).
//
// Trước: mỗi dòng Excel gọi một Question.findOne() riêng và CHỜ TUẦN TỰ — file 500 dòng
// nghĩa là 500 lượt round-trip tới MongoDB, thời gian tăng tuyến tính theo số dòng.
// Sau:   một truy vấn $in duy nhất, không phụ thuộc số dòng.
//
// Test này kiểm CẢ HAI mặt: số truy vấn (hiệu năng) và kết quả lọc (hành vi). Chỉ kiểm
// một mặt là chưa đủ — tối ưu mà đổi kết quả thì vô nghĩa.
import { describe, it, expect, vi, afterEach } from "vitest";
import xlsx from "xlsx";
import questionService from "#modules/question/question.service.js";
import Question from "#modules/question/question.model.js";

afterEach(() => vi.restoreAllMocks());

/** Dựng buffer Excel thật từ danh sách nội dung câu hỏi. */
const buildExcel = (contents) => {
  const rows = contents.map((content, i) => ({
    content,
    type: "MCQ",
    options: "A|B|C|D",
    correctAnswer: "A",
    difficulty: "EASY",
    topic: `chu-de-${i}`,
  }));
  const ws = xlsx.utils.json_to_sheet(rows);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, "Sheet1");
  return xlsx.write(wb, { type: "buffer", bookType: "xlsx" });
};

describe("importQuestionsFromExcel — số truy vấn không phụ thuộc số dòng", () => {
  const mockFind = (existing) => {
    const spy = vi.spyOn(Question, "find").mockReturnValue({
      select: () => ({ lean: async () => existing.map((c) => ({ content: c })) }),
    });
    vi.spyOn(Question, "insertMany").mockImplementation(async (docs) => docs);
    return spy;
  };

  it("50 dòng Excel chỉ tốn ĐÚNG 1 truy vấn tìm trùng", async () => {
    const contents = Array.from({ length: 50 }, (_, i) => `Câu hỏi số ${i}`);
    const find = mockFind([]);

    const result = await questionService.importQuestionsFromExcel(buildExcel(contents));

    expect(find).toHaveBeenCalledTimes(1);
    expect(result).toHaveLength(50);
  });

  it("truy vấn dùng $in với đúng danh sách nội dung cần kiểm", async () => {
    const find = mockFind([]);
    await questionService.importQuestionsFromExcel(buildExcel(["A", "B", "C"]));

    expect(find).toHaveBeenCalledWith({ content: { $in: ["A", "B", "C"] } });
  });

  it("vẫn loại đúng câu đã có trong DB — hành vi không đổi", async () => {
    mockFind(["Đã có 1", "Đã có 2"]);

    const result = await questionService.importQuestionsFromExcel(
      buildExcel(["Đã có 1", "Câu mới", "Đã có 2"])
    );

    expect(result).toHaveLength(1);
    expect(result[0].content).toBe("Câu mới");
  });

  it("vẫn khử trùng lặp NỘI BỘ trong file, giữ lần xuất hiện đầu", async () => {
    const find = mockFind([]);
    const result = await questionService.importQuestionsFromExcel(
      buildExcel(["Trùng", "Khác", "Trùng"])
    );

    // Chỉ 2 nội dung duy nhất được đưa vào truy vấn
    expect(find).toHaveBeenCalledWith({ content: { $in: ["Trùng", "Khác"] } });
    expect(result).toHaveLength(2);
  });

  it("tất cả đều đã tồn tại thì báo lỗi 400, không insert gì", async () => {
    mockFind(["A", "B"]);
    await expect(
      questionService.importQuestionsFromExcel(buildExcel(["A", "B"]))
    ).rejects.toMatchObject({ status: 400 });
    expect(Question.insertMany).not.toHaveBeenCalled();
  });
});
