import React, { useState, useEffect, useCallback } from "react";
import { Layout } from "antd";
import { Outlet } from "react-router-dom";

import { TeacherSidebar } from "./teacher/TeacherSidebar";
import { TeacherHeader } from "./teacher/TeacherHeader";
import { TeacherContent } from "./teacher/TeacherContent";

const HomeLayoutTeacher: React.FC = () => {
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [mobileOpen, setMobileOpen] = useState<boolean>(false);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Auto detect viewport width for responsive behavior
  const handleResize = useCallback(() => {
    const width = window.innerWidth;
    if (width < 768) {
      setIsMobile(true);
      setCollapsed(false);
    } else if (width < 1024) {
      setIsMobile(false);
      setCollapsed(true);
    } else {
      setIsMobile(false);
      setCollapsed(false);
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [handleResize]);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const toggleMobileDrawer = useCallback(() => {
    setMobileOpen((prev) => !prev);
  }, []);

  const handleMobileClose = useCallback(() => {
    setMobileOpen(false);
  }, []);

  return (
    <Layout style={{ minHeight: "100vh", backgroundColor: "#f5f5f5" }}>
      {/* 1. Sidebar Navigation */}
      <TeacherSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
        isMobile={isMobile}
      />

      {/* 2. Main Content Layout Area */}
      <Layout style={{ flex: 1, minWidth: 0 }}>
        {/* Sticky Header */}
        <TeacherHeader
          collapsed={collapsed}
          onToggleCollapse={toggleCollapse}
          onToggleMobileDrawer={toggleMobileDrawer}
          isMobile={isMobile}
        />

        {/* Dynamic Page Content */}
        <TeacherContent>
          <Outlet />
        </TeacherContent>
      </Layout>
    </Layout>
  );
};

export default HomeLayoutTeacher;
