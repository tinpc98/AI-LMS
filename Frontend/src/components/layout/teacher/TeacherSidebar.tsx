import React, { useMemo } from "react";
import { Layout, Menu, Drawer, Typography, Tag, Avatar, Space, Button } from "antd";
import { Link, useLocation } from "react-router-dom";
import {
  DashboardOutlined,
  BookOutlined,
  FileTextOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useAuth } from "../../../hooks/useAuth";

const { Sider } = Layout;
const { Text, Title } = Typography;

interface TeacherSidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  isMobile: boolean;
}

export const TeacherSidebar: React.FC<TeacherSidebarProps> = React.memo(
  ({ collapsed, onCollapse, mobileOpen, onMobileClose, isMobile }) => {
    const location = useLocation();
    const { user, logout } = useAuth();

    // Mapping Menu items
    const menuItems = useMemo(
      () => [
        {
          key: "/teacher",
          icon: <DashboardOutlined />,
          label: <Link to="/teacher">Trang chủ Dashboard</Link>,
        },
        {
          key: "/teacher/classes",
          icon: <BookOutlined />,
          label: <Link to="/teacher/classes">Quản lý lớp học</Link>,
        },
        {
          key: "/teacher/questionbank",
          icon: <DatabaseOutlined />,
          label: <Link to="/teacher/questionbank">Ngân hàng câu hỏi</Link>,
        },
      ],
      []
    );

    // Dynamic active key detection
    const selectedKeys = useMemo(() => {
      const path = location.pathname;
      const matched = menuItems.find(
        (item) => path === item.key || (item.key !== "/teacher" && path.startsWith(item.key))
      );
      return matched ? [matched.key] : ["/teacher"];
    }, [location.pathname, menuItems]);

    // Internal Menu content
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
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkHipXsG3Jdqn_T1kn-iQLl2Rgp0xI8NBtwkLr3AVXSNtxKGcQtd_vjkQf3Nqy4bvn2cdUDnYhl8CrLatmVuOJEc5Thz15ltoUa3CDz-PJd-0j8e0eg2tskVHGYfd6MxAJBXUBxYSLxZY2TMqb-zZRzRpW7jDDO6GFnwr5QE5Ic2nWHSb7TS-VEM406cwmWV4b0vXD2nI0KEFO8c4sBMI-D2I-NJIt6KIo6522qWXOGZGyfHdA9l2oEGClirojk5JPXdilCbLLyPXS"
            style={{ backgroundColor: "#1890ff", flexShrink: 0 }}
          />
          {(!collapsed || isMobile) && (
            <div style={{ minWidth: 0, overflow: "hidden" }}>
              <Title level={5} style={{ color: "#fff", margin: 0, fontSize: 16, fontWeight: 700 }} ellipsis>
                EduPortal AI
              </Title>
              <Tag color="cyan" style={{ fontSize: 10, margin: 0, borderRadius: 4 }}>
                Teacher Portal
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
          {(!collapsed || isMobile) ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Space size={10} style={{ minWidth: 0 }}>
                <Avatar
                  src={user?.avatar || undefined}
                  icon={!user?.avatar ? <UserOutlined /> : undefined}
                  style={{ backgroundColor: "#1890ff" }}
                />
                <div style={{ minWidth: 0, overflow: "hidden" }}>
                  <Text strong style={{ color: "#fff", display: "block", fontSize: 13 }} ellipsis>
                    {user?.fullName || "Giảng viên"}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 11 }} ellipsis>
                    {user?.email || "teacher@lms.edu.vn"}
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

TeacherSidebar.displayName = "TeacherSidebar";
