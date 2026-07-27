import React from "react";
import { Layout, Button, Space, Avatar, Dropdown, Badge, Typography, Tag, Tooltip } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { TeacherBreadcrumb } from "./TeacherBreadcrumb";
import { useAuth } from "../../../hooks/useAuth";

const { Header } = Layout;
const { Text } = Typography;

interface TeacherHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onToggleMobileDrawer: () => void;
  isMobile: boolean;
}

export const TeacherHeader: React.FC<TeacherHeaderProps> = React.memo(
  ({ collapsed, onToggleCollapse, onToggleMobileDrawer, isMobile }) => {
    const { user, logout } = useAuth();

    const userMenuItems: MenuProps["items"] = [
      {
        key: "user-info",
        label: (
          <div style={{ padding: "4px 8px" }}>
            <Text strong style={{ display: "block", fontSize: 14 }}>
              {user?.fullName || "Giảng viên"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {user?.email || "teacher@lms.edu.vn"}
            </Text>
            <div style={{ marginTop: 6 }}>
              <Tag color="cyan">Giảng viên</Tag>
            </div>
          </div>
        ),
      },
      { type: "divider" },
      {
        key: "settings",
        icon: <SettingOutlined />,
        label: "Cài đặt tài khoản",
      },
      {
        key: "logout",
        icon: <LogoutOutlined style={{ color: "#ff4d4f" }} />,
        danger: true,
        label: "Đăng xuất",
        onClick: logout,
      },
    ];

    return (
      <Header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 99,
          padding: "0 24px",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
          borderBottom: "1px solid #f0f0f0",
          height: 64,
        }}
      >
        {/* Left Side: Collapse Button & Breadcrumb */}
        <Space size={16} align="center">
          <Button
            type="text"
            icon={
              isMobile ? (
                <MenuOutlined style={{ fontSize: 18 }} />
              ) : collapsed ? (
                <MenuUnfoldOutlined style={{ fontSize: 18 }} />
              ) : (
                <MenuFoldOutlined style={{ fontSize: 18 }} />
              )
            }
            onClick={isMobile ? onToggleMobileDrawer : onToggleCollapse}
            style={{ fontSize: 16, width: 40, height: 40 }}
          />

          {!isMobile && <TeacherBreadcrumb />}
        </Space>

        {/* Right Side: Notifications & User Dropdown */}
        <Space size={20} align="center">
          <Tooltip title="Thông báo">
            <Badge count={0} size="small">
              <Button
                type="text"
                shape="circle"
                icon={<BellOutlined style={{ fontSize: 18, color: "#595959" }} />}
              />
            </Badge>
          </Tooltip>

          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                padding: "4px 8px",
                borderRadius: 8,
                transition: "background 0.2s",
              }}
              className="user-dropdown-trigger"
            >
              <Avatar
                src={(user as any)?.avatar || undefined}
                icon={!(user as any)?.avatar ? <UserOutlined /> : undefined}
                style={{ backgroundColor: "#1890ff", border: "1px solid #e6f7ff" }}
              />
              {!isMobile && (
                <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                  <Text strong style={{ display: "block", fontSize: 13 }}>
                    {user?.fullName || "Giảng viên"}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    Giảng viên
                  </Text>
                </div>
              )}
            </div>
          </Dropdown>
        </Space>
      </Header>
    );
  }
);

TeacherHeader.displayName = "TeacherHeader";
