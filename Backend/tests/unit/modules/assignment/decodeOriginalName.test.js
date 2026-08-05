import { describe, it, expect } from "vitest";
import { decodeOriginalName } from "#modules/assignment/assignment.service.js";

describe("decodeOriginalName — Sửa lỗi vỡ mã tên file tiếng Việt từ multer", () => {
  it("Giải mã đúng tên file tiếng Việt bị multer đọc nhầm thành Latin-1 (mojibake)", () => {
    const rawVietnamese = "Đề bài chương 1 - Cơ sở dữ liệu.pdf";
    const multerMojibake = Buffer.from(rawVietnamese, "utf8").toString("latin1");

    const decoded = decodeOriginalName(multerMojibake);
    expect(decoded).toBe(rawVietnamese);
  });

  it("Giải mã đúng chuỗi mojibake thực tế ghi nhận trong database", () => {
    const dbCorruptedName = "Thiáº¿t káº¿ chÆ°a cÃ³ tÃªn.png";
    const decoded = decodeOriginalName(dbCorruptedName);
    expect(decoded).toBe("Thiết kế chưa có tên.png");
  });

  it("Không bị double-decode nếu chuỗi đã là UTF-8 hợp lệ có ký tự tiếng Việt", () => {
    const alreadyUtf8 = "Báo cáo thực tập tốt nghiệp.docx";
    const decoded = decodeOriginalName(alreadyUtf8);
    expect(decoded).toBe(alreadyUtf8);
  });

  it("Xử lý bình thường với tên file tiếng Anh / ASCII không dấu", () => {
    const asciiName = "Final_Project_Report_v2.pdf";
    const decoded = decodeOriginalName(asciiName);
    expect(decoded).toBe(asciiName);
  });

  it("Xử lý an toàn với chuỗi rỗng, null hoặc undefined", () => {
    expect(decodeOriginalName("")).toBe("");
    expect(decodeOriginalName(null)).toBe("");
    expect(decodeOriginalName(undefined)).toBe("");
  });
});
