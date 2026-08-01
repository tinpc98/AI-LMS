import React, { useCallback } from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom";

import { useResponsiveLayout } from "../../hooks/useResponsiveLayout";

import { StudentSidebar } from "./student/StudentSidebar";
import { StudentHeader } from "./student/StudentHeader";
import { StudentContent } from "./student/StudentContent";
import { AIChatWidget } from "../../../features/ai/components/AIChatWidget";

export const HomeLayoutStudent: React.FC = () => {
  // Bố cục responsive: trạng thái đầu tiên được tính NGAY LÚC KHỞI TẠO nên không còn
  // nhịp render hiển thị sai bố cục. Xem ghi chú đầy đủ trong useResponsiveLayout.
  const {
    isMobile,
    collapsed,
    mobileOpen,
    setCollapsed,
    toggleCollapse,
    toggleMobileDrawer,
    closeMobileDrawer: handleMobileClose,
  } = useResponsiveLayout();

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* 1. Sidebar Navigation */}
      <StudentSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
        isMobile={isMobile}
      />

      {/* 2. Main Content Layout Area */}
      <Layout style={{ flex: 1, minWidth: 0 }}>
        {/* Sticky Header */}
        <StudentHeader
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onToggleMobileDrawer={toggleMobileDrawer}
          isMobile={isMobile}
        />

        {/* Dynamic Page Content */}
        <StudentContent>
          <Outlet />
        </StudentContent>
      </Layout>

      {/* Global AI Chat Widget for Student */}
      <AIChatWidget />
    </Layout>
  );
};

export default HomeLayoutStudent;
