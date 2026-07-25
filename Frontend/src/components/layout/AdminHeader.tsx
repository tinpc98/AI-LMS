import {
  BellOutlined,
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

interface AdminHeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onMobileMenuOpen: () => void;
  isMobile: boolean;
}

const AdminHeader = ({ collapsed, onToggleCollapse, onMobileMenuOpen, isMobile }: AdminHeaderProps) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    navigate("/login", { replace: true });
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
      key: "logout",
      label: "Logout",
      icon: <LogoutOutlined />,
      onClick: handleLogout,
    },
  ];

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <Button
          type="text"
          icon={isMobile ? <MenuUnfoldOutlined /> : collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={isMobile ? onMobileMenuOpen : onToggleCollapse}
          className={styles.headerButton}
        />

        <div className={styles.breadcrumbWrap}>
          <Breadcrumbs />
        </div>
      </div>

      <div className={styles.headerActions}>
        <Button type="text" icon={<BellOutlined />} className={styles.headerButton} />

        <Dropdown menu={{ items: dropdownItems }} placement="bottomRight" trigger={["click"]}>
          <Space className={styles.userArea}>
            <Badge dot color="#52c41a">
              <Avatar className={styles.avatar}>A</Avatar>
            </Badge>
            <span className={styles.userName}>Admin</span>
          </Space>
        </Dropdown>
      </div>
    </header>
  );
};

export default AdminHeader;
