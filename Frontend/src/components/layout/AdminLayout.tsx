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
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <Layout className={styles.layoutShell}>
      <AdminSidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Layout>
        <AdminHeader
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
          onMobileMenuOpen={() => setMobileOpen(true)}
          isMobile={isMobile}
        />

        <div className={styles.contentArea}>
          <div className={styles.contentCard}>
            <Outlet />
          </div>
        </div>

        <AdminFooter />
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
