import React from "react";
import { Card, Button, Typography, Space, Avatar, Tag, Row, Col } from "antd";
import {
  UserOutlined,
  PlayCircleOutlined,
  GlobalOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import SessionStatusTag from "./SessionStatusTag";
import type { IExtendedLiveSession } from "../../../../../types/studentLive";

const { Text, Title, Paragraph } = Typography;

interface CurrentLiveCardProps {
  session: IExtendedLiveSession;
  onJoin: (session: IExtendedLiveSession) => void;
  onDetail: (session: IExtendedLiveSession) => void;
}

export const CurrentLiveCard: React.FC<CurrentLiveCardProps> = React.memo(
  ({ session, onJoin, onDetail }) => {
    return (
      <Card
        style={{
          borderRadius: 20,
          background: "linear-gradient(135deg, var(--color-action-primary-bg-active) 0%, var(--color-action-primary-bg-active) 100%)",
          color: "var(--color-surface)",
          boxShadow: "0 10px 25px rgba(9, 109, 217, 0.3)",
          marginBottom: 24,
          overflow: "hidden",
          border: "none",
        }}
        styles={{ body: { padding: "24px 28px" } }}
      >
        <Row gutter={[24, 20]} align="middle">
          <Col xs={24} lg={16}>
            <div style={{ marginBottom: 12 }}>
              <Space size={8} align="center">
                <SessionStatusTag status="Live" />
                <Tag color="cyan" icon={<GlobalOutlined />}>
                  Nền tảng: {session.platform || "Jitsi Meet"}
                </Tag>
              </Space>
            </div>

            <Title level={3} style={{ color: "var(--color-surface)", margin: "0 0 8px 0", fontWeight: 700 }}>
              {session.title}
            </Title>

            <Paragraph
              style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: 13, margin: "0 0 16px 0" }}
            >
              Lớp học trực tuyến đang diễn ra. Giảng viên đã sẵn sàng trong phòng học. Nhấn nút bên
              dưới để tham gia ngay!
            </Paragraph>

            <Space size={12} align="center">
              <Avatar
                icon={<UserOutlined />}
                style={{ backgroundColor: "var(--color-surface)", color: "var(--color-action-primary-bg-active)" }}
              />
              <div>
                <Text strong style={{ color: "var(--color-surface)", fontSize: 13, display: "block" }}>
                  {session.teacherName || "Giảng viên phụ trách"}
                </Text>
                <Text style={{ color: "rgba(255, 255, 255, 0.75)", fontSize: 11 }}>
                  Giảng viên điều hành lớp
                </Text>
              </div>
            </Space>
          </Col>

          <Col xs={24} lg={8} style={{ textAlign: "center" }}>
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(10px)",
                padding: "20px 16px",
                borderRadius: 16,
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <Text
                style={{
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: 12,
                  display: "block",
                  marginBottom: 12,
                }}
              >
                Phòng học trực tuyến đã mở
              </Text>

              <Button
                type="primary"
                size="large"
                icon={<PlayCircleOutlined style={{ fontSize: 20 }} />}
                onClick={() => onJoin(session)}
                style={{
                  width: "100%",
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "var(--color-success-base)",
                  borderColor: "var(--color-success-base)",
                  fontSize: 16,
                  fontWeight: 700,
                  boxShadow: "0 4px 12px rgba(82, 196, 26, 0.4)",
                  marginBottom: 8,
                }}
              >
                VÀO LỚP NGAY
              </Button>

              <Button
                type="text"
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={() => onDetail(session)}
                style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: 12 }}
              >
                Xem chi tiết phòng
              </Button>
            </div>
          </Col>
        </Row>
      </Card>
    );
  }
);

CurrentLiveCard.displayName = "CurrentLiveCard";

export default CurrentLiveCard;
