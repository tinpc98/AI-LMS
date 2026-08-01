import {
  ApartmentOutlined,
  BarChartOutlined,
  BookOutlined,
  DashboardOutlined,
  RobotOutlined,
  SettingOutlined,
  TeamOutlined,
  UsergroupAddOutlined,
} from "@ant-design/icons";
import { Drawer, Layout, Menu } from "antd";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { AdminMenuItem } from "../../../interface/layout";
import styles from "./adminLayout.module.css";

interface AdminSidebarProps {
  collapsed: boolean;
  onCollapse: (value: boolean) => void;
  isMobile: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const adminMenuItems: AdminMenuItem[] = [
  { key: "dashboard", label: "Dashboard", path: "/admin", icon: <DashboardOutlined /> },
  {
    key: "accounts",
    label: "Account Management",
    path: "/admin/accounts",
    icon: <UsergroupAddOutlined />,
  },
  { key: "courses", label: "Course Management", path: "/admin/courses", icon: <BookOutlined /> },
  {
    key: "classes",
    label: "Class Management",
    path: "/admin/classes",
    icon: <ApartmentOutlined />,
  },
  {
    key: "teachers",
    label: "Teacher Assignment",
    path: "/admin/teacher-assignment",
    icon: <TeamOutlined />,
  },
  { key: "ai", label: "AI Management", path: "/admin/ai-management", icon: <RobotOutlined /> },
  { key: "reports", label: "Reports", path: "/admin/reports", icon: <BarChartOutlined /> },
  {
    key: "system",
    label: "System Management",
    path: "/admin/system",
    icon: <SettingOutlined />,
    children: [{ key: "system-settings", label: "Settings", path: "/admin/system" }],
  },
];

const flattenMenuItems = (items: AdminMenuItem[]) =>
  items.flatMap((item) => (item.children ? [item, ...item.children] : [item]));

const getSelectedKey = (pathname: string) => {
  const normalizedPath = pathname.replace(/\/$/, "");

  const flattened = flattenMenuItems(adminMenuItems);

  // Ưu tiên route dài nhất trước
  const match = flattened
    .sort((a, b) => b.path.length - a.path.length)
    .find((item) => normalizedPath === item.path || normalizedPath.startsWith(`${item.path}/`));

  return match?.key ?? "dashboard";
};

const AdminSidebar = ({
  collapsed,
  onCollapse,
  isMobile,
  mobileOpen,
  onMobileClose,
}: AdminSidebarProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const selectedKey = useMemo(() => getSelectedKey(location.pathname), [location.pathname]);

  const renderMenu = () => (
    <div className={styles.siderContent}>
      <div className={styles.logoArea}>
        <div className={styles.logoBadge}>AI</div>
        {!collapsed && (
          <div>
            <div className={styles.logoTitle}>AI LMS</div>
            <div className={styles.logoSubtitle}>Admin Center</div>
          </div>
        )}
      </div>

      <Menu
        className={styles.navMenu}
        mode="inline"
        selectedKeys={[selectedKey]}
        defaultOpenKeys={isMobile ? [] : ["system"]}
        inlineCollapsed={collapsed && !isMobile}
        items={adminMenuItems.map((item) => ({
          key: item.key,
          icon: item.icon,
          label: item.label,
          children: item.children?.map((child) => ({
            key: child.key,
            label: child.label,
            onClick: () => navigate(child.path),
          })),
          onClick: () => navigate(item.path),
        }))}
        onClick={({ key }) => {
          const match = flattenMenuItems(adminMenuItems).find((item) => item.key === key);
          if (match) {
            navigate(match.path);
          }
        }}
      />
    </div>
  );

  if (isMobile) {
    return (
      <Drawer
        placement="left"
        open={mobileOpen}
        onClose={onMobileClose}
        width={240}
        closable={false}
        className={styles.mobileDrawer}
        styles={{ body: { padding: 0 } }}
      >
        {renderMenu()}
      </Drawer>
    );
  }

  return (
    <Layout.Sider
      width={240}
      collapsedWidth={80}
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      className={styles.sider}
      trigger={null}
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        height: "100vh",
        zIndex: 1000,
      }}
    >
      {renderMenu()}
    </Layout.Sider>
  );
};

export default AdminSidebar;
