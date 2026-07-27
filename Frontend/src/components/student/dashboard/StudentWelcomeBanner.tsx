import React, { useMemo } from "react";
import { Card, Typography, Row, Col, Tag, Space, Avatar } from "antd";
import {
  BookOutlined,
  FileTextOutlined,
  FormOutlined,
  BellOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../hooks/useAuth";

const { Title, Text } = Typography;

interface StudentWelcomeBannerProps {
  totalClassesCount: number;
  pendingAssignmentsCount: number;
  upcomingExamsCount: number;
  unreadAnnouncementsCount: number;
}

export const StudentWelcomeBanner: React.FC<StudentWelcomeBannerProps> = React.memo(
  ({
    totalClassesCount,
    pendingAssignmentsCount,
    upcomingExamsCount,
    unreadAnnouncementsCount,
  }) => {
    const { user } = useAuth();

    // 1. Time-of-day greeting & formatted current date
    const { greeting, currentDateString } = useMemo(() => {
      const now = new Date();
      const hour = now.getHours();
      let timeGreeting = "Chào buổi sáng";

      if (hour >= 12 && hour < 18) {
        timeGreeting = "Chào buổi chiều";
      } else if (hour >= 18 || hour < 5) {
        timeGreeting = "Chào buổi tối";
      }

      const formattedDate = new Intl.DateTimeFormat("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(now);

      return {
        greeting: timeGreeting,
        currentDateString: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1),
      };
    }, []);

    const studentName = user?.fullName || "Sinh viên";

    return (
      <Card
        style={{
          borderRadius: 16,
          background: "linear-gradient(135deg, #1890ff 0%, #003a8c 100%)",
          color: "#fff",
          marginBottom: 24,
          boxShadow: "0 4px 16px rgba(24, 144, 255, 0.25)",
          border: "none",
        }}
        styles={{ body: { padding: "28px 24px" } }}
      >
        <Row gutter={[24, 20]} align="middle">
          {/* Left Column: Greeting & Date */}
          <Col xs={24} md={12} lg={14}>
            <Space size={16} align="center">
              <Avatar
                size={64}
                src={(user as any)?.avatar || undefined}
                icon={!(user as any)?.avatar ? <UserOutlined style={{ fontSize: 32 }} /> : undefined}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  border: "2px solid rgba(255, 255, 255, 0.6)",
                  flexShrink: 0,
                }}
              />
              <div>
                <Tag
                  color="blue"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderColor: "transparent",
                    color: "#e6f7ff",
                    fontSize: 12,
                    borderRadius: 12,
                    padding: "2px 10px",
                    marginBottom: 6,
                  }}
                >
                  {currentDateString}
                </Tag>
                <Title level={3} style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
                  {greeting}, {studentName}! 👋
                </Title>
                <Text style={{ color: "rgba(255, 255, 255, 0.85)", fontSize: 14 }}>
                  Chào mừng bạn trở lại hệ thống học tập thông minh LMS. Hôm nay bạn muốn học gì?
                </Text>
              </div>
            </Space>
          </Col>

          {/* Right Column: Quick Metric Badges */}
          <Col xs={24} md={12} lg={10}>
            <Row gutter={[12, 12]}>
              <Col xs={12} sm={12}>
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(4px)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <BookOutlined style={{ fontSize: 24, color: "#fff" }} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
                      {totalClassesCount}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>Lớp học đang tham gia</div>
                  </div>
                </div>
              </Col>

              <Col xs={12} sm={12}>
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(4px)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <FileTextOutlined style={{ fontSize: 24, color: "#ffec3d" }} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
                      {pendingAssignmentsCount}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>Bài tập chưa nộp</div>
                  </div>
                </div>
              </Col>

              <Col xs={12} sm={12}>
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(4px)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <FormOutlined style={{ fontSize: 24, color: "#ff7875" }} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
                      {upcomingExamsCount}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>Bài kiểm tra sắp tới</div>
                  </div>
                </div>
              </Col>

              <Col xs={12} sm={12}>
                <div
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    backdropFilter: "blur(4px)",
                    borderRadius: 12,
                    padding: "12px 16px",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                  }}
                >
                  <BellOutlined style={{ fontSize: 24, color: "#73d13d" }} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>
                      {unreadAnnouncementsCount}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>Thông báo mới</div>
                  </div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </Card>
    );
  }
);

StudentWelcomeBanner.displayName = "StudentWelcomeBanner";

export default StudentWelcomeBanner;
