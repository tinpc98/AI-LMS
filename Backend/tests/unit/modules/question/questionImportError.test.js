// Chốt hành vi đã SỬA ở Wave 4.4: lỗi do người dùng gây ra phải trả 4xx, không phải 500.
//
// Trước Wave 4.4: question.service ném `new Error("File Excel trống...")` (không có status),
// còn question.controller catch rồi ép `res.status(500)`. Hệ quả là người dùng tải nhầm
// file sẽ nhận "lỗi server" — sai bản chất, và làm nhiễu cả cảnh báo lỗi 5xx khi vận hành.
//
// Nay service ném ValidationError (status 400) và controller dùng asyncHandler để lỗi đi
// tới errorHandler tập trung.
import { describe, it, expect, vi, afterEach } from "vitest";
import questionService from "#modules/question/question.service.js";
import { ValidationError } from "#shared/utils/appError.js";

afterEach(() => vi.restoreAllMocks());

describe("importQuestionsFromExcel — phân loại lỗi", () => {
  it("file Excel rỗng ném ValidationError với status 400, KHÔNG phải lỗi 500", async () => {
    // Buffer rác -> xlsx đọc ra sheet rỗng
    const emptyWorkbook = Buffer.from("");

    await expect(questionService.importQuestionsFromExcel(emptyWorkbook)).rejects.toSatisfy(
      (err) => {
        expect(err.status).toBe(400);
        expect(err.code).toBe("VALIDATION_ERROR");
        expect(err.isAppError).toBe(true);
        return true;
      }
    );
  });

  it("ValidationError mang đủ thông tin để errorHandler trả đúng mã", () => {
    const err = new ValidationError("File Excel trống hoặc không đúng định dạng!");
    expect(err.status).toBe(400);
    expect(err.isAppError).toBe(true);
    // errorHandler dùng isAppError để quyết định CÓ hiện message cho client ở production
    // hay không — lỗi cố ý ném ra thì hiện, lỗi bất ngờ thì ẩn.
    expect(err.message).toContain("File Excel");
  });
});
