// Port từ src/utils/answerScoring.test.js — script test thủ công (console.log + process.exit)
// nằm lẫn trong src/ nên KHÔNG khớp include ["tests/**/*.test.js"] của vitest.config.js,
// tức chưa từng chạy trong CI. Đợt "Port 14 script test thủ công sang Vitest" bỏ sót file này
// vì nó không nằm ở src/scripts/ như 14 file kia.
//
// Giữ nguyên toàn bộ assertion gốc, bổ sung các nhánh biên mà bản cũ chưa phủ.
import { describe, it, expect } from "vitest";
import {
  normalizeAnswer,
  compareAnswers,
} from "../../../../src/modules/exam-attempt/answerScoring.js";

describe("compareAnswers — các assertion từ script gốc", () => {
  it("trắc nghiệm một đáp án: khớp chính xác", () => {
    expect(compareAnswers("A", "A")).toBe(true);
  });

  it("trắc nghiệm một đáp án: lệch nhau", () => {
    expect(compareAnswers("A", "B")).toBe(false);
  });

  it("nhiều đáp án, cùng thứ tự", () => {
    expect(compareAnswers(["A", "C"], ["A", "C"])).toBe(true);
  });

  it("nhiều đáp án, khác thứ tự vẫn tính đúng", () => {
    expect(compareAnswers(["A", "C"], ["C", "A"])).toBe(true);
  });

  it("thiếu một lựa chọn thì sai", () => {
    expect(compareAnswers(["A", "C"], ["A"])).toBe(false);
  });

  it("thừa một lựa chọn thì sai", () => {
    expect(compareAnswers(["A"], ["A", "B"])).toBe(false);
  });

  it("lựa chọn trùng lặp được khử trùng trước khi so sánh", () => {
    expect(compareAnswers(["A", "C"], ["A", "A", "C"])).toBe(true);
  });

  it("so chuỗi với null thì sai", () => {
    expect(compareAnswers("A", null)).toBe(false);
  });

  it("null so với null thì đúng (đều là rỗng)", () => {
    expect(compareAnswers(null, null)).toBe(true);
  });

  it("chuỗi JSON so với mảng thật, khác thứ tự vẫn đúng", () => {
    expect(compareAnswers('["A", "B"]', ["B", "A"])).toBe(true);
  });
});

describe("compareAnswers — nhánh biên bổ sung", () => {
  it("undefined tương đương rỗng, giống null", () => {
    expect(compareAnswers(undefined, null)).toBe(true);
    expect(compareAnswers(undefined, "A")).toBe(false);
  });

  it("chuỗi rỗng và chuỗi toàn khoảng trắng đều coi là không trả lời", () => {
    expect(compareAnswers("", null)).toBe(true);
    expect(compareAnswers("   ", null)).toBe(true);
  });

  it("chuỗi phân tách bằng dấu phẩy được tách thành nhiều đáp án", () => {
    expect(compareAnswers("A, C", ["A", "C"])).toBe(true);
    expect(compareAnswers("A,C", ["C", "A"])).toBe(true);
  });

  it("khoảng trắng thừa quanh mỗi đáp án được cắt bỏ", () => {
    expect(compareAnswers("  A  ", "A")).toBe(true);
    expect(compareAnswers([" A ", " C "], ["C", "A"])).toBe(true);
  });

  it("phân biệt chữ hoa chữ thường — 'a' KHÁC 'A'", () => {
    // Ghi nhận hành vi hiện tại: normalizeAnswer không hạ chữ thường.
    expect(compareAnswers("A", "a")).toBe(false);
  });

  it("giá trị số được ép về chuỗi để so sánh", () => {
    expect(compareAnswers(1, "1")).toBe(true);
  });
});

describe("normalizeAnswer", () => {
  it("null/undefined trả về mảng rỗng", () => {
    expect(normalizeAnswer(null)).toEqual([]);
    expect(normalizeAnswer(undefined)).toEqual([]);
  });

  it("sắp xếp theo thứ tự bảng chữ cái để so sánh không phụ thuộc thứ tự", () => {
    expect(normalizeAnswer(["C", "A", "B"])).toEqual(["A", "B", "C"]);
  });

  it("khử trùng lặp", () => {
    expect(normalizeAnswer(["A", "A", "B"])).toEqual(["A", "B"]);
  });

  it("chuỗi JSON không hợp lệ được giữ nguyên làm một đáp án đơn", () => {
    expect(normalizeAnswer("[khong-phai-json")).toEqual(["[khong-phai-json"]);
  });

  it("loại bỏ phần tử rỗng sau khi tách chuỗi", () => {
    expect(normalizeAnswer("A,,C")).toEqual(["A", "C"]);
  });
});
