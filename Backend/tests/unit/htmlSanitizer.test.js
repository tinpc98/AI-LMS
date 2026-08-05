import { describe, it, expect } from "vitest";
import { sanitizeRichText } from "../../src/shared/utils/htmlSanitizer.js";

describe("htmlSanitizer - Security & Whitelist Test", () => {
  it("should strip <script> tags and code entirely", () => {
    const malicious = "<p>Hello</p><script>alert('XSS Attack');</script>";
    const cleaned = sanitizeRichText(malicious);
    expect(cleaned).toBe("<p>Hello</p>");
    expect(cleaned).not.toContain("<script>");
    expect(cleaned).not.toContain("alert");
  });

  it("should strip <img onerror=...> and any <img> tags (including base64)", () => {
    const malicious = '<p>Test</p><img src="x" onerror="alert(1)" /><img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" />';
    const cleaned = sanitizeRichText(malicious);
    expect(cleaned).toBe("<p>Test</p>");
    expect(cleaned).not.toContain("<img");
    expect(cleaned).not.toContain("onerror");
    expect(cleaned).not.toContain("data:image");
  });

  it("should neutralize <a href='javascript:...'>", () => {
    const malicious = '<a href="javascript:alert(1)">Click me</a>';
    const cleaned = sanitizeRichText(malicious);
    expect(cleaned).not.toContain("javascript:");
    expect(cleaned).toContain("Click me");
  });

  it("should automatically add rel='noopener noreferrer' and target='_blank' to valid links", () => {
    const safeLink = '<a href="https://google.com">Search</a>';
    const cleaned = sanitizeRichText(safeLink);
    expect(cleaned).toContain('href="https://google.com"');
    expect(cleaned).toContain('rel="noopener noreferrer"');
    expect(cleaned).toContain('target="_blank"');
  });

  it("should preserve valid rich text tags and tables", () => {
    const richText =
      "<h2>Tiêu đề</h2><p>Đoạn văn <strong>in đậm</strong> và <em>in nghiêng</em></p><table><thead><tr><th>Cột 1</th><th>Cột 2</th></tr></thead><tbody><tr><td>A</td><td>B</td></tr></tbody></table>";
    const cleaned = sanitizeRichText(richText);
    expect(cleaned).toContain("<h2>Tiêu đề</h2>");
    expect(cleaned).toContain("<strong>in đậm</strong>");
    expect(cleaned).toContain("<em>in nghiêng</em>");
    expect(cleaned).toContain("<table>");
  });
});
