import { Layout } from "antd";
import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import AdminFooter from "./AdminFooter";
import AdminHeader from "./AdminHeader";
import AdminSidebar from "./AdminSidebar";

import styles from "./adminLayout.module.css";

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const nextMobile = window.innerWidth < 768;

      setIsMobile(nextMobile);

      if (!nextMobile) {
        setMobileOpen(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <Layout
      className={styles.mainLayout}
      style={{
        marginLeft: collapsed ? 80 : 240,
      }}
    >
      {/* Sidebar fixed */}
      <AdminSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main area */}
      <Layout className={styles.mainLayout}>
        {/* Header */}
        <AdminHeader
          collapsed={collapsed}
          onToggleCollapse={() =>
            setCollapsed((prev) => !prev)
          }
          onMobileMenuOpen={() => setMobileOpen(true)}
          isMobile={isMobile}
        />

        {/* Scroll content only */}
        <main className={styles.contentArea}>
          <div className={styles.contentCard}>
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <AdminFooter />
      </Layout>
    </Layout>
  );
};

export default AdminLayout;