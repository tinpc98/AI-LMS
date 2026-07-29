import React, { useEffect, useRef, useState, useCallback } from "react";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { Spin, Button, Alert, Typography, Space } from "antd";
import {
  CloseOutlined,
  ReloadOutlined,
  WarningOutlined,
  VideoCameraOutlined,
  LockOutlined,
} from "@ant-design/icons";
import type {
  ConferenceStatus,
  JaasConferenceData,
  LiveSessionError,
  JitsiApiLike,
} from "../../types/liveSession";
import { mapMediaError } from "../../utils/liveSessionError";
import envConfig from "../../config/env";

const { Title, Text, Paragraph } = Typography;

export interface LiveRoomModalProps {
  isOpen?: boolean;
  open?: boolean;
  onClose: () => void;
  conference?: JaasConferenceData | null;
  status?: ConferenceStatus;
  error?: LiveSessionError | null;
  onRetry?: () => void;
  onApiReady?: (api: JitsiApiLike) => void;
  onConferenceJoined?: () => void;
  onConferenceLeft?: () => void;
  onError?: (error: LiveSessionError) => void;
  meetingRoomId?: string;
  jwtToken?: string;
  appId?: string;
}

export const buildJaasRoomName = (appId: string, roomName: string): string => {
  const cleanAppId = (appId || "").trim().replace(/\/+$|^\/+/g, "");
  let cleanRoom = (roomName || "").trim().replace(/\/+$|^\/+/g, "");

  if (!cleanRoom) return "";

  // Tránh duplicate appId nếu cleanRoom đã bắt đầu bằng cleanAppId
  if (cleanAppId && cleanRoom.startsWith(`${cleanAppId}/`)) {
    return cleanRoom;
  }

  return cleanAppId ? `${cleanAppId}/${cleanRoom}` : cleanRoom;
};

