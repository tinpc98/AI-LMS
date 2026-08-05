import React, { useMemo } from "react";
import DOMPurify, { type Config } from "dompurify";

interface SafeHTMLProps {
  html?: string | null;
  className?: string;
  style?: React.CSSProperties;
  fallbackText?: string;
}

const DOMPURIFY_CONFIG: Config = {
  ALLOWED_TAGS: [
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
    "span",
    "div",
  ],
  ALLOWED_ATTR: ["href", "target", "rel", "colspan", "rowspan", "class"],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "img", "input", "form"],
  FORBID_ATTR: ["style", "onerror", "onload", "onclick", "onmouseover"],
};

// Đảm bảo tất cả liên kết ngoài đều có target="_blank" và rel="noopener noreferrer"
DOMPurify.addHook("afterSanitizeAttributes", (node) => {
  if (node.tagName === "A") {
    node.setAttribute("target", "_blank");
    node.setAttribute("rel", "noopener noreferrer");
  }
});

export const SafeHTML: React.FC<SafeHTMLProps> = ({
  html,
  className = "",
  style,
  fallbackText = "",
}) => {
  const cleanHtml = useMemo(() => {
    if (!html || !html.trim()) {
      return "";
    }

    const raw = html.trim();
    // Tương thích ngược: Nếu là text thuần không chứa thẻ HTML, chuyển đổi newline thành <br />
    const isHtml = /<[a-z][\s\S]*>/i.test(raw);
    const contentToSanitize = isHtml
      ? raw
      : raw.replace(/\n/g, "<br />");

    return DOMPurify.sanitize(contentToSanitize, DOMPURIFY_CONFIG);
  }, [html]);

  if (!cleanHtml) {
    if (fallbackText) {
      return (
        <span className={`text-on-surface-variant italic ${className}`} style={style}>
          {fallbackText}
        </span>
      );
    }
    return null;
  }

  return (
    <div
      className={`prose prose-slate max-w-none break-words ${className}`}
      style={style}
      dangerouslySetInnerHTML={{ __html: cleanHtml }}
    />
  );
};

export default SafeHTML;
