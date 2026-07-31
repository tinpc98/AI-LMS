import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { JitsiMeeting } from "@jitsi/react-sdk";
import { Spin, Button, Typography, Space } from "antd";
import { WarningOutlined, LockOutlined } from "@ant-design/icons";
import useJaasConference from "../hooks/useJaasConference";
import { mapMediaError } from "../../../utils/liveSessionError";
import type { JitsiApiLike } from "../../../types/liveSession";

const { Title, Paragraph, Text } = Typography;

export const buildJaasRoomName = (appId: string, roomName: string): string => {
  const cleanAppId = (appId || "").trim().replace(/\/+$|^\/+/g, "");
  let cleanRoom = (roomName || "").trim().replace(/\/+$|^\/+/g, "");

  if (!cleanRoom) return "";

  if (cleanAppId && cleanRoom.startsWith(`${cleanAppId}/`)) {
    return cleanRoom;
  }

  return cleanAppId ? `${cleanAppId}/${cleanRoom}` : cleanRoom;
};

const LiveSessionPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // state passed from TeacherLiveSessionTab or LiveClassTab
  const { classId, returnUrl } = (location.state as any) || {};

  const { conference, status, error, isOpen, openConference, retryConference, closeConference } =
    useJaasConference();

  const [isSdkReady, setIsSdkReady] = useState<boolean>(false);
  const [loadTimeout, setLoadTimeout] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<{ code: string; message: string } | null>(null);

  const jitsiApiRef = useRef<JitsiApiLike | null>(null);
  const timeoutTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Fetch token and open conference on mount
  useEffect(() => {
    if (sessionId && status === "idle") {
      openConference(sessionId);
    }
  }, [sessionId, status, openConference]);

  const token = conference?.token || "";
  const rawAppId = conference?.appId || "";
  const domain = conference?.domain || "8x8.vc";
  const rawRoomName = conference?.roomName || "";
  const fullRoomName = buildJaasRoomName(rawAppId, rawRoomName);

  // 2. Check Secure Context (HTTPS)
  useEffect(() => {
    if (isOpen && typeof window !== "undefined" && window.isSecureContext === false) {
      setMediaError(mapMediaError(new Error("INSECURE_CONTEXT")));
    } else {
      setMediaError(null);
    }
  }, [isOpen]);

  // 3. Setup 25-second Load Timeout
  useEffect(() => {
    if (isOpen && !isSdkReady && !loadTimeout && status !== "error") {
      timeoutTimerRef.current = setTimeout(() => {
        if (!isSdkReady) {
          setLoadTimeout(true);
          console.warn("⚠️ [LiveSessionPage] Jitsi SDK load timed out after 25s");
        }
      }, 25000);
    }

    return () => {
      if (timeoutTimerRef.current) {
        clearTimeout(timeoutTimerRef.current);
        timeoutTimerRef.current = null;
      }
    };
  }, [isOpen, isSdkReady, loadTimeout, status]);

  // Handle Jitsi API Ready
  const handleApiReady = useCallback((api: JitsiApiLike) => {
    jitsiApiRef.current = api;
    setIsSdkReady(true);
    setLoadTimeout(false);

    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }

    const handleCameraError = (err: any) => {
      console.warn("⚠️ [Jitsi Event] Media Device Error:", err);
      const mapped = mapMediaError(err);
      setMediaError(mapped);
    };

    api.addEventListener("cameraError" as any, handleCameraError);
    api.addEventListener("micError" as any, handleCameraError);
  }, []);

  const handleReturn = () => {
    closeConference();
    if (returnUrl) {
      navigate(returnUrl);
    } else if (classId) {
      // Go back to class detail. It depends on role, but we can just use negative history if we don't know
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const hasValidData = Boolean(
    isOpen &&
    conference &&
    token &&
    rawAppId &&
    rawRoomName &&
    domain &&
    status !== "error" &&
    status !== "closing" &&
    status !== "closed" &&
    !loadTimeout
  );

  return (
    <div className="relative w-full h-full bg-black flex flex-col items-center justify-center">
      {/* Media / HTTPS Error Alert Header */}
      {mediaError && (
        <div className="absolute top-0 left-0 right-0 z-50 p-3 bg-amber-500/90 text-white flex items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-2 text-sm font-medium pl-4">
            <LockOutlined className="text-lg" />
            <span>{mediaError.message}</span>
          </div>
          <Button
            size="small"
            type="default"
            onClick={() => setMediaError(null)}
            style={{ borderRadius: 6, fontSize: 12, marginRight: 16 }}
          >
            Đã hiểu
          </Button>
        </div>
      )}

      {/* State 1: Error or Load Timeout */}
      {(status === "error" || loadTimeout || error) && (
        <div className="p-8 text-center max-w-lg bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl">
          <WarningOutlined style={{ fontSize: 64, color: "#ff4d4f", marginBottom: 24 }} />
          <Title level={3} style={{ color: "#fff", marginBottom: 12 }}>
            {error?.title ||
              (loadTimeout ? "Tải phòng học quá thời gian" : "Không thể tải phòng học")}
          </Title>
          <Paragraph style={{ color: "#d9d9d9", fontSize: 16, marginBottom: 32 }}>
            {error?.message ||
              (loadTimeout
                ? "Kết nối tới máy chủ 8x8 JaaS phản hồi quá chậm. Vui lòng nhấn thử lại."
                : "Không nhận đủ dữ liệu cấu hình để khởi chạy phòng học trực tuyến.")}
          </Paragraph>
          <Space size={16}>
            <Button
              type="primary"
              size="large"
              onClick={() => {
                setLoadTimeout(false);
                retryConference();
              }}
              style={{ fontWeight: 600, borderRadius: 8 }}
            >
              Thử lại
            </Button>
            <Button size="large" onClick={handleReturn} style={{ borderRadius: 8 }}>
              Quay lại
            </Button>
          </Space>
        </div>
      )}

      {/* State 2: Skeleton Loading Overlay */}
      {hasValidData && !isSdkReady && (
        <div className="absolute inset-0 z-20 bg-[#040404] flex flex-col items-center justify-center text-white">
          <Spin size="large" />
          <Title level={4} style={{ color: "#fff", marginTop: 24, fontWeight: 500 }}>
            Đang chuẩn bị phòng học trực tuyến...
          </Title>
          <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 15 }}>
            Vui lòng đợi trong giây lát
          </Text>
        </div>
      )}

      {/* State 3: JitsiMeeting (Fullscreen) */}
      {hasValidData && (
        <div className="w-full h-full absolute inset-0 z-10">
          <JitsiMeeting
            domain={domain}
            roomName={fullRoomName}
            jwt={token}
            configOverwrite={{
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
                // Important to allow fullscreen in iframe
                (iframeRef as HTMLIFrameElement).allow =
                  "camera; microphone; display-capture; autoplay; clipboard-write; fullscreen";
              }
            }}
            onApiReady={handleApiReady as any}
            onReadyToClose={handleReturn}
          />
        </div>
      )}
    </div>
  );
};

export default LiveSessionPage;