export const LiveRoomModal: React.FC<LiveRoomModalProps> = ({
  isOpen,
  open,
  onClose,
  conference,
  status = "idle",
  error = null,
  onRetry,
  onApiReady,
  onConferenceJoined,
  onConferenceLeft,
  onError,
  meetingRoomId,
  jwtToken,
  appId,
}) => {
  const isVisible = isOpen ?? open ?? false;

  const [isSdkReady, setIsSdkReady] = useState<boolean>(false);
  const [loadTimeout, setLoadTimeout] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<{ code: string; message: string } | null>(null);

  const jitsiApiRef = useRef<JitsiApiLike | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  const token = conference?.token || jwtToken || "";
  const rawAppId = conference?.appId || appId || "vpaas-magic-cookie-fbd136285b3941a2a16d9e56702c3bd2";
  const domain = envConfig.jaasDomain;
  const rawRoomName = conference?.roomName || meetingRoomId || "";
  const sessionId = conference?.sessionId || "";

  const fullRoomName = buildJaasRoomName(rawAppId, rawRoomName);

  // 1. Kiểm tra Secure Context (HTTPS)
  useEffect(() => {
    if (isVisible && typeof window !== "undefined" && window.isSecureContext === false) {
      setMediaError(mapMediaError(new Error("INSECURE_CONTEXT")));
    } else {
      setMediaError(null);
    }
  }, [isVisible]);

  // 2. Setup 25-second Load Timeout
  useEffect(() => {
    if (isVisible && !isSdkReady && !loadTimeout && status !== "error") {
      timeoutTimerRef.current = setTimeout(() => {
        if (!isSdkReady) {
          setLoadTimeout(true);
          console.warn("⚠️ [LiveRoomModal] Jitsi SDK load timed out after 25s");
        }
      }, 25000);
    }

    return () => {
      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }
    };
  }, [isVisible, isSdkReady, loadTimeout, status]);

  // 3. Reset state khi đóng Modal
  useEffect(() => {
    if (!isVisible) {
      setIsSdkReady(false);
      setLoadTimeout(false);
      setMediaError(null);
      if (jitsiApiRef.current) {
        jitsiApiRef.current = null;
      }
    }
  }, [isVisible]);

  // Handler khi Jitsi API sẵn sàng
  const handleApiReady = useCallback(
    (api: JitsiApiLike) => {
      jitsiApiRef.current = api;
      setIsSdkReady(true);
      setLoadTimeout(false);

      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }

      if (onApiReady) {
        onApiReady(api);
      }

      // Đăng ký exact event listeners
      const handleJoined = () => {
        if (onConferenceJoined) onConferenceJoined();
      };

      const handleLeft = () => {
        if (onConferenceLeft) onConferenceLeft();
      };

      const handleCameraError = (err: any) => {
        console.warn("⚠️ [Jitsi Event] Media Device Error:", err);
        const mapped = mapMediaError(err);
        setMediaError(mapped);
        if (onError) {
          onError({
            code: mapped.code,
            title: "Lỗi thiết bị",
            message: mapped.message,
            retryable: true,
            severity: "warning",
          });
        }
      };

      api.addEventListener("videoConferenceJoined", handleJoined);
      api.addEventListener("videoConferenceLeft", handleLeft);
      api.addEventListener("audioMuteStatusChanged", () => {});
      api.addEventListener("videoMuteStatusChanged", () => {});
      api.addEventListener("cameraError" as any, handleCameraError);
      api.addEventListener("micError" as any, handleCameraError);
    },
    [onApiReady, onConferenceJoined, onConferenceLeft, onError]
  );

  if (!isVisible) return null;

  // Điều kiện kiểm tra xem có đủ dữ liệu để mount Jitsi không
  const hasValidData = Boolean(
    isVisible &&
      conference &&
      token &&
      rawAppId &&
      rawRoomName &&
      domain &&
      sessionId &&
      status !== "error" &&
      status !== "closing" &&
      status !== "closed" &&
      !loadTimeout
  );

  return (
    <div
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-2 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Phòng học trực tuyến Live Session"
    >
      {/* Header Modal */}
      <div className="w-full max-w-6xl flex justify-between items-center mb-3 text-white px-2">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
          </span>
          <Title level={5} style={{ color: "#fff", margin: 0, fontWeight: 700 }} className="text-sm sm:text-base">
            <VideoCameraOutlined className="mr-2" />
            Phòng Học Trực Tuyến Bảo Mật 8x8 JaaS
          </Title>
        </div>

        <Button
          type="primary"
          danger
          icon={<CloseOutlined />}
          onClick={onClose}
          style={{ fontWeight: 600, borderRadius: 8 }}
          aria-label="Rời phòng học"
        >
          Rời phòng
        </Button>
      </div>

      {/* Container Nội dung Video Call / Error / Loading */}
      <div className="relative w-full max-w-6xl h-[82vh] bg-gray-900 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col items-center justify-center">
        {/* Media / HTTPS Error Alert Header */}
        {mediaError && (
          <div className="absolute top-0 left-0 right-0 z-30 p-3 bg-amber-500/90 text-white backdrop-blur-md flex items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2 text-sm font-medium">
              <LockOutlined className="text-lg" />
              <span>{mediaError.message}</span>
            </div>
            <Button
              size="small"
              type="default"
              onClick={() => setMediaError(null)}
              style={{ borderRadius: 6, fontSize: 12 }}
            >
              Đã hiểu
            </Button>
          </div>
        )}

        {/* State 1: Error hoặc Load Timeout */}
        {(status === "error" || loadTimeout || error) && (
          <div className="p-6 text-center max-w-md bg-gray-800/90 rounded-2xl border border-gray-700 shadow-xl">
            <WarningOutlined style={{ fontSize: 48, color: "#ff4d4f", marginBottom: 16 }} />
            <Title level={4} style={{ color: "#fff", marginBottom: 8 }}>
              {error?.title || (loadTimeout ? "Tải phòng học quá thời gian" : "Không thể tải phòng học")}
            </Title>
            <Paragraph style={{ color: "#d9d9d9", fontSize: 14, marginBottom: 24 }}>
              {error?.message ||
                (loadTimeout
                  ? "Kết nối tới máy chủ 8x8 JaaS phản hồi quá chậm. Vui lòng nhấn thử lại."
                  : "Không nhận đủ dữ liệu cấu hình để khởi chạy phòng học trực tuyến.")}
            </Paragraph>
            <Space size={12}>
              {onRetry && (
                <Button
                  type="primary"
                  icon={<ReloadOutlined />}
                  onClick={() => {
                    setLoadTimeout(false);
                    if (onRetry) onRetry();
                  }}
                  style={{ fontWeight: 600, borderRadius: 8 }}
                >
                  Thử lại
                </Button>
              )}
              <Button onClick={onClose} style={{ borderRadius: 8 }}>
                Đóng
              </Button>
            </Space>
          </div>
        )}

        {/* State 2: Skeleton Loading Overlay khi SDK chưa ready */}
        {hasValidData && !isSdkReady && (
          <div className="absolute inset-0 z-20 bg-gray-900 flex flex-col items-center justify-center text-white p-4">
            <Spin size="large" />
            <Text style={{ color: "#fff", marginTop: 16, fontSize: 15, fontWeight: 500 }}>
              Đang chuẩn bị phòng học trực tuyến 8x8 JaaS...
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 6, fontSize: 13 }}>
              Vui lòng đợi trong giây lát
            </Text>
          </div>
        )}

        {/* State 3: Mount JitsiMeeting khi đủ dữ liệu hợp lệ */}
        {hasValidData && (
          <div className="w-full h-full">
            <JitsiMeeting
              domain={domain}
              roomName={fullRoomName}
              jwt={token}
              configOverwrite={{
                disableThirdPartyRequests: true,
                prejoinPageEnabled: false,
                startWithAudioMuted: false,
                startWithVideoMuted: false,
              }}
              interfaceConfigOverwrite={{
                SHOW_JITSI_WATERMARK: false,
                SHOW_WATERMARK_FOR_GUESTS: false,
              }}
              getIFrameRef={(iframeRef) => {
                if (iframeRef) {
                  iframeRef.style.height = "100%";
                  iframeRef.style.width = "100%";
                  iframeRef.style.border = "0";
                }
              }}
              onApiReady={handleApiReady}
              onReadyToClose={onClose}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveRoomModal;