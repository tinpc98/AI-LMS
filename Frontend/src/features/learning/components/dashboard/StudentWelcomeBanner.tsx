import React, { useMemo } from "react";
import { Button, Typography, Row, Col, Avatar } from "antd";
import {
  BookOutlined,
  FileTextOutlined,
  FormOutlined,
  BellOutlined,
  UserOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../../shared/hooks/useAuth";

const { Title, Text } = Typography;

interface StudentWelcomeBannerProps {
  totalClassesCount: number;
  pendingAssignmentsCount: number;
  upcomingExamsCount: number;
  unreadAnnouncementsCount: number;
  onRefresh?: () => void;
  loading?: boolean;
}

const kpiCardStyle: React.CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.15)",
  backdropFilter: "blur(8px)",
  borderRadius: 16,
  padding: "16px 20px",
  display: "flex",
  alignItems: "center",
  gap: 14,
  transition: "all 0.25s ease",
  cursor: "default",
  border: "1px solid rgba(255,255,255,0.2)",
};

export const StudentWelcomeBanner: React.FC<StudentWelcomeBannerProps> = React.memo(
  ({
    totalClassesCount,
    pendingAssignmentsCount,
    upcomingExamsCount,
    unreadAnnouncementsCount,
    onRefresh,
    loading,
  }) => {
    const { user } = useAuth();

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

    const kpiItems = [
      {
        key: "classes",
        icon: <BookOutlined style={{ fontSize: 26, color: "#fff" }} />,
        value: totalClassesCount,
        label: "Lớp học",
        iconBg: "rgba(255,255,255,0.2)",
      },
      {
        key: "assignments",
        icon: <FileTextOutlined style={{ fontSize: 26, color: "#ffec3d" }} />,
        value: pendingAssignmentsCount,
        label: "Bài tập",
        iconBg: "rgba(255,236,61,0.15)",
      },
      {
        key: "exams",
        icon: <FormOutlined style={{ fontSize: 26, color: "#ff9c6e" }} />,
        value: upcomingExamsCount,
        label: "Bài kiểm tra",
        iconBg: "rgba(255,156,110,0.15)",
      },
      {
        key: "announcements",
        icon: <BellOutlined style={{ fontSize: 26, color: "#95de64" }} />,
        value: unreadAnnouncementsCount,
        label: "Thông báo",
        iconBg: "rgba(149,222,100,0.15)",
      },
    ];

    return (
      <div
        style={{
          borderRadius: 20,
          background: "linear-gradient(135deg, #1890ff 0%, #003a8c 100%)",
          padding: "28px 32px",
          marginBottom: 32,
          boxShadow: "0 8px 32px rgba(24, 144, 255, 0.3)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -40,
            right: -40,
            width: 200,
            height: 200,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.05)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -60,
            right: 80,
            width: 160,
            height: 160,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.04)",
            pointerEvents: "none",
          }}
        />

        <Row gutter={[32, 24]} align="middle">
          {/* Left: Greeting */}
          <Col xs={24} md={10}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <Avatar
                size={64}
                src={(user as any)?.avatar || undefined}
                icon={!(user as any)?.avatar ? <UserOutlined style={{ fontSize: 28 }} /> : undefined}
                style={{
                  backgroundColor: "rgba(255, 255, 255, 0.25)",
                  border: "2.5px solid rgba(255, 255, 255, 0.7)",
                  flexShrink: 0,
                }}
              />
              <div>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.75)",
                    fontSize: 13,
                    display: "block",
                    marginBottom: 2,
                    letterSpacing: 0.3,
                  }}
                >
                  {currentDateString}
                </Text>
                <Title
                  level={3}
                  style={{ color: "#fff", margin: "0 0 4px 0", fontWeight: 700, lineHeight: 1.2 }}
                >
                  {greeting}, {studentName}! 👋
                </Title>
                <Text style={{ color: "rgba(255, 255, 255, 0.75)", fontSize: 13, lineHeight: 1.5 }}>
                  Hôm nay bạn muốn học gì?
                </Text>
              </div>
            </div>
          </Col>

          {/* Right: KPI Cards */}
          <Col xs={24} md={14}>
            <Row gutter={[16, 16]}>
              {kpiItems.map((kpi) => (
                <Col xs={12} sm={6} md={12} lg={6} key={kpi.key}>
                  <div style={kpiCardStyle}>
                    <div
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: kpi.iconBg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      {kpi.icon}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 26,
                          fontWeight: 800,
                          lineHeight: 1,
                          color: "#fff",
                          letterSpacing: -0.5,
                        }}
                      >
                        {kpi.value}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                        {kpi.label}
                      </div>
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          </Col>
        </Row>

        {/* Refresh button */}
        {onRefresh && (
          <div style={{ position: "absolute", top: 20, right: 24 }}>
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={onRefresh}
              size="small"
              style={{
                backgroundColor: "rgba(255,255,255,0.2)",
                border: "1px solid rgba(255,255,255,0.3)",
                color: "#fff",
                borderRadius: 8,
                backdropFilter: "blur(4px)",
              }}
            >
              Làm mới
            </Button>
          </div>
        )}
      </div>
    );
  }
);

StudentWelcomeBanner.displayName = "StudentWelcomeBanner";

export default StudentWelcomeBanner;
