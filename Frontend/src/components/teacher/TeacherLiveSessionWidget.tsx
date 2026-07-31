import React from "react";
import { Card, Alert, Button, Badge, Typography, Space } from "antd";
import { VideoCameraOutlined, ArrowRightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

interface TeacherLiveSessionWidgetProps {
  activeSessions?: any[];
  loading?: boolean;
}

export const TeacherLiveSessionWidget: React.FC<TeacherLiveSessionWidgetProps> = React.memo(
  ({ activeSessions = [], loading = false }) => {
    const navigate = useNavigate();
    const hasLive = activeSessions.length > 0;

    if (loading || !hasLive) return null;

    return (
      <Card
        style={{
          borderRadius: 12,
          marginBottom: 24,
          border: "2px solid #ff4d4f",
          backgroundColor: "#fff1f0",
          boxShadow: "0 4px 12px rgba(255, 77, 79, 0.15)",
        }}
        styles={{ body: { padding: 16 } }}
      >
        {activeSessions.map((session, index) => (
          <div
            key={session._id || index}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <Space size={12}>
              <Badge
                status="processing"
                text="LIVE NOW"
                style={{ color: "#ff4d4f", fontWeight: 700 }}
              />
              <div>
                <Title level={5} style={{ margin: 0, color: "#cf1322" }}>
                  {session.title || "Phòng học trực tuyến đang diễn ra"}
                </Title>
                <Text style={{ fontSize: 13, color: "#8c8c8c" }}>
                  Mã phòng: <strong>{session.meetingRoomId}</strong>
                </Text>
              </div>
            </Space>

            <Button
              type="primary"
              danger
              icon={<VideoCameraOutlined />}
              onClick={() => navigate(`/teacher/classroom-detail/${session.classId}`)}
              style={{ fontWeight: 600, borderRadius: 6 }}
            >
              Tham gia phòng LIVE
            </Button>
          </div>
        ))}
      </Card>
    );
  }
);

TeacherLiveSessionWidget.displayName = "TeacherLiveSessionWidget";
