import { createRequire } from "module";
const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");
import mammoth from "mammoth";
import { AIError, AIErrorCode } from "../../utils/aiError.js";

class LessonContentExtractorService {
  constructor() {
    this.maxSize = parseInt(process.env.MAX_EXTRACT_SIZE, 10) || 5 * 1024 * 1024; // 5MB limit
    this.timeoutMs = parseInt(process.env.EXTRACT_TIMEOUT_MS, 10) || 15000; // 15 seconds
    this.allowedDomains = (process.env.ALLOWED_ATTACHMENT_DOMAINS || "res.cloudinary.com").split(",");
  }

  /**
   * Verify if URL is allowed and safe to download
   */
  isUrlAllowed(urlStr) {
    try {
      const parsedUrl = new URL(urlStr);
      if (parsedUrl.protocol !== "https:") return false;
      return this.allowedDomains.some(domain => parsedUrl.hostname === domain || parsedUrl.hostname.endsWith(`.${domain}`));
    } catch {
      return false;
    }
  }

  /**
   * Fetch file buffer safely with timeout and size limit
   */
  async fetchSafeBuffer(urlStr) {
    if (!this.isUrlAllowed(urlStr)) {
      throw new AIError("URL tài liệu không nằm trong danh sách cho phép hoặc không dùng HTTPS", AIErrorCode.AI_INVALID_INPUT, 400);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(urlStr, { signal: controller.signal });
      if (!response.ok) {
        throw new AIError(`Không thể tải tài liệu (HTTP ${response.status})`, AIErrorCode.AI_PROVIDER_ERROR, 502);
      }

      // Read buffer with manual size check
      const arrayBuffer = await response.arrayBuffer();
      if (arrayBuffer.byteLength > this.maxSize) {
        throw new AIError(`Tài liệu vượt quá giới hạn kích thước cho phép (${Math.round(this.maxSize / 1024 / 1024)}MB)`, AIErrorCode.AI_INVALID_INPUT, 413);
      }
      return Buffer.from(arrayBuffer);
    } catch (error) {
      if (error.name === "AbortError") {
        throw new AIError("Quá thời gian tải tài liệu", AIErrorCode.AI_TIMEOUT, 504);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Normalize text by removing bad characters
   */
  cleanText(text) {
    if (!text) return "";
    return text
      .normalize("NFC")
      // Remove null bytes and non-printable control characters except newlines/tabs
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
      .trim();
  }

  /**
   * Extract text from PDF buffer
   */
  async extractPdf(buffer) {
    const { PDFParse } = require("pdf-parse");
    let parser = null;
    try {
      parser = new PDFParse({ data: buffer });
      const result = await parser.getText();
      return this.cleanText(result.text);
    } catch (error) {
      console.error("[LessonContentExtractor] Lỗi phân tích file PDF:", error);
      throw new AIError("Lỗi phân tích file PDF. File có thể bị hỏng hoặc không đúng định dạng.", AIErrorCode.AI_INVALID_INPUT, 415);
    } finally {
      if (parser && typeof parser.destroy === 'function') {
        try {
          await parser.destroy();
        } catch (e) {
          console.error("[LessonContentExtractor] Lỗi khi destroy parser PDF:", e);
        }
      }
    }
  }

  /**
   * Extract text from DOCX buffer
   */
  async extractDocx(buffer) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      return this.cleanText(result.value);
    } catch (error) {
      console.error("[LessonContentExtractor] Lỗi phân tích file DOCX:", error);
      throw new AIError("Lỗi phân tích file DOCX. File có thể bị hỏng hoặc không đúng định dạng.", AIErrorCode.AI_INVALID_INPUT, 415);
    }
  }

  /**
   * Extract content from lesson & its attachments
   */
  async extractLessonContent(lesson) {
    let extractedText = `Tiêu đề bài giảng: ${lesson.title || ""}\n`;
    if (lesson.description) {
      extractedText += `Mô tả: ${this.cleanText(lesson.description)}\n\n`;
    }

    const warnings = [];

    if (lesson.attachments && Array.isArray(lesson.attachments)) {
      for (const attachment of lesson.attachments) {
        const url = attachment.url;
        if (!url) continue;

        const lowerUrl = url.toLowerCase();
        try {
          if (lowerUrl.endsWith(".pdf")) {
            const buffer = await this.fetchSafeBuffer(url);
            const text = await this.extractPdf(buffer);
            extractedText += `\n--- Bắt đầu nội dung đính kèm: ${attachment.name} ---\n${text}\n--- Kết thúc nội dung đính kèm ---\n`;
          } else if (lowerUrl.endsWith(".docx")) {
            const buffer = await this.fetchSafeBuffer(url);
            const text = await this.extractDocx(buffer);
            extractedText += `\n--- Bắt đầu nội dung đính kèm: ${attachment.name} ---\n${text}\n--- Kết thúc nội dung đính kèm ---\n`;
          } else {
            warnings.push(`Bỏ qua file ${attachment.name}: Định dạng chưa được hỗ trợ (chỉ hỗ trợ .pdf, .docx).`);
          }
        } catch (error) {
          if (error instanceof AIError) {
            warnings.push(`Bỏ qua file ${attachment.name}: ${error.message}`);
          } else {
            warnings.push(`Bỏ qua file ${attachment.name}: Lỗi hệ thống không xác định.`);
          }
        }
      }
    }

    // Limit maximum text input (e.g. 50k characters for safety against too large prompt)
    const maxChars = 50000;
    if (extractedText.length > maxChars) {
      throw new AIError("Nội dung bài giảng và tài liệu quá dài, vượt quá khả năng tóm tắt hiện tại.", AIErrorCode.AI_INVALID_INPUT, 413);
    }

    return { text: extractedText, warnings };
  }
}

export default new LessonContentExtractorService();
