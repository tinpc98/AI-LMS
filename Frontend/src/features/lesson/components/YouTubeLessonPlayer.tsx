import React, { useEffect, useRef, useState, useCallback } from "react";
import { Button, Space, Typography, Spin, Alert } from "antd";
import {
  ReloadOutlined,
  RightCircleOutlined,
  CheckCircleOutlined,
  ExportOutlined,
  WarningOutlined,
  PlayCircleOutlined,
} from "@ant-design/icons";
import { parseYouTubeUrl } from "../../../shared/utils/youtube";

const { Title, Text, Paragraph } = Typography;

// Declare global YT interface for TypeScript
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

// Singleton script loader for YouTube IFrame API
let isApiLoading = false;
let isApiLoaded = false;
const apiReadyCallbacks: Array<() => void> = [];

function loadYouTubeIframeApi(): Promise<void> {
  if (typeof window !== "undefined" && window.YT && window.YT.Player) {
    isApiLoaded = true;
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    apiReadyCallbacks.push(resolve);

    if (isApiLoading) return;
    isApiLoading = true;

    // Check if script already in document
    const existingScript = document.getElementById("youtube-iframe-api-script");
    if (!existingScript) {
      const tag = document.createElement("script");
      tag.id = "youtube-iframe-api-script";
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      if (firstScriptTag?.parentNode) {
        firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      } else {
        document.head?.appendChild(tag);
      }
    }

    window.onYouTubeIframeAPIReady = () => {
      isApiLoaded = true;
      isApiLoading = false;
      apiReadyCallbacks.forEach((cb) => cb());
      apiReadyCallbacks.length = 0;
    };
  });
}

export interface YouTubeLessonPlayerProps {
  videoUrl?: string;
  lessonTitle?: string;
  hasNextLesson?: boolean;
  onNextLesson?: () => void;
  onVideoEnded?: () => void;
  isCompleted?: boolean;
  onMarkCompleted?: () => void;
}

