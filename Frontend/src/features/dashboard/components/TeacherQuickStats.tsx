import React from "react";
import { Row, Col, Card, Statistic, Badge, Space, Typography } from "antd";
import {
  BookOutlined,
  TeamOutlined,
  FormOutlined,
  VideoCameraOutlined,
  NotificationOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface TeacherQuickStatsProps {
  totalClasses: number;
  totalStudents: number;
  pendingSubmissionsCount: number;
  activeLiveSessionsCount: number;
  totalAnnouncementsCount: number;
  loading?: boolean;
}

export const TeacherQuickStats: React.FC<TeacherQuickStatsProps> = React.memo(
  ({
    totalClasses = 0,
    totalStudents = 0,
    pendingSubmissionsCount = 0,
    activeLiveSessionsCount = 0,
    totalAnnouncementsCount = 0,
    loading = false,
  }) => {
    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {/* Card 1: Lớp phụ trách */}
        <Col xs={24} sm={12} md={8} lg={4.8} style={{ flex: 1 }}>
          <Card
            loading={loading}
            hoverable
            style={{
              borderRadius: 12,
              borderLeft: "4px solid #1890ff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Statistic
              title={
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Lớp phụ trách
                </Text>
              }
              value={totalClasses}
              suffix="lớp"
              prefix={<BookOutlined style={{ color: "#1890ff", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Lớp học được Admin phân công
            </Text>
          </Card>
        </Col>

        {/* Card 2: Tổng học sinh */}
        <Col xs={24} sm={12} md={8} lg={4.8} style={{ flex: 1 }}>
          <Card
            loading={loading}
            hoverable
            style={{
              borderRadius: 12,
              borderLeft: "4px solid #52c41a",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Statistic
              title={
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Tổng học sinh
                </Text>
              }
              value={totalStudents}
              suffix="học sinh"
              prefix={<TeamOutlined style={{ color: "#52c41a", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Đang tham gia học tập
            </Text>
          </Card>
        </Col>

        {/* Card 3: Bài tập cần chấm */}
        <Col xs={24} sm={12} md={8} lg={4.8} style={{ flex: 1 }}>
          <Card
            loading={loading}
            hoverable
            style={{
              borderRadius: 12,
              borderLeft: "4px solid #faad14",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Statistic
              title={
                <Space size={6}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Bài nộp cần chấm
                  </Text>
                  {pendingSubmissionsCount > 0 && (
                    <Badge count={pendingSubmissionsCount} overflowCount={99} />
                  )}
                </Space>
              }
              value={pendingSubmissionsCount}
              suffix="bài"
              prefix={<FormOutlined style={{ color: "#faad14", marginRight: 8 }} />}
              valueStyle={{
                fontWeight: 700,
                fontSize: 24,
                color: pendingSubmissionsCount > 0 ? "#d48806" : "inherit",
              }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Bài làm chờ chấm điểm
            </Text>
          </Card>
        </Col>

        {/* Card 4: Lớp trực tuyến LIVE */}
        <Col xs={24} sm={12} md={8} lg={4.8} style={{ flex: 1 }}>
          <Card
            loading={loading}
            hoverable
            style={{
              borderRadius: 12,
              borderLeft: "4px solid #ff4d4f",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Statistic
              title={
                <Space size={6}>
                  <Text type="secondary" style={{ fontSize: 13 }}>
                    Live Session
                  </Text>
                  {activeLiveSessionsCount > 0 && (
                    <Badge
                      status="processing"
                      text="LIVE"
                      style={{ color: "#ff4d4f", fontWeight: 700 }}
                    />
                  )}
                </Space>
              }
              value={activeLiveSessionsCount}
              suffix="phòng"
              prefix={<VideoCameraOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />}
              valueStyle={{
                fontWeight: 700,
                fontSize: 24,
                color: activeLiveSessionsCount > 0 ? "#ff4d4f" : "inherit",
              }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Phòng học trực tuyến đang mở
            </Text>
          </Card>
        </Col>

        {/* Card 5: Thông báo */}
        <Col xs={24} sm={12} md={8} lg={4.8} style={{ flex: 1 }}>
          <Card
            loading={loading}
            hoverable
            style={{
              borderRadius: 12,
              borderLeft: "4px solid #722ed1",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
            styles={{ body: { padding: "16px 20px" } }}
          >
            <Statistic
              title={
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Thông báo
                </Text>
              }
              value={totalAnnouncementsCount}
              suffix="tin"
              prefix={<NotificationOutlined style={{ color: "#722ed1", marginRight: 8 }} />}
              valueStyle={{ fontWeight: 700, fontSize: 24 }}
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              Thông báo trên hệ thống
            </Text>
          </Card>
        </Col>
      </Row>
    );
  }
);

TeacherQuickStats.displayName = "TeacherQuickStats";
