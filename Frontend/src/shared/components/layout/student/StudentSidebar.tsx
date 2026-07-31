import React, { useMemo } from "react";
import { Layout, Menu, Drawer, Typography, Tag, Avatar, Space, Button } from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  BookOutlined,
  CalendarOutlined,
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../../hooks/useAuth";

const { Sider } = Layout;
const { Text, Title } = Typography;

interface StudentSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  isMobile: boolean;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = React.memo(
  ({ collapsed, onCollapse, mobileOpen, onMobileClose, isMobile }) => {
    const location = useLocation();
    const { user, logout } = useAuth();

    // Menu Items - Only 5 items as strictly required
    const menuItems = useMemo(
      () => [
        {
          key: "/student",
          icon: <DashboardOutlined />,
          label: <Link to="/student">Dashboard</Link>,
        },
        {
          key: "/student/myclasses",
          icon: <BookOutlined />,
          label: <Link to="/student/myclasses">Lớp học của tôi</Link>,
        },
        {
          key: "/student/notification",
          icon: <BellOutlined />,
          label: <Link to="/student/notification">Thông báo</Link>,
        },
        {
          key: "/student/profile",
          icon: <UserOutlined />,
          label: <Link to="/student/profile">Hồ sơ</Link>,
        },
      ],
      []
    );

    // Dynamic active key detection
    const selectedKeys = useMemo(() => {
      const path = location.pathname;
      if (path === "/student" || path === "/" || path === "") return ["/student"];
      if (path.startsWith("/student/classdetail")) return ["/student/myclasses"];
      const matched = menuItems.find(
        (item) => item.key !== "/student" && path.startsWith(item.key)
      );
      return matched ? [matched.key] : ["/student"];
    }, [location.pathname, menuItems]);

    // Internal Sidebar content
    const sidebarContent = (
      <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Brand Header */}
        <div
          style={{
            padding: collapsed && !isMobile ? "16px 8px" : "20px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            justifyContent: collapsed && !isMobile ? "center" : "flex-start",
          }}
        >
          <Avatar
            size={40}
            src="https://lh3.googleusercontent.com/aida/AP1WRLvagpzKtenUGkwvil3flrlIoVX_D0iCWi-3VslBm3FkRhANSzVIsUi1Cz99-VHB0rcjFN3qbRILR21PAmzAgTe7Uh4SQbnwzWJmJmNtFxaZM27JkknDwT91s80qhaUAbUGFEPZblkjmK0D-GvCscUXP2Eqt_Bz2L7w_Ww_RrgcvcEz5VGXCtnVL_OXcvU3o0kHJntd54PGRJuaxLXdnR2ejPUqBd6zU44o6yObVmaqPNFfCrz9GD_Ac3VPA"
            style={{ backgroundColor: "#1890ff", flexShrink: 0 }}
          />
          {(!collapsed || isMobile) && (
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <Title
                level={5}
                style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 700 }}
                ellipsis
              >
                EduPortal AI
              </Title>
              <Tag color="blue" style={{ fontSize: 10, margin: 0, borderRadius: 4 }}>
                Student Portal
              </Tag>
            </div>
          )}
        </div>

        {/* Antd Menu */}
        <div style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={selectedKeys}
            items={menuItems}
            onClick={() => isMobile && onMobileClose()}
            style={{ borderRight: 0, backgroundColor: "transparent" }}
          />
        </div>

        {/* Footer User Info */}
        <div
          style={{
            padding: collapsed && !isMobile ? "12px 8px" : "16px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            backgroundColor: "rgba(0, 0, 0, 0.2)",
          }}
        >
          {!collapsed || isMobile ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Space size={10} style={{ minWidth: 0 }}>
                <Avatar
                  src={(user as any)?.avatar || undefined}
                  icon={!(user as any)?.avatar ? <UserOutlined /> : undefined}
                  style={{ backgroundColor: "#1890ff" }}
                />
                <div style={{ minWidth: 0, overflow: "hidden" }}>
                  <Text strong style={{ color: "#fff", display: "block", fontSize: 13 }} ellipsis>
                    {user?.fullName || "Sinh viên"}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }} ellipsis>
                    {user?.email || "student@lms.edu.vn"}
                  </Text>
                </div>
              </Space>
              <Button
                type="text"
                danger
                icon={<LogoutOutlined />}
                onClick={logout}
                title="Đăng xuất"
                style={{ color: "#ff7875" }}
              />
            </div>
          ) : (
            <div style={{ textAlign: "center" }}>
              <Button
                type="text"
                danger
                icon={<LogoutOutlined style={{ fontSize: 18 }} />}
                onClick={logout}
                title="Đăng xuất"
                style={{ color: "#ff7875" }}
              />
            </div>
          )}
        </div>
      </div>
    );

    // Mobile Drawer
    if (isMobile) {
      return (
        <Drawer
          placement="left"
          onClose={onMobileClose}
          open={mobileOpen}
          styles={{ body: { padding: 0, backgroundColor: "#001529" } }}
          width={260}
        >
          {sidebarContent}
        </Drawer>
      );
    }

    // Desktop / Tablet Antd Sider
    return (
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={onCollapse}
        breakpoint="lg"
        width={250}
        collapsedWidth={80}
        style={{
          overflow: "auto",
          height: "100vh",
          position: "sticky",
          top: 0,
          left: 0,
          zIndex: 100,
          boxShadow: "2px 0 8px rgba(0,21,41,0.15)",
        }}
        trigger={null}
      >
        {sidebarContent}
      </Sider>
    );
  }
);

StudentSidebar.displayName = "StudentSidebar";

export default StudentSidebar;
