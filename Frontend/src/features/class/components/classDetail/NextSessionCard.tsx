import React from "react";
import { Card, Typography, Space, Tag, Button } from "antd";
import {
  CalendarOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import EmptyState from "../../../../shared/components/EmptyState";
import { getNextSessionInfo } from "../../../live-session/upcomingSessions";

const { Text, Title } = Typography;

interface NextSessionCardProps {
  schedule?: {
    days?: string[];
    startTime?: string;
    endTime?: string;
  } | null;
  classRoom?: string;
  isLiveNow?: boolean;
  onJoinLive?: () => void;
}

export const NextSessionCard: React.FC<NextSessionCardProps> = React.memo(
  ({ schedule, classRoom = "Phòng học Online", isLiveNow = false, onJoinLive }) => {
    const nextSession = React.useMemo(() => getNextSessionInfo(schedule || undefined), [schedule]);
    const hasDays = schedule?.days && schedule.days.length > 0;
    const hasTime = schedule?.startTime && schedule.endTime;

    if (!hasDays && !hasTime) {
      return (
        <Card
          title={
            <Space align="center">
              <CalendarOutlined style={{ color: "var(--color-warning-base)", fontSize: 18 }} />
              <span style={{ fontSize: 16, fontWeight: 700 }}>Buổi học tiếp theo</span>
            </Space>
          }
          style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)", marginBottom: 24 }}
          styles={{ body: { padding: 20 } }}
        >
          <EmptyState
            description="Lớp học chưa cập nhật lịch học cố định tiếp theo."
            style={{ padding: "16px 0", border: "none" }}
          />
        </Card>
      );
    }

    const titleText = nextSession?.formattedText || (hasDays ? schedule?.days?.join(", ") : "Lịch học định kỳ");
    const timeText = nextSession?.timeText || (hasTime ? `${schedule?.startTime} - ${schedule?.endTime}` : "Thời gian sắp diễn ra");

    let tagColor = "processing";
    let tagLabel = "Buổi sắp tới";
    if (isLiveNow) {
      tagColor = "error";
      tagLabel = "🔴 Đang học trực tuyến";
    } else if (nextSession?.isToday) {
      tagColor = "warning";
      tagLabel = "⚡ Diễn ra hôm nay";
    } else if (nextSession?.isTomorrow) {
      tagColor = "cyan";
      tagLabel = "Ngày mai";
    }

    return (
      <Card
        title={
          <Space align="center">
            <CalendarOutlined style={{ color: "var(--color-warning-base)", fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Buổi học tiếp theo</span>
          </Space>
        }
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          marginBottom: 24,
        }}
        styles={{ body: { padding: 20 } }}
      >
        <div
          style={{
            backgroundColor: isLiveNow ? "var(--color-error-bg)" : "var(--color-bg-primary-tint)",
            border: `1px solid ${isLiveNow ? "var(--color-border-default)" : "var(--color-border-primary-tint)"}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8,
            }}
          >
            <Tag color={tagColor} style={{ borderRadius: 8 }}>
              {tagLabel}
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <EnvironmentOutlined style={{ marginRight: 4 }} />
              {classRoom}
            </Text>
          </div>

          <Title level={5} style={{ margin: "4px 0", color: "var(--color-text-title)" }}>
            {titleText}
          </Title>

          <Space size={8} style={{ marginTop: 4, display: "flex" }}>
            <ClockCircleOutlined style={{ color: "var(--color-text-body)" }} />
            <Text strong style={{ fontSize: 14, color: "var(--color-text-title)" }}>
              {timeText}
            </Text>
          </Space>

          {nextSession?.allDaysText && (
            <div style={{ marginTop: 6 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Lịch tuần: {nextSession.allDaysText}
              </Text>
            </div>
          )}

          {isLiveNow && onJoinLive && (
            <div style={{ marginTop: 14 }}>
              <Button
                type="primary"
                danger
                block
                icon={<VideoCameraOutlined />}
                onClick={onJoinLive}
                style={{ borderRadius: 8 }}
              >
                Vào học ngay
              </Button>
            </div>
          )}
        </div>
      </Card>
    );
  }
);

NextSessionCard.displayName = "NextSessionCard";

export default NextSessionCard;
