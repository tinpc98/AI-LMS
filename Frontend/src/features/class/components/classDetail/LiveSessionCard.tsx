import React, { useCallback } from "react";
import { Card, Typography, Space, Button, Badge } from "antd";
import { VideoCameraOutlined, ClockCircleOutlined, UserOutlined } from "@ant-design/icons";
import type { IExtendedLiveSession } from "../../../../types/studentLive";
import EmptyState from "../../../../shared/components/EmptyState";

const { Text, Title } = Typography;

interface LiveSessionCardProps {
  currentLiveItem: IExtendedLiveSession | null;
  upcomingSessions: IExtendedLiveSession[];
  pastSessions: IExtendedLiveSession[];
  onJoinLive: () => void;
}

export const LiveSessionCard: React.FC<LiveSessionCardProps> = React.memo(
  ({ currentLiveItem, upcomingSessions, pastSessions, onJoinLive }) => {
    // Xác định trạng thái hiển thị
    let displaySession: IExtendedLiveSession | null = null;
    let cardState: "EMPTY" | "ONGOING" | "UPCOMING" | "COMPLETED" = "EMPTY";

    if (currentLiveItem && currentLiveItem.status === "Live") {
      cardState = "ONGOING";
      displaySession = currentLiveItem;
    } else if (upcomingSessions && upcomingSessions.length > 0) {
      cardState = "UPCOMING";
      displaySession = upcomingSessions[0];
    } else if (pastSessions && pastSessions.length > 0) {
      cardState = "COMPLETED";
      displaySession = pastSessions[0];
    }

    if (cardState === "EMPTY" || !displaySession) {
      return (
        <Card
          title={
            <Space align="center">
              <VideoCameraOutlined style={{ color: "#1890ff", fontSize: 18 }} />
              <span style={{ fontSize: 16, fontWeight: 700 }}>Buổi học trực tuyến</span>
            </Space>
          }
          style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)", marginBottom: 24 }}
          styles={{ body: { padding: 20 } }}
        >
          <EmptyState
            title="Chưa có buổi học trực tuyến"
            description="Giảng viên sẽ tạo buổi học khi bắt đầu tiết học"
            style={{ padding: "16px 0", border: "none" }}
          />
          <Button block disabled style={{ borderRadius: 8, marginTop: 12 }}>
            Chờ buổi học
          </Button>
        </Card>
      );
    }

    const teacherName = displaySession.teacherName || "Giảng viên";
    // Ưu tiên mốc thời gian thật do máy chủ trả về. Không có thì dùng lịch học của lớp
    // ("Thứ Hai · 08:00 - 10:30") — đó là sự thật; một giờ bắt đầu suy đoán thì không.
    const startTimeStr = displaySession.scheduledStart
      ? new Date(displaySession.scheduledStart).toLocaleTimeString("vi-VN", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : (displaySession.scheduleText ?? "Đang diễn ra");

    const renderStateContent = () => {
      switch (cardState) {
        case "ONGOING":
          return (
            <div
              style={{
                backgroundColor: "#f0f5ff",
                border: "1px solid #adc6ff",
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
                <Badge
                  status="processing"
                  text={<span style={{ color: "#1890ff", fontWeight: 600 }}>Đang diễn ra</span>}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {teacherName}
                </Text>
              </div>

              <Title level={5} style={{ margin: "4px 0", color: "#1f2937", fontSize: 16 }}>
                {displaySession?.title || `Buổi học #${displaySession?.sessionNumber}`}
              </Title>

              <Space size={8} style={{ marginTop: 4 }}>
                <ClockCircleOutlined style={{ color: "#595959" }} />
                <Text strong style={{ fontSize: 14, color: "#1f2937" }}>
                  Bắt đầu: {startTimeStr}
                </Text>
              </Space>

              <div style={{ marginTop: 16 }}>
                <Button
                  type="primary"
                  block
                  size="large"
                  icon={<VideoCameraOutlined />}
                  onClick={onJoinLive}
                  style={{ borderRadius: 8, fontWeight: 600 }}
                >
                  Tham gia ngay
                </Button>
              </div>
            </div>
          );

        case "UPCOMING":
          return (
            <div
              style={{
                backgroundColor: "#f6ffed",
                border: "1px solid #b7eb8f",
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
                <Badge
                  color="green"
                  text={<span style={{ color: "#52c41a", fontWeight: 600 }}>Sắp diễn ra</span>}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {teacherName}
                </Text>
              </div>

              <Title level={5} style={{ margin: "4px 0", color: "#1f2937", fontSize: 16 }}>
                {displaySession?.title || `Buổi học #${displaySession?.sessionNumber}`}
              </Title>

              <Space size={8} style={{ marginTop: 4 }}>
                <ClockCircleOutlined style={{ color: "#595959" }} />
                <Text strong style={{ fontSize: 14, color: "#1f2937" }}>
                  {/* "Dự kiến" chỉ đúng khi có mốc thời gian thật. Với buổi suy từ lịch lớp
                      thì nói thẳng đó là lịch học, không hứa một thời điểm cụ thể. */}
                  {displaySession?.scheduledStart ? `Dự kiến: ${startTimeStr}` : startTimeStr}
                </Text>
              </Space>

              {displaySession?.countdownText && (
                <div style={{ marginTop: 8 }}>
                  <Text type="secondary" style={{ fontSize: 13, fontStyle: "italic" }}>
                    {displaySession.countdownText}
                  </Text>
                </div>
              )}

              <div style={{ marginTop: 16 }}>
                <Button block disabled style={{ borderRadius: 8 }}>
                  Chuẩn bị tham gia
                </Button>
              </div>
            </div>
          );

        case "COMPLETED":
          return (
            <div
              style={{
                backgroundColor: "#f5f5f5",
                border: "1px solid #d9d9d9",
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
                <Badge
                  color="default"
                  text={<span style={{ color: "#8c8c8c", fontWeight: 600 }}>Đã kết thúc</span>}
                />
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {teacherName}
                </Text>
              </div>

              <Title level={5} style={{ margin: "4px 0", color: "#1f2937", fontSize: 16 }}>
                {displaySession?.title || `Buổi học #${displaySession?.sessionNumber}`}
              </Title>

              <div style={{ marginTop: 16 }}>
                <Button block style={{ borderRadius: 8 }}>
                  Xem chi tiết
                </Button>
              </div>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <Card
        title={
          <Space align="center">
            <VideoCameraOutlined style={{ color: "#1890ff", fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Buổi học trực tuyến</span>
          </Space>
        }
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          marginBottom: 24,
        }}
        styles={{ body: { padding: 20 } }}
      >
        {renderStateContent()}
      </Card>
    );
  }
);

LiveSessionCard.displayName = "LiveSessionCard";

export default LiveSessionCard;
