import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Typography, Alert, Button } from "antd";
import { DisconnectOutlined, ReloadOutlined } from "@ant-design/icons";
import LiveStatistic from "./LiveStatistic";
import CurrentLiveCard from "./CurrentLiveCard";
import LiveEmptyState from "./LiveEmptyState";
import LiveLoadingSkeleton from "./LiveLoadingSkeleton";
import useLiveSessionState from "../../../../hooks/useLiveSessionState";
import useLiveSessionSocket from "../../../../hooks/useLiveSessionSocket";
import LiveSessionErrorBoundary from "../../../features/LiveSessionErrorBoundary";
import type { IExtendedLiveSession, StudentLiveStats } from "../../../../types/studentLive";

const { Title, Text } = Typography;

export interface LiveClassTabProps {
  classId?: string;
  classInfo?: any;
  rawLiveSession?: any;
  loading?: boolean;
  onJoinLiveRoom?: () => void;
}

export const LiveClassTab: React.FC<LiveClassTabProps> = React.memo(
  ({ classId, classInfo, onJoinLiveRoom }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // 1. Modular Hooks V2
    const {
      activeSession,
      isLoadingActive,
      error: sessionStateError,
      fetchActiveSession,
    } = useLiveSessionState({ classId });

    const { isOnline } = useLiveSessionSocket({
      classId,
      isTeacher: false,
      onSessionStarted: () => void fetchActiveSession(),
      onSessionEnded: () => {
        void fetchActiveSession();
      },
    });

    useEffect(() => {
      if (classId) {
        void fetchActiveSession();
      }
    }, [classId, fetchActiveSession]);

    const isSessionLive = activeSession?.status === "Live";

    const currentLiveItem: IExtendedLiveSession | null =
      isSessionLive && activeSession
        ? {
            _id: activeSession.id || (activeSession as any)._id || `live-${classId}`,
            id: activeSession.id || (activeSession as any)._id || `live-${classId}`,
            classId: activeSession.classId || classId || "",
            roomName: activeSession.roomName || (activeSession as any).meetingRoomId || "",
            meetingRoomId: activeSession.roomName || (activeSession as any).meetingRoomId || "",
            sessionNumber: activeSession.sessionNumber || 1,
            title: activeSession.title || `Buổi học trực tuyến lớp ${classInfo?.className || ""}`,
            createdBy:
              typeof activeSession.createdBy === "object" ? activeSession.createdBy.name : "",
            status: "Live",
            isLiveNow: true,
            platform: "8x8 JaaS",
            teacherName:
              typeof activeSession.createdBy === "object"
                ? activeSession.createdBy.name
                : classInfo?.teacher?.fullName || "Giảng viên",
            createdAt: activeSession.createdAt || new Date().toISOString(),
            updatedAt: activeSession.updatedAt || new Date().toISOString(),
          }
        : null;

    const stats: StudentLiveStats = {
      total: currentLiveItem ? 1 : 0,
      attended: 0,
      missed: 0,
      upcoming: currentLiveItem ? 1 : 0,
    };

    const handleJoinSession = (session: IExtendedLiveSession) => {
      if (onJoinLiveRoom) {
        onJoinLiveRoom();
      }
      const sessionId =
        activeSession?.id || (activeSession as any)?._id || session._id || session.id;
      if (sessionId) {
        navigate(`/student/live/${sessionId}`, {
          state: { classId, returnUrl: location.pathname },
        });
      }
    };

    return (
      <LiveSessionErrorBoundary onReset={fetchActiveSession}>
        <div style={{ padding: "8px 0" }}>
          {/* Network Offline Alert */}
          {!isOnline && (
            <Alert
              type="warning"
              showIcon
              icon={<DisconnectOutlined />}
              message="Mất kết nối mạng"
              description="Buổi học trực tuyến có thể bị gián đoạn. Vui lòng kiểm tra lại kết nối Internet."
              style={{ marginBottom: 16, borderRadius: 12 }}
              role="alert"
            />
          )}

          {/* Alert Hiển thị Lỗi nếu có */}
          {sessionStateError && (
            <Alert
              type="error"
              showIcon
              message={sessionStateError.title || "Lỗi tham gia buổi học"}
              description={sessionStateError.message}
              style={{ marginBottom: 16, borderRadius: 12 }}
              action={
                <Button
                  size="small"
                  type="primary"
                  danger
                  icon={<ReloadOutlined />}
                  onClick={() => void fetchActiveSession()}
                >
                  Thử lại
                </Button>
              }
            />
          )}

          {/* 1. Header Banner & Stats Section */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ marginBottom: 16 }}>
              <Title level={4} style={{ margin: "0 0 4px 0", fontWeight: 700, color: "#1f2937" }}>
                🎥 Học trực tuyến (Live Sessions)
              </Title>
              <Text type="secondary" style={{ fontSize: 13 }}>
                Tham gia các buổi học trực tuyến qua video 8x8 JaaS bảo mật.
              </Text>
            </div>

            <LiveStatistic stats={stats} />
          </div>

          {/* 2. Loading Skeleton vs Content */}
          {isLoadingActive ? (
            <LiveLoadingSkeleton count={2} />
          ) : !currentLiveItem ? (
            <LiveEmptyState />
          ) : (
            <div>
              <CurrentLiveCard
                session={currentLiveItem}
                onJoin={handleJoinSession}
                onDetail={() => {}}
              />
            </div>
          )}
        </div>
      </LiveSessionErrorBoundary>
    );
  }
);

LiveClassTab.displayName = "LiveClassTab";

export default LiveClassTab;
