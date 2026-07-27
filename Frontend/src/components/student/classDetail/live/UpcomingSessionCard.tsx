import React from "react";
import { Card, Typography, Space, Button, Tag, Alert } from "antd";
import { ClockCircleOutlined, InfoCircleOutlined, UserOutlined, BellOutlined } from "@ant-design/icons";
import SessionStatusTag from "./SessionStatusTag";
import type { IExtendedLiveSession } from "../../../../types/studentLive";

const { Text, Paragraph, Title } = Typography;

interface UpcomingSessionCardProps {
  session: IExtendedLiveSession;
  onDetail: (session: IExtendedLiveSession) => void;
}

export const UpcomingSessionCard: React.FC<UpcomingSessionCardProps> = React.memo(({ session, onDetail }) => {
  const formattedStart = session.scheduledStart
    ? new Date(session.scheduledStart).toLocaleString("vi-VN", {
        weekday: "short",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Lịch sắp tới";

  return (
    <Card
      style={{
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
        border: "1px solid #f0f0f0",
        marginBottom: 16,
      }}
      styles={{ body: { padding: 18 } }}
    >
      {/* Alert Notice if starting within 30 minutes */}
      {session.isStartingSoon && (
        <Alert
          message="⏰ Buổi học sẽ bắt đầu sau 30 phút nữa!"
          description="Vui lòng chuẩn bị thiết bị micro, camera và kết nối internet sẵn sàng."
          type="warning"
          showIcon
          style={{ borderRadius: 10, marginBottom: 14 }}
        />
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <SessionStatusTag status="Upcoming" />
        <Tag color="orange" icon={<ClockCircleOutlined />} style={{ borderRadius: 6, fontWeight: 700 }}>
          {session.countdownText || "Sắp diễn ra"}
        </Tag>
      </div>

      <Title level={5} style={{ margin: "0 0 6px 0", color: "#1f2937" }}>
        {session.title}
      </Title>

      <div style={{ backgroundColor: "#fafafa", borderRadius: 8, padding: "8px 12px", marginBottom: 12 }}>
        <Space size={16}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <ClockCircleOutlined style={{ marginRight: 4 }} /> Thời gian: <strong>{formattedStart}</strong>
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            <UserOutlined style={{ marginRight: 4 }} /> GV: <strong>{session.teacherName || "Giảng viên"}</strong>
          </Text>
        </Space>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Button
          type="default"
          size="small"
          icon={<InfoCircleOutlined />}
          onClick={() => onDetail(session)}
          style={{ borderRadius: 6, fontSize: 12 }}
        >
          Chi tiết buổi học
        </Button>

        <Button type="default" disabled size="small" icon={<BellOutlined />} style={{ borderRadius: 6, fontSize: 12 }}>
          Chưa thể tham gia
        </Button>
      </div>
    </Card>
  );
});

UpcomingSessionCard.displayName = "UpcomingSessionCard";

export default UpcomingSessionCard;
