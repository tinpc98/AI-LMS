import React, { useEffect } from "react";
import { Typography, Row, Col, Divider } from "antd";
import LiveStatistic from "./LiveStatistic";
import CurrentLiveCard from "./CurrentLiveCard";
import LiveEmptyState from "./LiveEmptyState";
import LiveLoadingSkeleton from "./LiveLoadingSkeleton";
import useLiveSessionState from "../../../../hooks/useLiveSessionState";
import useJaasConference from "../../../../hooks/useJaasConference";
import useLiveSessionSocket from "../../../../hooks/useLiveSessionSocket";
import LiveRoomModal from "../../../features/LiveRoomModal";
import type { IExtendedLiveSession, StudentLiveStats } from "../../../../types/studentLive";

const { Title, Text } = Typography;

interface LiveClassTabProps {
  classId?: string;
  classInfo?: any;
}

export const LiveClassTab: React.FC<LiveClassTabProps> = React.memo(
  ({ classId, classInfo }) => {
    // 1. Modular Hooks V2
    const {
      activeSession,
      isLoadingActive,
      fetchActiveSession,
    } = useLiveSessionState({ classId });

    const {
      conference,
      isPreparingConference,
      isModalOpen,
      openConference,
      closeConference,
    } = useJaasConference();

    useLiveSessionSocket({
      classId,
      isTeacher: false,
      onSessionStarted: () => void fetchActiveSession(),
      onSessionEnded: () => {
        closeConference();
        void fetchActiveSession();
      },
    });

    useEffect(() => {
      if (classId) {
        void fetchActiveSession();
      }
    }, [classId, fetchActiveSession]);

    const isSessionLive = activeSession?.status === "Live";

    const currentLiveItem: IExtendedLiveSession | null = isSessionLive && activeSession
      ? {
          _id: activeSession.id || activeSession._id || `live-${classId}`,
          classId: activeSession.classId || classId || "",
          meetingRoomId: activeSession.roomName || activeSession.meetingRoomId || "",
          sessionNumber: activeSession.sessionNumber || 1,
          title: activeSession.title || `Buổi học trực tuyến lớp ${classInfo?.className || ""}`,
          createdBy: typeof activeSession.createdBy === "object" ? activeSession.createdBy.name : "",
          status: "Live",
          isLiveNow: true,
          platform: "8x8 JaaS",
          teacherName: typeof activeSession.createdBy === "object" ? activeSession.createdBy.name : (classInfo?.teacher?.fullName || "Giảng viên"),
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
      const sessionId = activeSession?.id || activeSession?._id || session._id;
      if (sessionId) {
        void openConference(sessionId);
      }
    };

    return (
      <div style={{ padding: "8px 0" }}>
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
        {isLoadingActive || isPreparingConference ? (
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

        {/* 3. JaaS Live Room Modal */}
        <LiveRoomModal
          isOpen={isModalOpen}
          onClose={closeConference}
          conference={conference}
        />
      </div>
    );
  }
);

LiveClassTab.displayName = "LiveClassTab";

export default LiveClassTab;
