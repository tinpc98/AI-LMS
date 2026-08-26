import { v4 as uuidv4 } from "uuid";
import type { ContentBlock } from "./question.types";

// TÍNH NĂNG MỚI: trích văn bản thuần từ ContentBlock[] — dùng cho các nơi CHỈ hiển thị/tìm kiếm
// bằng chuỗi đơn giản (bảng danh sách, ô tìm kiếm, form soạn thảo rút gọn). KHÔNG dùng để hiển
// thị nội dung đầy đủ cho học sinh — chỗ đó phải dùng <ContentRenderer /> để không mất công thức/
// ảnh. Đây là điểm rút gọn có chủ đích: form soạn câu hỏi trong Ngân hàng đề chỉ hỗ trợ văn bản
// thuần, không có trình soạn công thức/ảnh (khác form soạn Practice Quiz ở mục 1).
export const extractPlainText = (blocks: ContentBlock[] | undefined | null): string => {
  if (!blocks || blocks.length === 0) return "";
  return blocks
    .filter((b): b is Extract<ContentBlock, { type: "TEXT" }> => b.type === "TEXT")
    .sort((a, b) => a.order - b.order)
    .map((b) => b.text)
    .join("\n");
};

/** Bọc 1 chuỗi văn bản thuần thành ContentBlock[] hợp lệ để gửi lên backend. */
export const wrapPlainText = (text: string): ContentBlock[] => {
  const trimmed = text.trim();
  if (!trimmed) return [];
  return [{ id: uuidv4(), type: "TEXT", order: 0, text: trimmed }];
};
