import React, { useState } from "react";
import { Layout, Button, Space, Avatar, Dropdown, Typography, Tag } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { TeacherBreadcrumb } from "./TeacherBreadcrumb";
import { useAuth } from "../../../hooks/useAuth";
import { useNotifications } from "../../../../features/notification/hooks/useNotifications";
import { NotificationDropdown } from "../student/NotificationDropdown";
import ChangePasswordModal from "../../../../features/profile/components/ChangePasswordModal";

import { tokens } from "../../../theme/tokens";
import { ThemeToggle } from "../../ThemeToggle";

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
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

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
        onClick: () => setIsPasswordModalOpen(true),
      },
      {
        key: "logout",
        icon: <LogoutOutlined style={{ color: tokens.color.semantic.error.base }} />,
        danger: true,
        label: "Đăng xuất",
        onClick: logout,
      },
    ];

    return (
      <>
        <Header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 99,
            padding: isMobile ? "0 12px" : "0 24px",
            background: tokens.color.bg.surface,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
            borderBottom: `1px solid ${tokens.color.border.default}`,
            height: 64,
          }}
        >
          {/* Left Side: Collapse Button & Breadcrumb */}
          <Space size={isMobile ? 8 : 16} align="center">
            <Button
              type="text"
              icon={
                isMobile ? (
                  <MenuOutlined style={{ fontSize: 20 }} />
                ) : collapsed ? (
                  <MenuUnfoldOutlined style={{ fontSize: 20 }} />
                ) : (
                  <MenuFoldOutlined style={{ fontSize: 20 }} />
                )
              }
              onClick={isMobile ? onToggleMobileDrawer : onToggleCollapse}
              style={{
                fontSize: 18,
                width: 44,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Menu"
            />

            {!isMobile && <TeacherBreadcrumb />}
          </Space>

          {/* Right Side: Notifications & User Dropdown */}
          <Space size={isMobile ? 12 : 20} align="center">
            <ThemeToggle />

            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              loading={loading}
              markAsRead={markAsRead}
              markAllAsRead={markAllAsRead}
            />

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  cursor: "pointer",
                  padding: "4px 8px",
                  borderRadius: tokens.radius.md,
                  minHeight: 44,
                  transition: "background-color var(--duration-fast) var(--ease-out)",
                }}
                className="user-dropdown-trigger"
              >
                <Avatar
                  src={(user as any)?.avatar || undefined}
                  icon={!(user as any)?.avatar ? <UserOutlined /> : undefined}
                  style={{ backgroundColor: tokens.color.action.primaryBg }}
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
        <ChangePasswordModal
          open={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      </>
    );
  }
);

TeacherHeader.displayName = "TeacherHeader";
