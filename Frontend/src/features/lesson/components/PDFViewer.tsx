import React, { useState, useEffect, useRef, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import type { RenderTask } from "pdfjs-dist/types/src/display/api";
import {
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  FullscreenExitOutlined,
  DownloadOutlined,
  SearchOutlined,
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  LockOutlined,
  FilePdfOutlined,
  CloseOutlined,
} from "@ant-design/icons";
import { Button, Input, Progress, Modal, Space, Tooltip, Spin } from "antd";

// Cấu hình worker chuẩn của pdfjs-dist cho môi trường Vite / Webpack
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.mjs",
  import.meta.url
).toString();

interface PDFViewerProps {
  url: string;
  title: string;
  onDownload?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ url, title, onDownload }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<{ [pageNum: number]: HTMLCanvasElement | null }>({});

  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Trạng thái tải và tiến trình
  const [loading, setLoading] = useState<boolean>(true);
  const [loadProgress, setLoadProgress] = useState<number>(0);
  const [errorType, setErrorType] = useState<"cors" | "corrupt" | "network" | "other" | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [retryKey, setRetryKey] = useState<number>(0);

  // Mật khẩu
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>("");
  const passwordCallbackRef = useRef<((password: string) => void) | null>(null);

  // Tìm kiếm trong PDF (Bước 5)
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState<number>(0);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  // Quản lý tác vụ render canvas để hủy khi thay đổi zoom/page
  const renderTasksRef = useRef<{ [pageNum: number]: RenderTask | null }>({});

  // 1. Tải tài liệu PDF
  useEffect(() => {
    let isMounted = true;
    const currentRenderTasks = renderTasksRef.current;

    const fetchAndLoad = async () => {
      if (!url || !url.trim()) {
        if (isMounted) {
          setErrorType("network");
          setErrorMessage("Đang xác thực quyền truy cập hoặc đường dẫn tệp PDF chưa sẵn sàng.");
          setLoading(false);
        }
        return;
      }
      try {
        let pdfData: Uint8Array | ArrayBuffer | string = url;

        // Fetch ArrayBuffer để bắt lỗi CORS và đo tiến trình chính xác
        try {
          const response = await fetch(url, { method: "GET" });
          if (!response.ok) {
            throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
          }
          const contentType = response.headers.get("content-type") || "";
          if (contentType.toLowerCase().includes("text/html")) {
            throw new Error("INVALID_CONTENT_TYPE_HTML");
          }
          const buffer = await response.arrayBuffer();
          pdfData = buffer;
          if (isMounted) setLoadProgress(60);
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
                "Máy chủ lưu trữ tệp chặn quyền truy cập trực tiếp từ trình duyệt (CORS). Vui lòng sử dụng tính năng tải về để xem."
              );
              setLoading(false);
            }
            return;
          }
          throw fetchErr;
        }

        const loadingTask = pdfjsLib.getDocument({
          data: pdfData instanceof ArrayBuffer ? new Uint8Array(pdfData) : undefined,
          url: typeof pdfData === "string" ? pdfData : undefined,
          cMapUrl: "https://unpkg.com/pdfjs-dist@4.10.38/cmaps/",
          cMapPacked: true,
        });

        loadingTask.onProgress = (progressData: { loaded: number; total: number }) => {
          if (isMounted && progressData.total > 0) {
            const percent = Math.min(95, Math.round((progressData.loaded / progressData.total) * 100));
            setLoadProgress(percent);
          }
        };

        loadingTask.onPassword = (callback: (password: string) => void) => {
          if (isMounted) {
            passwordCallbackRef.current = callback;
            setIsPasswordModalOpen(true);
          }
        };

        const loadedDoc = await loadingTask.promise;
        if (isMounted) {
          setPdfDoc(loadedDoc);
          setNumPages(loadedDoc.numPages);
          setCurrentPage(1);
          setLoadProgress(100);
          setLoading(false);

          // Tự động tính scale vừa vặn khung hình ban đầu
          try {
            const page1 = await loadedDoc.getPage(1);
            const baseVp = page1.getViewport({ scale: 1 });
            if (containerRef.current && baseVp.width > 0) {
              const availableWidth = containerRef.current.clientWidth - 48;
              const initialScale = Math.max(0.5, Math.min(2.5, availableWidth / baseVp.width));
              setScale(+initialScale.toFixed(2));
            }
          } catch {
            // Fallback giữ nguyên scale mặc định
          }
        }
      } catch (err: unknown) {
        console.error("[PDFViewer] Lỗi khi nạp tài liệu PDF:", err);
        if (isMounted) {
          const error = err as Error;
          setLoading(false);
          if (error.name === "PasswordException") {
            setIsPasswordModalOpen(true);
          } else if (
            error.message === "INVALID_CONTENT_TYPE_HTML" ||
            error.name === "InvalidPDFException" ||
            error.message?.includes("Invalid PDF")
          ) {
            setErrorType("corrupt");
            setErrorMessage("Không đọc được tệp. Tệp có thể đã hỏng hoặc chưa tải lên hoàn tất.");
          } else if (error.message?.includes("CORS") || error.name === "TypeError") {
            setErrorType("cors");
            setErrorMessage(
              "Tệp tài liệu nằm trên máy chủ ngoài chặn quyền truy cập (CORS). Vui lòng tải về máy để xem nội dung đầy đủ."
            );
          } else {
            setErrorType("other");
            setErrorMessage("Không đọc được tệp. Tệp có thể đã hỏng hoặc chưa tải lên hoàn tất.");
          }
        }
      }
    };

    fetchAndLoad();

    return () => {
      isMounted = false;
      Object.values(currentRenderTasks).forEach((task) => {
        if (task && typeof task.cancel === "function") {
          task.cancel();
        }
      });
    };
  }, [url, retryKey]);

  // Cleanup PDF document proxy on unmount
  useEffect(() => {
    return () => {
      if (pdfDoc) {
        pdfDoc.cleanup();
      }
    };
  }, [pdfDoc]);

  // 2. Render từng trang PDF lên Canvas
  const renderPage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc) return;
      const canvas = canvasRefs.current[pageNumber];
      if (!canvas) return;

      // Hủy task cũ nếu đang render dở
      if (renderTasksRef.current[pageNumber]) {
        renderTasksRef.current[pageNumber]?.cancel();
      }

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const viewport = page.getViewport({ scale });

        const context = canvas.getContext("2d");
        if (!context) return;

        // Xử lý độ sắc nét trên màn hình Retina / HiDPI (giới hạn dpr tối đa 2 để tối ưu bộ nhớ)
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.floor(viewport.width * dpr);
        canvas.height = Math.floor(viewport.height * dpr);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null;

        const renderContext = {
          canvasContext: context,
          canvas: canvas,
          transform: transform || undefined,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTasksRef.current[pageNumber] = renderTask;
        await renderTask.promise;
      } catch (err: unknown) {
        const error = err as Error;
        if (error.name !== "RenderingCancelledException") {
          console.warn(`Lỗi render trang ${pageNumber}:`, error);
        }
      }
    },
    [pdfDoc, scale]
  );

  // Render tất cả các trang theo tỉ lệ zoom hiện tại
  useEffect(() => {
    if (!pdfDoc || numPages === 0) return;
    for (let i = 1; i <= numPages; i++) {
      renderPage(i);
    }
  }, [pdfDoc, numPages, scale, renderPage]);

  // 3. ResizeObserver theo dõi kích thước container (thu gọn sidebar, resize cửa sổ)
  useEffect(() => {
    if (!containerRef.current) return;

    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const observer = new ResizeObserver(() => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (pdfDoc && numPages > 0) {
          for (let i = 1; i <= numPages; i++) {
            renderPage(i);
          }
        }
      }, 200);
    });

    observer.observe(containerRef.current);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      observer.disconnect();
    };
  }, [pdfDoc, numPages, renderPage]);

  // 4. Xử lý Zoom & Fullscreen
  const handleZoomIn = () => setScale((prev) => Math.min(3.0, +(prev + 0.2).toFixed(1)));
  const handleZoomOut = () => setScale((prev) => Math.max(0.4, +(prev - 0.2).toFixed(1)));
  
  const handleFitWidth = async () => {
    if (!pdfDoc || !containerRef.current) return;
    try {
      const page1 = await pdfDoc.getPage(1);
      const baseViewport = page1.getViewport({ scale: 1 });
      const containerWidth = containerRef.current.clientWidth - 48;
      if (baseViewport.width > 0 && containerWidth > 0) {
        const targetScale = Math.max(0.4, Math.min(3.0, containerWidth / baseViewport.width));
        setScale(+targetScale.toFixed(2));
      }
    } catch (err) {
      console.warn("Lỗi tính vừa khung:", err);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true));
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false));
    }
  };

  // 4. Tìm kiếm nội dung văn bản (Bước 5)
  const handleSearch = async () => {
    if (!pdfDoc || !searchQuery.trim()) {
      setSearchMatches([]);
      return;
    }

    setIsSearching(true);
    const matches: number[] = [];
    const queryLower = searchQuery.toLowerCase().trim();

    try {
      for (let i = 1; i <= pdfDoc.numPages; i++) {
        const page = await pdfDoc.getPage(i);
        const textContent = await page.getTextContent();
        const textItems = textContent.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ");
        if (textItems.toLowerCase().includes(queryLower)) {
          matches.push(i);
        }
      }
      setSearchMatches(matches);
      setCurrentMatchIndex(0);
      if (matches.length > 0) {
        scrollToPage(matches[0]);
      }
    } catch (err) {
      console.warn("Lỗi trích xuất văn bản khi tìm kiếm:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const scrollToPage = (pageNum: number) => {
    setCurrentPage(pageNum);
    const canvas = canvasRefs.current[pageNum];
    if (canvas) {
      canvas.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIdx = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIdx);
    scrollToPage(searchMatches[nextIdx]);
  };

  const handlePrevMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIdx = (currentMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentMatchIndex(prevIdx);
    scrollToPage(searchMatches[prevIdx]);
  };

  // 5. Submit Mật khẩu
  const handlePasswordSubmit = () => {
    if (passwordCallbackRef.current && passwordInput) {
      passwordCallbackRef.current(passwordInput);
      setIsPasswordModalOpen(false);
      setPasswordInput("");
    }
  };

  // Trạng thái Lỗi
  if (errorType) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-surface border border-outline-variant rounded-2xl text-center min-h-[450px]">
        <div className="w-16 h-16 rounded-2xl bg-error/10 text-error flex items-center justify-center mb-4">
          <FilePdfOutlined style={{ fontSize: 32 }} />
        </div>
        <h3 className="text-lg font-bold text-on-surface mb-2">
          {errorType === "cors"
            ? "Không thể xem trước trực tiếp (CORS)"
            : errorType === "corrupt"
              ? "Tệp không hợp lệ hoặc đã hỏng"
              : "Không tải được tài liệu PDF"}
        </h3>
        <p className="text-sm text-secondary max-w-md mb-6">{errorMessage}</p>

        <Space size={12}>
          <Button
            icon={<ReloadOutlined />}
            onClick={() => {
              setLoading(true);
              setErrorType(null);
              setRetryKey((k) => k + 1);
            }}
          >
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
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-surface border-b border-outline-variant select-none">
        {/* Navigation & Info */}
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex items-center space-x-1.5 mr-2">
            <FilePdfOutlined style={{ color: "var(--color-error-base)", fontSize: 16 }} />
            <span className="text-xs font-semibold text-on-surface truncate max-w-[160px] md:max-w-xs" title={title}>
              {title}
            </span>
          </div>
          <Button
            size="small"
            icon={<LeftOutlined />}
            disabled={currentPage <= 1}
            onClick={() => scrollToPage(currentPage - 1)}
          />
          <span className="text-xs font-semibold text-on-surface px-2">
            Trang {currentPage} / {numPages || 1}
          </span>
          <Button
            size="small"
            icon={<RightOutlined />}
            disabled={currentPage >= numPages}
            onClick={() => scrollToPage(currentPage + 1)}
          />
        </div>

        {/* Zoom & Display controls */}
        <div className="flex items-center space-x-1.5">
          <Tooltip title="Thu nhỏ">
            <Button size="small" icon={<ZoomOutOutlined />} onClick={handleZoomOut} />
          </Tooltip>
          <span className="text-xs font-medium text-secondary px-1 min-w-[45px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Tooltip title="Phóng to">
            <Button size="small" icon={<ZoomInOutlined />} onClick={handleZoomIn} />
          </Tooltip>
          <Tooltip title="Vừa chiều rộng">
            <Button size="small" onClick={handleFitWidth} className="text-xs">
              Vừa khung
            </Button>
          </Tooltip>
        </div>

        {/* Actions (Search, Download, Fullscreen) */}
        <div className="flex items-center space-x-2">
          <Tooltip title="Tìm kiếm văn bản">
            <Button
              size="small"
              icon={<SearchOutlined />}
              type={showSearch ? "primary" : "default"}
              onClick={() => setShowSearch(!showSearch)}
            />
          </Tooltip>

          {onDownload && (
            <Tooltip title="Tải tệp PDF">
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

      {/* Thanh tìm kiếm văn bản (Search Bar) */}
      {showSearch && (
        <div className="flex items-center justify-between px-4 py-2 bg-surface-container-high border-b border-outline-variant transition-all">
          <div className="flex items-center space-x-2 flex-1 max-w-md">
            <Input
              size="small"
              placeholder="Nhập từ khóa tìm trong tài liệu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={handleSearch}
              allowClear
            />
            <Button size="small" type="primary" loading={isSearching} onClick={handleSearch}>
              Tìm
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            {searchMatches.length > 0 ? (
              <div className="flex items-center space-x-1.5 text-xs text-secondary">
                <span>
                  Khớp {currentMatchIndex + 1}/{searchMatches.length} (Trang {searchMatches[currentMatchIndex]})
                </span>
                <Button size="small" icon={<LeftOutlined />} onClick={handlePrevMatch} />
                <Button size="small" icon={<RightOutlined />} onClick={handleNextMatch} />
              </div>
            ) : searchQuery && !isSearching ? (
              <span className="text-xs text-secondary">Không tìm thấy</span>
            ) : null}
            <Button
              size="small"
              type="text"
              icon={<CloseOutlined />}
              onClick={() => setShowSearch(false)}
            />
          </div>
        </div>
      )}

      {/* Vùng hiển thị tài liệu PDF */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-surface-container-low flex flex-col items-center gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center my-auto p-8 space-y-4">
            <Spin size="large" />
            <div className="w-64">
              <Progress percent={loadProgress} size="small" status="active" showInfo={false} />
              <p className="text-xs text-secondary text-center mt-2">
                Đang chuẩn bị trang tài liệu ({loadProgress}%)...
              </p>
            </div>
          </div>
        ) : (
          Array.from({ length: numPages }, (_, index) => {
            const pageNum = index + 1;
            const isMatchPage = searchMatches.includes(pageNum);

            return (
              <div
                key={pageNum}
                className={`relative bg-white shadow-sm border border-outline-variant/60 rounded-md transition-shadow ${
                  isMatchPage ? "ring-2 ring-primary ring-offset-2" : ""
                }`}
                style={{
                  width: "fit-content",
                  margin: "0 auto",
                }}
              >
                <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/50 text-white rounded text-[10px] pointer-events-none z-10 font-mono">
                  {pageNum}
                </div>
                <canvas
                  ref={(el) => {
                    canvasRefs.current[pageNum] = el;
                  }}
                  style={{ display: "block" }}
                />
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nhập mật khẩu PDF */}
      <Modal
        title={
          <Space>
            <LockOutlined style={{ color: "var(--color-warning-base)" }} />
            <span>Tài liệu được bảo vệ bằng mật khẩu</span>
          </Space>
        }
        open={isPasswordModalOpen}
        onOk={handlePasswordSubmit}
        onCancel={() => setIsPasswordModalOpen(false)}
        okText="Mở tài liệu"
        cancelText="Hủy"
        destroyOnClose
      >
        <p className="text-sm text-secondary mb-3">
          Tệp PDF này yêu cầu mật khẩu để mở khóa và xem nội dung:
        </p>
        <Input.Password
          placeholder="Nhập mật khẩu..."
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          onPressEnter={handlePasswordSubmit}
        />
      </Modal>
    </div>
  );
};

export default PDFViewer;
