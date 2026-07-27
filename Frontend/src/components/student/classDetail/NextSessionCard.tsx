import React from "react";
import { Card, Typography, Space, Tag, Button } from "antd";
import { CalendarOutlined, ClockCircleOutlined, EnvironmentOutlined, VideoCameraOutlined } from "@ant-design/icons";
import EmptyState from "../../common/EmptyState";

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
    const hasDays = schedule?.days && schedule.days.length > 0;
    const hasTime = schedule?.startTime && schedule.endTime;

    if (!hasDays && !hasTime) {
      return (
        <Card
          title={
            <Space align="center">
              <CalendarOutlined style={{ color: "#fa8c16", fontSize: 18 }} />
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

    const daysText = schedule?.days?.join(", ") || "Hàng tuần";
    const timeText = hasTime ? `${schedule?.startTime} - ${schedule?.endTime}` : "Thời gian sắp diễn ra";

    return (
      <Card
        title={
          <Space align="center">
            <CalendarOutlined style={{ color: "#fa8c16", fontSize: 18 }} />
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
            backgroundColor: isLiveNow ? "#fff1f0" : "#e6f7ff",
            border: `1px solid ${isLiveNow ? "#ffa39e" : "#91d5ff"}`,
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Tag color={isLiveNow ? "error" : "processing"} style={{ borderRadius: 8 }}>
              {isLiveNow ? "🔴 Đang học trực tuyến" : "Lịch học định kỳ"}
            </Tag>
            <Text type="secondary" style={{ fontSize: 12 }}>
              <EnvironmentOutlined style={{ marginRight: 4 }} />
              {classRoom}
            </Text>
          </div>

          <Title level={5} style={{ margin: "4px 0", color: "#1f2937" }}>
            {daysText}
          </Title>

          <Space size={8} style={{ marginTop: 4 }}>
            <ClockCircleOutlined style={{ color: "#595959" }} />
            <Text strong style={{ fontSize: 14, color: "#1f2937" }}>
              {timeText}
            </Text>
          </Space>

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
