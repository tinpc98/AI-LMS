import React, { useMemo } from "react";
import { Card, Avatar, Typography, Space, Tag, Button, Tooltip } from "antd";
import {
  ReloadOutlined,
  UserOutlined,
  CalendarOutlined,
  CheckCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface TeacherWelcomeHeaderProps {
  fullName?: string;
  email?: string;
  avatar?: string;
  loading?: boolean;
  onRefresh?: () => void;
}

export const TeacherWelcomeHeader: React.FC<TeacherWelcomeHeaderProps> = React.memo(
  ({ fullName = "Giảng viên", email = "", avatar = "", loading = false, onRefresh }) => {
    const greetingText = useMemo(() => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        return "Chào buổi sáng ☕";
      } else if (hour >= 12 && hour < 18) {
        return "Chào buổi chiều 🌤️";
      } else {
        return "Chào buổi tối 🌙";
      }
    }, []);

    const currentDateFormatted = useMemo(() => {
      return new Date().toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }, []);

    return (
      <Card
        style={{
          borderRadius: 16,
          background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
          color: "#fff",
          marginBottom: 24,
          boxShadow: "0 8px 24px rgba(24, 144, 255, 0.25)",
        }}
        styles={{ body: { padding: "24px 32px" } }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <Space size={20} align="center">
            <Avatar
              size={64}
              src={avatar || undefined}
              icon={!avatar ? <UserOutlined /> : undefined}
              style={{
                backgroundColor: "#e6f7ff",
                color: "#1890ff",
                border: "3px solid #fff",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            />
            <div>
              <Space align="center" style={{ marginBottom: 4 }}>
                <Title level={3} style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
                  {greetingText}, {fullName}!
                </Title>
                <Tag color="cyan" icon={<CheckCircleOutlined />} style={{ borderRadius: 12, fontWeight: 600 }}>
                  Giảng viên
                </Tag>
              </Space>
              <div style={{ display: "flex", alignItems: "center", gap: 16, color: "rgba(255, 255, 255, 0.85)" }}>
                {email && <Text style={{ color: "rgba(255,255,255,0.85)" }}>{email}</Text>}
                <Space size={6}>
                  <CalendarOutlined />
                  <span>Hôm nay: {currentDateFormatted}</span>
                </Space>
              </div>
            </div>
          </Space>

          <Space size={12}>
            {onRefresh && (
              <Tooltip title="Tải lại dữ liệu hệ thống">
                <Button
                  type="primary"
                  shape="round"
                  icon={<ReloadOutlined spin={loading} />}
                  loading={loading}
                  onClick={onRefresh}
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    borderColor: "rgba(255, 255, 255, 0.4)",
                    color: "#fff",
                    fontWeight: 600,
                    backdropFilter: "blur(4px)",
                  }}
                >
                  Làm mới
                </Button>
              </Tooltip>
            )}
          </Space>
        </div>
      </Card>
    );
  }
);

TeacherWelcomeHeader.displayName = "TeacherWelcomeHeader";
