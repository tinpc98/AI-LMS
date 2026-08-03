import React, { useState } from "react";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ProfileOutlined,
  LogoutOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { Avatar, Badge, Button, Dropdown, Space } from "antd";
import type { MenuProps } from "antd";
import { useNavigate } from "react-router-dom";
import Breadcrumbs from "./Breadcrumbs";
import styles from "./adminLayout.module.css";
import ChangePasswordModal from "../../../features/profile/components/ChangePasswordModal";
import { useNotifications } from "../../../features/notification/hooks/useNotifications";
import { NotificationDropdown } from "./student/NotificationDropdown";
import { ThemeToggle } from "../ThemeToggle";

interface AdminHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onMobileMenuOpen: () => void;
  isMobile: boolean;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({
  collapsed,
  onToggleCollapse,
  onMobileMenuOpen,
  isMobile,
}) => {
  const navigate = useNavigate();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState<boolean>(false);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  const handleMenuClick: MenuProps["onClick"] = (info) => {
    if (info.key === "profile") {
      navigate("/admin/profile");
    } else if (info.key === "password") {
      setIsPasswordModalOpen(true);
    } else if (info.key === "logout") {
      handleLogout();
    }
  };

  const dropdownItems: MenuProps["items"] = [
    {
      key: "profile",
      label: "My Profile",
      icon: <ProfileOutlined />,
    },
    {
      key: "password",
      label: "Change Password",
      icon: <LockOutlined />,
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
    },
  ];

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <Button
            type="text"
            icon={
              isMobile ? (
                <MenuUnfoldOutlined />
              ) : collapsed ? (
                <MenuUnfoldOutlined />
              ) : (
                <MenuFoldOutlined />
              )
            }
            onClick={isMobile ? onMobileMenuOpen : onToggleCollapse}
            className={styles.headerButton}
          />

          <div className={styles.breadcrumbWrap}>
            <Breadcrumbs />
          </div>
        </div>

        <div className={styles.headerActions}>
          <ThemeToggle />
          <NotificationDropdown
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            markAsRead={markAsRead}
            markAllAsRead={markAllAsRead}
          />

          <Dropdown
            menu={{
              items: dropdownItems,
              onClick: handleMenuClick,
            }}
            placement="bottomRight"
            trigger={["click"]}
          >
            <Space className={styles.userArea}>
              <Badge dot color="var(--color-success-base)">
                <Avatar className={styles.avatar}>A</Avatar>
              </Badge>
              <span className={styles.userName}>Admin</span>
            </Space>
          </Dropdown>
        </div>
      </header>

      <ChangePasswordModal
        open={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />
    </>
  );
};

export default AdminHeader;