export const YouTubeLessonPlayer: React.FC<YouTubeLessonPlayerProps> = ({
  videoUrl,
  lessonTitle,
  hasNextLesson = false,
  onNextLesson,
  onVideoEnded,
  isCompleted = false,
  onMarkCompleted,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playerIdRef = useRef<string>(`yt-player-${Math.random().toString(36).substring(2, 9)}`);

  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isEnded, setIsEnded] = useState(false);
  const [errorCode, setErrorCode] = useState<number | null>(null);

  // Parse video ID and timestamp
  const parsedData = parseYouTubeUrl(videoUrl);
  const videoId = parsedData?.videoId;
  const startSeconds = parsedData?.startSeconds;

  // Cleanup player
  const destroyPlayer = useCallback(() => {
    if (playerRef.current) {
      try {
        if (typeof playerRef.current.destroy === "function") {
          playerRef.current.destroy();
        }
      } catch (err) {
        console.error("Error destroying YT player:", err);
      }
      playerRef.current = null;
    }
  }, []);

  // Initialize player
  const initPlayer = useCallback(() => {
    if (!videoId) return;

    destroyPlayer();
    setIsEnded(false);
    setErrorCode(null);
    setIsPlayerReady(false);

    if (!window.YT || !window.YT.Player) {
      console.warn("YouTube API not yet available");
      return;
    }

    try {
      playerRef.current = new window.YT.Player(playerIdRef.current, {
        videoId,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          autoplay: 0, // Không dùng autoplay, người dùng chủ động bấm play
          ...(startSeconds ? { start: startSeconds } : {}),
        },
        events: {
          onReady: () => {
            setIsPlayerReady(true);
          },
          onStateChange: (event: any) => {
            // YT.PlayerState.ENDED is 0
            if (event.data === 0) {
              setIsEnded(true);
              if (onVideoEnded) {
                onVideoEnded();
              }
            } else if (event.data === 1) {
              // Playing: ensure overlay is hidden
              setIsEnded(false);
            }
          },
          onError: (event: any) => {
            console.error("YouTube Player Error:", event.data);
            setErrorCode(event.data);
          },
        },
      });
    } catch (err) {
      console.error("Error initializing YT player:", err);
      setErrorCode(5);
    }
  }, [videoId, startSeconds, onVideoEnded, destroyPlayer]);

  // Load API once and init player
  useEffect(() => {
    let isMounted = true;
    setIsLoadingApi(true);

    loadYouTubeIframeApi().then(() => {
      if (isMounted) {
        setIsLoadingApi(false);
        initPlayer();
      }
    });

    return () => {
      isMounted = false;
      destroyPlayer();
    };
  }, [videoId, initPlayer, destroyPlayer]);

  // Action: Replay video from start
  const handleReplay = () => {
    if (playerRef.current) {
      try {
        playerRef.current.seekTo(startSeconds || 0, true);
        playerRef.current.playVideo();
        setIsEnded(false);
      } catch (err) {
        console.error("Error replaying video:", err);
      }
    }
  };

  // 1. Trường hợp không có URL hoặc URL không thuộc whitelist YouTube
  if (!videoUrl || !videoId) {
    return (
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          backgroundColor: "#1e293b",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
          color: "#fff",
        }}
      >
        <WarningOutlined style={{ fontSize: 42, color: "var(--color-warning-base)", marginBottom: 12 }} />
        <Title level={5} style={{ color: "#fff", margin: "0 0 8px" }}>
          Không thể nhúng video
        </Title>
        <Text style={{ color: "rgba(255, 255, 255, 0.7)", maxWidth: 460, marginBottom: 16 }}>
          {videoUrl
            ? "Đường dẫn video không phải định dạng YouTube hợp lệ hoặc không thuộc danh sách an toàn."
            : "Bài học này chưa được giảng viên đính kèm liên kết video bài giảng."}
        </Text>
        {videoUrl && (
          <Button
            type="primary"
            icon={<ExportOutlined />}
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ borderRadius: 8 }}
          >
            Mở liên kết gốc bên ngoài
          </Button>
        )}
      </div>
    );
  }

  // 2. Trường hợp gặp lỗi từ Player API
  if (errorCode !== null) {
    let errorTitle = "Không thể phát video bài giảng";
    let errorDesc = "Đã xảy ra lỗi khi tải video từ YouTube.";
    let isEmbedRestricted = false;

    if (errorCode === 2) {
      errorTitle = "Tham số video không hợp lệ";
      errorDesc = "Liên kết video YouTube bị sai mã định danh (Video ID).";
    } else if (errorCode === 5) {
      errorTitle = "Lỗi trình phát HTML5";
      errorDesc = "Không thể phát video trong trình duyệt hiện tại. Vui lòng thử tải lại trang.";
    } else if (errorCode === 100) {
      errorTitle = "Video không còn khả dụng";
      errorDesc = "Video bài giảng không tồn tại, đã bị xóa hoặc được đặt ở chế độ riêng tư.";
    } else if (errorCode === 101 || errorCode === 150) {
      isEmbedRestricted = true;
      errorTitle = "Chủ sở hữu đã tắt tính năng nhúng";
      errorDesc =
        "Video này không cho phép phát trực tiếp ngoài website YouTube theo cài đặt bản quyền của tác giả.";
    }

    return (
      <div
        style={{
          width: "100%",
          aspectRatio: "16 / 9",
          backgroundColor: "#0f172a",
          borderRadius: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          textAlign: "center",
          color: "#fff",
        }}
      >
        <Alert
          type={isEmbedRestricted ? "warning" : "error"}
          showIcon
          message={<span style={{ fontWeight: 600, fontSize: 16 }}>{errorTitle}</span>}
          description={
            <div style={{ marginTop: 6 }}>
              <p style={{ margin: "0 0 12px" }}>{errorDesc}</p>
              <Space size={12}>
                <Button
                  type="primary"
                  icon={<ExportOutlined />}
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ borderRadius: 6 }}
                >
                  Mở xem trên YouTube
                </Button>
                <Button
                  onClick={() => {
                    setErrorCode(null);
                    initPlayer();
                  }}
                  style={{ borderRadius: 6 }}
                >
                  Thử tải lại
                </Button>
              </Space>
            </div>
          }
          style={{ maxWidth: 520, borderRadius: 10, textAlign: "left" }}
        />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: "16 / 9",
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#000",
        boxShadow: "0 8px 24px rgba(0,0,0,0.18)",
      }}
    >
      {/* Loading Skeleton */}
      {(isLoadingApi || !isPlayerReady) && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 5,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "#0f172a",
            color: "#fff",
            gap: 12,
          }}
        >
          <Spin size="large" />
          <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 13 }}>
            Đang khởi tạo trình phát video...
          </Text>
        </div>
      )}

      {/* YouTube IFrame Mount Target */}
      <div
        id={playerIdRef.current}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
      />

      {/* Custom End Overlay (Che phủ toàn bộ video khi kết thúc, chặn gợi ý của YouTube) */}
      {isEnded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            backgroundColor: "rgba(15, 23, 42, 0.94)",
            backdropFilter: "blur(6px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            textAlign: "center",
            animation: "fadeIn 0.3s ease",
          }}
        >
          <CheckCircleOutlined
            style={{ fontSize: 48, color: "var(--color-success-base)", marginBottom: 12 }}
          />

          <Title level={4} style={{ color: "#fff", margin: "0 0 6px" }}>
            Bạn đã xem hết bài giảng!
          </Title>

          <Paragraph style={{ color: "rgba(255, 255, 255, 0.75)", maxWidth: 440, fontSize: 13, marginBottom: 20 }}>
            {lessonTitle
              ? `Hoàn thành nội dung "${lessonTitle}". Hãy tiếp tục bài học tiếp theo hoặc xem lại nếu cần.`
              : "Hoàn thành nội dung bài học. Hãy tiếp tục bài học tiếp theo hoặc xem lại nếu cần."}
          </Paragraph>

          <Space size={12} wrap style={{ justifyContent: "center" }}>
            {/* Nút Xem lại */}
            <Button
              size="large"
              icon={<ReloadOutlined />}
              onClick={handleReplay}
              style={{
                borderRadius: 8,
                fontWeight: 600,
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                color: "#fff",
                borderColor: "rgba(255, 255, 255, 0.3)",
              }}
            >
              Xem lại từ đầu
            </Button>

            {/* Nút Đánh dấu hoàn thành */}
            {!isCompleted && onMarkCompleted && (
              <Button
                size="large"
                icon={<CheckCircleOutlined />}
                onClick={onMarkCompleted}
                style={{
                  borderRadius: 8,
                  fontWeight: 600,
                  backgroundColor: "var(--color-success-base)",
                  color: "#fff",
                  borderColor: "var(--color-success-base)",
                }}
              >
                Đánh dấu đã học xong
              </Button>
            )}

            {/* Nút Bài tiếp theo */}
            {hasNextLesson && onNextLesson && (
              <Button
                type="primary"
                size="large"
                icon={<RightCircleOutlined />}
                onClick={onNextLesson}
                style={{ borderRadius: 8, fontWeight: 600 }}
              >
                Bài tiếp theo
              </Button>
            )}
          </Space>
        </div>
      )}
    </div>
  );
};

export default YouTubeLessonPlayer;
