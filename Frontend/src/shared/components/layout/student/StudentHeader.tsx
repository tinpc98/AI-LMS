import React, { useState } from "react";
import { Layout, Button, Space, Avatar, Dropdown, Typography, Tag, Input } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MenuOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  SearchOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { StudentBreadcrumb } from "./StudentBreadcrumb";
import { useAuth } from "../../../hooks/useAuth";
import { useNotifications } from "../../../../features/notification/hooks/useNotifications";
import { NotificationDropdown } from "./NotificationDropdown";
import ChangePasswordModal from "../../../../features/profile/components/ChangePasswordModal";

import { tokens } from "../../../theme/tokens";
import { CloseOutlined } from "@ant-design/icons";
import { ThemeToggle } from "../../ThemeToggle";
import { useTheme } from "../../../context/ThemeContext";

const { Header } = Layout;
const { Text } = Typography;

interface StudentHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onToggleMobileDrawer: () => void;
  isMobile: boolean;
}

export const StudentHeader: React.FC<StudentHeaderProps> = React.memo(
  ({ collapsed, onToggleCollapse, onToggleMobileDrawer, isMobile }) => {
    const { user, logout } = useAuth();
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

    const userMenuItems: MenuProps["items"] = [
      {
        key: "user-info",
        label: (
          <div style={{ padding: "4px 8px" }}>
            <Text strong style={{ display: "block", fontSize: 14 }}>
              {user?.fullName || "Sinh viên"}
            </Text>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {user?.email || "student@lms.edu.vn"}
            </Text>
            <div style={{ marginTop: 6 }}>
              <Tag color="blue">Sinh viên</Tag>
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
          {/* Mobile Full-width Search Bar Mode */}
          {isMobile && mobileSearchOpen ? (
            <div style={{ display: "flex", alignItems: "center", width: "100%", gap: 8 }}>
              <Input
                autoFocus
                placeholder="Tìm kiếm khóa học, bài học, tài liệu..."
                prefix={<SearchOutlined style={{ color: tokens.color.text.disabled }} />}
                allowClear
                style={{
                  flex: 1,
                  borderRadius: tokens.radius.full,
                  backgroundColor: tokens.color.bg.page,
                  border: `1px solid ${tokens.color.border.default}`,
                  height: 44,
                  fontSize: 16,
                }}
              />
              <Button
                type="text"
                icon={<CloseOutlined style={{ fontSize: 18 }} />}
                onClick={() => setMobileSearchOpen(false)}
                style={{ width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label="Đóng tìm kiếm"
              />
            </div>
          ) : (
            <>
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

                {!isMobile && <StudentBreadcrumb />}
              </Space>

              {/* Center/Search Bar (Desktop / Tablet) */}
              {!isMobile && (
                <div style={{ flex: 1, maxWidth: 380, margin: "0 24px" }}>
                  <Input
                    placeholder="Tìm kiếm khóa học, bài học, tài liệu..."
                    prefix={<SearchOutlined style={{ color: tokens.color.text.disabled }} />}
                    allowClear
                    style={{
                      borderRadius: tokens.radius.full,
                      backgroundColor: tokens.color.bg.page,
                      border: `1px solid ${tokens.color.border.default}`,
                      height: 40,
                    }}
                  />
                </div>
              )}

              {/* Right Side: Search Icon (Mobile), Notifications & User Dropdown */}
              <Space size={isMobile ? 12 : 20} align="center">
                {/* Mobile Search Toggle Icon */}
                {isMobile && (
                  <Button
                    type="text"
                    icon={<SearchOutlined style={{ fontSize: 20 }} />}
                    onClick={() => setMobileSearchOpen(true)}
                    style={{
                      width: 44,
                      height: 44,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    aria-label="Mở tìm kiếm"
                  />
                )}

                <ThemeToggle />

                <NotificationDropdown
                  notifications={notifications}
                  unreadCount={unreadCount}
                  loading={loading}
                  markAsRead={markAsRead}
                  markAllAsRead={markAllAsRead}
                  viewAllPath="/student/notifications"
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
                          {user?.fullName || "Sinh viên"}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11 }}>
                          Sinh viên
                        </Text>
                      </div>
                    )}
                  </div>
                </Dropdown>
              </Space>
            </>
          )}
        </Header>
        <ChangePasswordModal
          open={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
        />
      </>
    );
  }
);

StudentHeader.displayName = "StudentHeader";

export default StudentHeader;
