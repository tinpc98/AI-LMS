import React, { useMemo } from "react";
import { Button, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useAuth } from "../../../../shared/hooks/useAuth";
import { tokens } from "../../../../shared/theme/tokens";
import { useTheme } from "../../../../shared/context/ThemeContext";

const { Title, Text } = Typography;

interface StudentWelcomeBannerProps {
  totalClassesCount?: number;
  pendingAssignmentsCount?: number;
  upcomingExamsCount?: number;
  unreadAnnouncementsCount?: number;
  onRefresh?: () => void;
  loading?: boolean;
}

export const StudentWelcomeBanner: React.FC<StudentWelcomeBannerProps> = React.memo(
  ({
    onRefresh,
    loading,
  }) => {
    const { user } = useAuth();
    const { isDark } = useTheme();

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
      <div
        style={{
          position: "relative",
          marginBottom: tokens.space[6],
          background: "var(--color-bg-page)",
          borderRadius: tokens.radius.lg,
          overflow: "hidden",
        }}
      >
        {/* Background Layer */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: isDark
              ? "linear-gradient(135deg, rgba(67, 67, 67, 0.3) 0%, rgba(0, 0, 0, 0.8) 100%)"
              : "linear-gradient(135deg, rgba(230, 247, 255, 0.5) 0%, rgba(240, 245, 255, 1) 100%)",
            zIndex: 0,
          }}
        />

        {/* Decorative elements */}
        <div
          style={{
            position: "absolute",
            top: -50,
            right: -20,
            width: 250,
            height: 250,
            borderRadius: "50%",
            background: isDark
              ? "radial-gradient(circle, rgba(24, 144, 255, 0.15) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(24, 144, 255, 0.1) 0%, transparent 70%)",
            zIndex: 0,
          }}
        />

        {/* Content Layer */}
        <div style={{ position: "relative", zIndex: 1, padding: "32px 40px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            {/* Left: Welcome Message */}
            <div>
              <Text style={{ fontSize: 16, color: "var(--color-text-description)", marginBottom: 8, display: "block" }}>
                {currentDateString}
              </Text>
              <Title level={2} style={{ margin: 0, color: "var(--color-text-title)" }}>
                {greeting}, <span style={{ color: "var(--color-primary-base)" }}>{studentName}</span> 👋
              </Title>
              <Text style={{ fontSize: 14, color: "var(--color-text-description)", marginTop: 8, display: "block", maxWidth: 600 }}>
                Sẵn sàng cho các mục tiêu học tập mới trong ngày hôm nay!
              </Text>
            </div>

            {/* Right: Actions */}
            <div>
              {onRefresh && (
                <Button
                  icon={<ReloadOutlined />}
                  onClick={onRefresh}
                  loading={loading}
                  type="text"
                  style={{
                    backgroundColor: "var(--color-bg-container)",
                    border: "1px solid var(--color-border-default)",
                  }}
                >
                  Làm mới
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

StudentWelcomeBanner.displayName = "StudentWelcomeBanner";
export default StudentWelcomeBanner;
