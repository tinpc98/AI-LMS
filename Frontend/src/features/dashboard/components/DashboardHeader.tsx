import React from "react";
import { Breadcrumb, Button, Space, Typography } from "antd";
import {
  PlusOutlined,
  ReloadOutlined,
  UserSwitchOutlined,
  BookOutlined,
  HomeOutlined,
  CalendarOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

interface DashboardHeaderProps {
  onRefresh?: () => void;
  loading?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ onRefresh, loading }) => {
  const navigate = useNavigate();

  // Format today's date in Vietnamese
  const today = new Date();
  const formattedDate = new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(today);

  // Capitalize first letter of weekday
  const capitalizedDate = formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #ffffff 0%, #f6f8fc 100%)",
        padding: "24px",
        borderRadius: "16px",
        marginBottom: "24px",
        boxShadow: "0 4px 20px rgba(0, 0, 0, 0.03)",
        border: "1px solid #f0f0f0",
      }}
    >
      <Breadcrumb
        style={{ marginBottom: 12 }}
        items={[
          {
            title: (
              <span style={{ cursor: "pointer" }} onClick={() => navigate("/admin")}>
                <HomeOutlined style={{ marginRight: 6 }} /> Trang chủ
              </span>
            ),
          },
          {
            title: "Dashboard Overview",
          },
        ]}
      />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Title level={2} style={{ margin: 0, fontWeight: 700, color: "#1f1f1f" }}>
              Xin chào Admin 👋
            </Title>
          </div>
          <Text type="secondary" style={{ fontSize: "14px", display: "inline-flex", alignItems: "center", marginTop: 4 }}>
            <CalendarOutlined style={{ marginRight: 6, color: "#1677ff" }} />
            {capitalizedDate} — Hệ thống quản lý luyện thi THPT Quốc Gia
          </Text>
        </div>

        <Space wrap size="middle">
          {onRefresh && (
            <Button
              icon={<ReloadOutlined spin={loading} />}
              onClick={onRefresh}
              loading={loading}
              style={{ borderRadius: "8px" }}
            >
              Làm mới
            </Button>
          )}

          <Button
            type="default"
            icon={<BookOutlined style={{ color: "#1677ff" }} />}
            onClick={() => navigate("/admin/courses")}
            style={{ borderRadius: "8px" }}
          >
            Tạo khóa học
          </Button>

          <Button
            type="default"
            icon={<PlusOutlined style={{ color: "#fa8c16" }} />}
            onClick={() => navigate("/admin/classes")}
            style={{ borderRadius: "8px" }}
          >
            Tạo lớp học
          </Button>

          <Button
            type="primary"
            icon={<UserSwitchOutlined />}
            onClick={() => navigate("/admin/teacher-assignment")}
            style={{
              borderRadius: "8px",
              background: "linear-gradient(135deg, #1677ff 0%, #0958d9 100%)",
              border: "none",
              boxShadow: "0 4px 12px rgba(22, 119, 255, 0.3)",
            }}
          >
            Phân công giáo viên
          </Button>
        </Space>
      </div>
    </div>
  );
};
