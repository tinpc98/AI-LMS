import { createRequire } from "module";
const require = createRequire(import.meta.url);
import mammoth from "mammoth";
import { AIError, AIErrorCode } from "../../utils/aiError.js";

class LessonContentExtractorService {
  constructor() {
    this.maxSize = parseInt(process.env.AI_MAX_ATTACHMENT_BYTES, 10) || 10485760; // 10MB limit
    this.timeoutMs = parseInt(process.env.AI_ATTACHMENT_DOWNLOAD_TIMEOUT_MS, 10) || 15000; // 15 seconds
    this.allowedDomains = (process.env.ALLOWED_ATTACHMENT_DOMAINS || "res.cloudinary.com").split(",");
    this.maxRedirects = parseInt(process.env.AI_MAX_REDIRECTS, 10) || 3;
    this.maxAttachments = parseInt(process.env.AI_MAX_ATTACHMENTS_PER_REQUEST, 10) || 5;
  }

  /**
   * Verify if URL is allowed and safe to download
   */
  isUrlAllowed(urlStr) {
    try {
      const parsedUrl = new URL(urlStr);
      if (parsedUrl.protocol !== "https:" && parsedUrl.protocol !== "http:") return false;

      const hostname = parsedUrl.hostname;
      // Chặn private IPs và localhost
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "::1" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        hostname.startsWith("169.254.") ||
        hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
      ) {
        return false;
      }

      // Check allowed domains if strictly enforced
      if (this.allowedDomains.length > 0 && this.allowedDomains[0] !== "*") {
        return this.allowedDomains.some(domain => hostname === domain || hostname.endsWith(`.${domain}`));
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Fetch file buffer safely with timeout, size limit streaming, and manual redirects
   */
  async fetchSafeBuffer(urlStr) {
    let currentUrl = urlStr;
    let redirects = 0;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      while (redirects <= this.maxRedirects) {
        if (!this.isUrlAllowed(currentUrl)) {
          throw new AIError("URL tài liệu không an toàn hoặc không nằm trong danh sách cho phép", AIErrorCode.AI_INVALID_INPUT, 400);
        }

        const response = await fetch(currentUrl, { 
          signal: controller.signal,
          redirect: "manual" // Handle redirects manually for safety
        });

        if (response.status >= 300 && response.status < 400 && response.headers.has("location")) {
          // It's a redirect
          redirects++;
          if (redirects > this.maxRedirects) {
            throw new AIError("Quá nhiều vòng lặp chuyển hướng (Redirects)", AIErrorCode.AI_PROVIDER_ERROR, 502);
          }
          currentUrl = new URL(response.headers.get("location"), currentUrl).toString();
          continue;
        }

        if (!response.ok) {
          throw new AIError(`Không thể tải tài liệu (HTTP ${response.status})`, AIErrorCode.AI_PROVIDER_ERROR, 502);
        }

        // Validate content-length header if present
        const contentLength = response.headers.get("content-length");
        if (contentLength && parseInt(contentLength, 10) > this.maxSize) {
          throw new AIError(`Tài liệu báo cáo kích thước vượt quá giới hạn (${Math.round(this.maxSize / 1024 / 1024)}MB)`, AIErrorCode.AI_INVALID_INPUT, 413);
        }

        // Read stream manually to enforce max size on the fly
        if (!response.body) {
           throw new AIError("Không thể đọc luồng dữ liệu (Stream trống)", AIErrorCode.AI_PROVIDER_ERROR, 502);
        }
        
        const reader = response.body.getReader();
        const chunks = [];
        let bytesReceived = 0;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          bytesReceived += value.length;
          if (bytesReceived > this.maxSize) {
            controller.abort(); // Cancel the request
            throw new AIError(`Tài liệu thực tế vượt quá giới hạn kích thước cho phép (${Math.round(this.maxSize / 1024 / 1024)}MB)`, AIErrorCode.AI_INVALID_INPUT, 413);
          }
          chunks.push(value);
        }

        return Buffer.concat(chunks);
      }
      
      throw new AIError("Quá nhiều vòng lặp chuyển hướng", AIErrorCode.AI_PROVIDER_ERROR, 502);
    } catch (error) {
      if (error.name === "AbortError" || error.code === "UND_ERR_ABORTED") {
        if (error.message && error.message.includes("kích thước")) {
           throw error; // Re-throw size limit error
        }
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

  async extractPdf(buffer) {
    let parser;

    try {
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new AIError("File PDF rỗng hoặc không hợp lệ.", AIErrorCode.AI_INVALID_INPUT, 415);
      }
      
      // Basic magic bytes check for PDF (%PDF)
      if (buffer.length < 4 || buffer.toString('utf8', 0, 4) !== '%PDF') {
        throw new AIError("Định dạng file không phải là PDF hợp lệ.", AIErrorCode.AI_INVALID_INPUT, 415);
      }

      if (this.pdfParserFactory) {
        parser = this.pdfParserFactory(buffer);
      } else {
        // S4-FIX-08: Polyfill DOMMatrix for pdf-parse runtime regression
        if (typeof global.DOMMatrix === "undefined") {
          global.DOMMatrix = class DOMMatrix {
            constructor() { return [1, 0, 0, 1, 0, 0]; }
          };
        }
        const { PDFParse } = require("pdf-parse");
        parser = new PDFParse({ data: buffer });
      }

      const result = await parser.getText();
      return this.cleanText(result.text);
    } catch (error) {
      if (error instanceof AIError) throw error;

      console.error("[LessonContentExtractor] Lỗi phân tích file PDF:", error.message);
      throw new AIError("Lỗi phân tích file PDF. File có thể bị hỏng hoặc không đúng định dạng.", AIErrorCode.AI_INVALID_INPUT, 415);
    } finally {
      if (parser) {
        try {
          if (typeof parser.destroy === 'function') {
            await parser.destroy();
          } else if (typeof parser.close === 'function') {
             await parser.close();
          }
        } catch (destroyError) {
          console.error("[LessonContentExtractor] Không thể giải phóng PDF parser:", destroyError.message);
        }
      }
    }
  }

  /**
   * Extract text from DOCX buffer
   */
  async extractDocx(buffer) {
    try {
      if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
        throw new AIError("File DOCX rỗng hoặc không hợp lệ.", AIErrorCode.AI_INVALID_INPUT, 415);
      }

      // Basic magic bytes check for DOCX (PK)
      if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
        throw new AIError("Định dạng file không phải là DOCX hợp lệ.", AIErrorCode.AI_INVALID_INPUT, 415);
      }

      const result = await mammoth.extractRawText({ buffer });
      return this.cleanText(result.value);
    } catch (error) {
      if (error instanceof AIError) throw error;

      console.error("[LessonContentExtractor] Lỗi phân tích file DOCX:", error.message);
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
      const attachmentsToProcess = lesson.attachments.slice(0, this.maxAttachments);
      if (lesson.attachments.length > this.maxAttachments) {
         warnings.push(`Chỉ xử lý tối đa ${this.maxAttachments} tài liệu đính kèm. Bỏ qua các file còn lại.`);
      }

      for (const attachment of attachmentsToProcess) {
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

    // Gỡ bỏ hard limit maxChars 50,000 ở đây vì đã được check ở Service gọi bằng AIInputBudget.validateTextBudget

    return { text: extractedText, warnings };
  }
}

export default new LessonContentExtractorService();
