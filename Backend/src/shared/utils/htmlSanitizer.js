import sanitizeHtml from "sanitize-html";

/**
 * Cấu hình whitelist nghiêm ngặt cho trình soạn thảo rich text (WYSIWYG)
 */
const SANITIZE_OPTIONS = {
  allowedTags: [
    "p",
    "br",
    "strong",
    "b",
    "em",
    "i",
    "u",
    "s",
    "strike",
    "h1",
    "h2",
    "h3",
    "h4",
    "ul",
    "ol",
    "li",
    "blockquote",
    "code",
    "pre",
    "table",
    "thead",
    "tbody",
    "tr",
    "th",
    "td",
    "a",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
    th: ["colspan", "rowspan"],
    td: ["colspan", "rowspan"],
  },
  allowedSchemes: ["http", "https", "mailto"],
  allowedSchemesByTag: {
    a: ["http", "https", "mailto"],
  },
  // Tự động thêm rel="noopener noreferrer" cho tất cả thẻ <a>
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
  },
  // Loại bỏ hoàn toàn nội dung bên trong các thẻ nguy hiểm
  nonTextTags: ["script", "style", "textarea", "option", "noscript", "iframe", "object", "embed"],
};

/**
 * Hàm sanitize chuỗi HTML trước khi lưu vào Database
 * @param {string} dirtyHtml
 * @returns {string}
 */
export function sanitizeRichText(dirtyHtml) {
  if (!dirtyHtml || typeof dirtyHtml !== "string") {
    return "";
  }

  // 1. Loại bỏ các chuỗi data:image/ hoặc base64 image nếu có lọt vào
  let preProcessed = dirtyHtml.replace(/<img[^>]*src=["']data:image\/[^"']+["'][^>]*>/gi, "");
  // Strip bất kỳ thẻ img nào
  preProcessed = preProcessed.replace(/<img[^>]*>/gi, "");

  // 2. Sanitize bằng sanitize-html theo whitelist
  const clean = sanitizeHtml(preProcessed, SANITIZE_OPTIONS);

  return clean.trim();
}

export default sanitizeRichText;
