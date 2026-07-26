import React from "react";
import { Typography, Row, Col, Divider } from "antd";
import LiveStatistic from "./LiveStatistic";
import CurrentLiveCard from "./CurrentLiveCard";
import UpcomingSessionCard from "./UpcomingSessionCard";
import SessionHistory from "./SessionHistory";
import ScheduleTimeline from "./ScheduleTimeline";
import JoinClassModal from "./JoinClassModal";
import SessionDetailDrawer from "./SessionDetailDrawer";
import LiveEmptyState from "./LiveEmptyState";
import LiveLoadingSkeleton from "./LiveLoadingSkeleton";
import useStudentLive from "../../../../hooks/useStudentLive";
import useLiveSession from "../../../../hooks/useLiveSession";
import type { ILiveSession } from "../../../../interface/liveInterface";

const { Title, Text } = Typography;

interface LiveClassTabProps {
  classId?: string;
  rawLiveSession?: ILiveSession | null;
  classInfo?: any;
  loading?: boolean;
  onJoinLiveRoom?: (meetingRoomId: string) => void;
}

export const LiveClassTab: React.FC<LiveClassTabProps> = React.memo(
  ({ classId, rawLiveSession, classInfo, loading = false, onJoinLiveRoom }) => {
    // Custom Hooks
    const {
      loading: liveLoading,
      currentLiveItem,
      upcomingSessions,
      pastSessions,
      stats,
    } = useStudentLive(classId, rawLiveSession, classInfo);

    const {
      selectedSession,
      isJoinModalOpen,
      isDetailOpen,
      openJoinModal,
      closeJoinModal,
      openDetail,
      closeDetail,
      handleConfirmJoin,
    } = useLiveSession(onJoinLiveRoom);

    const isLoading = loading || liveLoading;
    const hasAnyContent = currentLiveItem || upcomingSessions.length > 0 || pastSessions.length > 0;

    return (
      <div style={{ padding: "8px 0" }}>
        {/* 1. Header Banner & Stats Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: "0 0 4px 0", fontWeight: 700, color: "#1f2937" }}>
              🎥 Học trực tuyến (Live Sessions)
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Tham gia các buổi học trực tuyến qua video, xem lịch học cố định và xem lịch sử các buổi học đã diễn ra.
            </Text>
          </div>

          {/* 4 Statistic Cards */}
          <LiveStatistic stats={stats} />
        </div>

        {/* 2. Loading Skeleton vs Content */}
        {isLoading ? (
          <LiveLoadingSkeleton count={4} />
        ) : !hasAnyContent ? (
          <LiveEmptyState />
        ) : (
          <div>
            {/* 3. Hero Card for Currently Active Live Session */}
            {currentLiveItem && (
              <CurrentLiveCard
                session={currentLiveItem}
                onJoin={openJoinModal}
                onDetail={openDetail}
              />
            )}

            {/* 4. Upcoming Sessions & Weekly Schedule */}
            <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
              <Col xs={24} lg={14}>
                <Title level={5} style={{ marginBottom: 16, color: "#1f2937" }}>
                  📅 Các buổi học sắp diễn ra ({upcomingSessions.length})
                </Title>
                {upcomingSessions.length === 0 ? (
                  <Text type="secondary" style={{ fontSize: 13, fontStyle: "italic" }}>
                    Hiện không có lịch học sắp diễn ra nào khác.
                  </Text>
                ) : (
                  upcomingSessions.map((session) => (
                    <UpcomingSessionCard key={session._id} session={session} onDetail={openDetail} />
                  ))
                )}
              </Col>

              <Col xs={24} lg={10}>
                {/* Schedule Timeline */}
                <ScheduleTimeline schedule={classInfo?.schedule || []} />
              </Col>
            </Row>

            <Divider style={{ margin: "24px 0" }} />

            {/* 5. Past Sessions History */}
            <SessionHistory sessions={pastSessions} onDetail={openDetail} />
          </div>
        )}

        {/* 6. Join Class Confirmation Modal */}
        <JoinClassModal
          open={isJoinModalOpen}
          session={selectedSession}
          onClose={closeJoinModal}
          onConfirm={handleConfirmJoin}
        />

        {/* 7. Session Detail Drawer */}
        <SessionDetailDrawer
          open={isDetailOpen}
          session={selectedSession}
          onClose={closeDetail}
          onJoin={openJoinModal}
        />
      </div>
    );
  }
);

LiveClassTab.displayName = "LiveClassTab";

export default LiveClassTab;
