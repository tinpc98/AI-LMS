import React, { useState, useEffect, useRef } from "react";
import mammoth from "mammoth";
import DOMPurify from "dompurify";
import {
  FileWordOutlined,
  DownloadOutlined,
  ReloadOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
} from "@ant-design/icons";
import { Button, Space, Spin, Tooltip } from "antd";

interface DocxViewerProps {
  url: string;
  title: string;
  onDownload?: () => void;
}

export const DocxViewer: React.FC<DocxViewerProps> = ({ url, title, onDownload }) => {
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [errorType, setErrorType] = useState<"cors" | "corrupt" | "network" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [retryCount, setRetryCount] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchAndConvert = async () => {
      if (!url || !url.trim()) {
        if (isMounted) {
          setErrorType("network");
          setErrorMessage("Đang xác thực quyền truy cập hoặc đường dẫn tệp DOCX chưa sẵn sàng.");
          setLoading(false);
        }
        return;
      }
      try {
        let arrayBuffer: ArrayBuffer;

        try {
          const response = await fetch(url, { method: "GET" });
          if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
          }
          const contentType = response.headers.get("content-type") || "";
          if (contentType.toLowerCase().includes("text/html")) {
            throw new Error("INVALID_CONTENT_TYPE_HTML");
          }
          arrayBuffer = await response.arrayBuffer();
        } catch (fetchErr: unknown) {
          const err = fetchErr as Error;
          if (err.message === "INVALID_CONTENT_TYPE_HTML") {
            throw err;
          }
          const isCorsOrNetwork =
            err.name === "TypeError" ||
            err.message?.includes("Failed to fetch") ||
            err.message?.includes("NetworkError");

          if (isCorsOrNetwork) {
            if (isMounted) {
              setErrorType("cors");
              setErrorMessage(
                "Máy chủ lưu trữ tệp chặn quyền truy cập trực tiếp từ trình duyệt (CORS). Vui lòng tải về máy để xem."
              );
              setLoading(false);
            }
            return;
          }
          throw fetchErr;
        }

        // Chuyển đổi DOCX sang HTML qua mammoth
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const rawHtml = result.value;

        // XSS Protection: Sanitize HTML bằng DOMPurify
        const cleanHtml = DOMPurify.sanitize(rawHtml, {
          ALLOWED_TAGS: [
            "p",
            "b",
            "i",
            "em",
            "strong",
            "a",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "table",
            "thead",
            "tbody",
            "tr",
            "th",
            "td",
            "ul",
            "ol",
            "li",
            "span",
            "br",
            "hr",
            "blockquote",
            "img",
            "pre",
            "code",
          ],
          ALLOWED_ATTR: ["href", "target", "src", "alt", "title", "class", "style"],
        });

        if (isMounted) {
          setHtmlContent(cleanHtml || "<p>Tài liệu không có nội dung văn bản hiển thị.</p>");
          setLoading(false);
        }
      } catch (err: unknown) {
        console.error("[DocxViewer] Lỗi khi nạp và chuyển đổi tệp Word (.docx):", err);
        if (isMounted) {
          setLoading(false);
          setErrorType("corrupt");
          setErrorMessage(
            "Không đọc được tệp. Tệp có thể đã hỏng hoặc chưa tải lên hoàn tất."
          );
        }
      }
    };

    fetchAndConvert();

    return () => {
      isMounted = false;
    };
  }, [url, retryCount]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  if (errorType) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-surface border border-outline-variant rounded-2xl text-center min-h-[450px]">
        <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-4">
          <FileWordOutlined style={{ fontSize: 32 }} />
        </div>
        <h3 className="text-lg font-bold text-on-surface mb-2">
          {errorType === "cors"
            ? "Không thể xem trước trực tiếp (CORS)"
            : "Không thể chuyển đổi tệp Word (.docx)"}
        </h3>
        <p className="text-sm text-secondary max-w-md mb-6">{errorMessage}</p>

        <Space size={12}>
          <Button icon={<ReloadOutlined />} onClick={() => { setLoading(true); setErrorType(null); setRetryCount((c) => c + 1); }}>
            Thử lại
          </Button>
          {onDownload && (
            <Button type="primary" icon={<DownloadOutlined />} onClick={onDownload}>
              Tải file về máy
            </Button>
          )}
        </Space>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="flex flex-col bg-surface-container-lowest border border-outline-variant rounded-2xl overflow-hidden shadow-sm"
      style={{ height: isFullscreen ? "100vh" : "calc(100vh - 210px)", minHeight: "550px" }}
    >
      {/* Toolbar điều khiển */}
      <div className="flex items-center justify-between px-4 py-3 bg-surface border-b border-outline-variant select-none">
        <div className="flex items-center space-x-2">
          <FileWordOutlined style={{ color: "var(--color-action-primary-bg)", fontSize: 18 }} />
          <span className="text-xs font-semibold text-on-surface truncate max-w-xs sm:max-w-md">
            {title}
          </span>
        </div>

        <div className="flex items-center space-x-2">
          {onDownload && (
            <Tooltip title="Tải tệp Word">
              <Button size="small" icon={<DownloadOutlined />} onClick={onDownload} />
            </Tooltip>
          )}
          <Tooltip title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}>
            <Button
              size="small"
              icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
              onClick={toggleFullscreen}
            />
          </Tooltip>
        </div>
      </div>

      {/* Nội dung tài liệu HTML render */}
      <div className="flex-1 overflow-y-auto p-6 sm:p-12 bg-white flex justify-center">
        {loading ? (
          <div className="flex flex-col items-center justify-center my-auto p-8 space-y-4">
            <Spin size="large" />
            <p className="text-xs text-secondary">Đang chuyển đổi nội dung văn bản Word...</p>
          </div>
        ) : (
          <article
            className="prose max-w-3xl w-full text-on-surface leading-relaxed font-sans text-sm sm:text-base space-y-4"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        )}
      </div>
    </div>
  );
};

export default DocxViewer;
