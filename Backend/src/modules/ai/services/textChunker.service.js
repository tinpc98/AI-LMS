import crypto from "crypto";

class TextChunkerService {
  /**
   * Chuẩn hóa text: NFC, bỏ ký tự null, trim
   */
  cleanText(text) {
    if (!text || typeof text !== "string") return "";
    return text
      .normalize("NFC")
      .replace(/\0/g, "") // Loại bỏ null characters
      .trim();
  }

  /**
   * Tạo hash SHA-256 cho content
   */
  hashContent(content) {
    if (!content) return "";
    return crypto.createHash("sha256").update(content).digest("hex");
  }

  /**
   * Chia tài liệu thành các chunks có overlap
   */
  chunkText(text, maxChars = 2400, overlapChars = 300) {
    const cleaned = this.cleanText(text);
    if (!cleaned) return [];

    const effectiveMaxChars = Math.max(100, maxChars);
    const effectiveOverlap = Math.min(overlapChars, Math.floor(effectiveMaxChars / 2));

    // Bước 1: Chia nhỏ segments (đảm bảo không segment nào vượt quá effectiveMaxChars)
    // Ưu tiên chia theo: Paragraph -> Line -> Sentence -> Hard limit
    const paragraphs = cleaned.split(/\n\s*\n/);
    let segments = [];

    for (const p of paragraphs) {
      if (p.length <= effectiveMaxChars) {
        segments.push(p);
      } else {
        const lines = p.split(/\n/);
        for (const line of lines) {
          if (line.length <= effectiveMaxChars) {
            segments.push(line);
          } else {
            // Chia theo câu
            const sentences = line.split(/(?<=[.!?])\s+/);
            for (const s of sentences) {
              if (s.length <= effectiveMaxChars) {
                segments.push(s);
              } else {
                // Hard split (cắt cứng)
                let currentPos = 0;
                while (currentPos < s.length) {
                  segments.push(s.slice(currentPos, currentPos + effectiveMaxChars));
                  currentPos += effectiveMaxChars;
                }
              }
            }
          }
        }
      }
    }

    segments = segments.map((s) => s.trim()).filter((s) => s.length > 0);

    if (segments.length === 0) return [];

    // Bước 2: Ghép segments thành chunks với overlap
    const chunks = [];
    let currentChunk = "";

    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];

      if (currentChunk.length === 0) {
        currentChunk = seg;
      } else if (currentChunk.length + 1 + seg.length <= effectiveMaxChars) {
        currentChunk += "\n" + seg;
      } else {
        // Đẩy chunk hiện tại vào kết quả
        chunks.push(currentChunk.trim());

        // Tạo chunk mới với overlap
        let overlapText = "";
        if (effectiveOverlap > 0 && currentChunk.length > effectiveOverlap) {
          const tail = currentChunk.slice(-effectiveOverlap);
          const firstSpaceIndex = tail.indexOf(" ");

          if (firstSpaceIndex !== -1) {
            overlapText = tail.slice(firstSpaceIndex + 1).trim();
          } else {
            overlapText = tail;
          }
        } else if (effectiveOverlap > 0) {
          overlapText = currentChunk;
        }

        currentChunk = overlapText ? overlapText + "\n" + seg : seg;

        // Nếu vẫn quá lớn (do seg đã max), bỏ overlap
        if (currentChunk.length > effectiveMaxChars) {
          currentChunk = seg;
        }
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks.filter((c) => c.trim().length > 0);
  }
}

export default new TextChunkerService();
