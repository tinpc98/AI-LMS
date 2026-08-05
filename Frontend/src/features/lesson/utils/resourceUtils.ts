import { isYouTubeUrl } from "../../../shared/utils/youtube";
import type { ILearningMaterial } from "../../../types/learningMaterial";

export type ResourceKind =
  | "youtube"
  | "video"
  | "pdf"
  | "docx"
  | "slide"
  | "excel"
  | "zip"
  | "image"
  | "link"
  | "other";

export interface ResourceClassification {
  kind: ResourceKind;
  isYouTube: boolean;
  label: string;
}

/**
 * Phân loại tài liệu học tập theo thứ tự ưu tiên dữ liệu:
 * 1. format (chính xác từ backend/magic bytes)
 * 2. Đuôi của originalFilename (tên file gốc khi upload)
 * 3. type do người dùng chọn khi tạo
 * 4. Đuôi của url (chỉ dùng cho liên kết ngoài)
 */
export function classifyResource(
  item: Partial<ILearningMaterial> | null | undefined
): ResourceClassification {
  if (!item) {
    return { kind: "other", isYouTube: false, label: "Tài liệu" };
  }

  // 1. Lấy format hoặc trích xuất đuôi từ originalFilename
  const formatLower = (item.format || "").toLowerCase().replace(/^\./, "");
  const nameExt =
    item.originalFilename && item.originalFilename.includes(".")
      ? item.originalFilename.split(".").pop()?.toLowerCase() || ""
      : "";
  const effectiveFormat = formatLower || nameExt;

  const urlLower = (item.url || "").toLowerCase();
  const typeLower = (item.type || "").toLowerCase();

  // 1. YouTube
  if (isYouTubeUrl(item.url)) {
    return { kind: "youtube", isYouTube: true, label: "Video YouTube" };
  }

  // 2. PDF (Ưu tiên format/tên file trước)
  if (
    effectiveFormat === "pdf" ||
    urlLower.endsWith(".pdf") ||
    (!effectiveFormat && typeLower === "pdf")
  ) {
    return { kind: "pdf", isYouTube: false, label: "Tài liệu PDF" };
  }

  // 3. DOCX / Word
  if (
    ["docx", "doc"].includes(effectiveFormat) ||
    urlLower.endsWith(".docx") ||
    urlLower.endsWith(".doc") ||
    (!effectiveFormat && (typeLower === "word" || typeLower === "docx"))
  ) {
    return { kind: "docx", isYouTube: false, label: "Văn bản Word (.docx)" };
  }

  // 4. Excel / Spreadsheet
  if (
    ["xlsx", "xls", "csv"].includes(effectiveFormat) ||
    urlLower.endsWith(".xlsx") ||
    urlLower.endsWith(".xls") ||
    urlLower.endsWith(".csv") ||
    (!effectiveFormat && typeLower === "excel")
  ) {
    return { kind: "excel", isYouTube: false, label: "Bảng tính Excel" };
  }

  // 5. PowerPoint / Slide
  if (
    ["pptx", "ppt"].includes(effectiveFormat) ||
    urlLower.endsWith(".pptx") ||
    urlLower.endsWith(".ppt") ||
    (!effectiveFormat && (typeLower === "slide" || typeLower === "powerpoint"))
  ) {
    return { kind: "slide", isYouTube: false, label: "Bài trình chiếu PowerPoint" };
  }

  // 6. Video tệp (mp4, webm, mov...)
  if (
    ["mp4", "webm", "mov", "mkv", "avi"].includes(effectiveFormat) ||
    urlLower.endsWith(".mp4") ||
    urlLower.endsWith(".webm") ||
    urlLower.endsWith(".mov") ||
    typeLower === "video"
  ) {
    return { kind: "video", isYouTube: false, label: "Video bài giảng" };
  }

  // 7. Hình ảnh
  if (
    ["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(effectiveFormat) ||
    urlLower.endsWith(".jpg") ||
    urlLower.endsWith(".jpeg") ||
    urlLower.endsWith(".png") ||
    urlLower.endsWith(".webp") ||
    urlLower.endsWith(".gif") ||
    typeLower === "image"
  ) {
    return { kind: "image", isYouTube: false, label: "Hình ảnh" };
  }

  // 8. Tệp nén ZIP / RAR
  if (
    ["zip", "rar", "7z", "tar", "gz"].includes(effectiveFormat) ||
    urlLower.endsWith(".zip") ||
    urlLower.endsWith(".rar") ||
    urlLower.endsWith(".7z") ||
    typeLower === "zip"
  ) {
    return { kind: "zip", isYouTube: false, label: "Tệp nén" };
  }

  // 9. Liên kết ngoài
  if (typeLower === "link" || urlLower.startsWith("http")) {
    return { kind: "link", isYouTube: false, label: "Liên kết ngoài" };
  }

  // Fallback mặc định
  return { kind: "other", isYouTube: false, label: item.type || "Tài liệu" };
}

/**
 * Tải file an toàn về máy người dùng
 */
export async function triggerFileDownload(downloadUrl: string, filename?: string): Promise<void> {
  if (!downloadUrl) {
    throw new Error("Tài liệu không có đường dẫn URL hợp lệ để tải về.");
  }

  try {
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error(`Lỗi khi tải file: HTTP ${response.status}`);
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = blobUrl;
    if (filename) {
      a.download = filename;
    }
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(a);
  } catch (err: unknown) {
    // Fallback: Mở tab hoặc trigger download trực tiếp qua link ngoài
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = downloadUrl;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    if (filename) {
      a.download = filename;
    }
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}
