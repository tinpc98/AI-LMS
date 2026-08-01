import { Breadcrumb } from "antd";
import { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import styles from "./adminLayout.module.css";

const labelMap: Record<string, string> = {
  admin: "Admin",
  accounts: "Account Management",
  courses: "Course Management",
  classes: "Class Management",
  "teacher-assignment": "Teacher Assignment",
  "ai-management": "AI Management",
  reports: "Reports",
  profile: "My Profile",
  system: "System Management",
};

const Breadcrumbs = () => {
  const location = useLocation();

  const items = useMemo(() => {
    const segments = location.pathname.split("/").filter(Boolean);
    const adminIndex = segments.indexOf("admin");
    const tailSegments = adminIndex >= 0 ? segments.slice(adminIndex + 1) : [];

    const builtItems = tailSegments.map((segment, index) => {
      const path = `/admin/${tailSegments.slice(0, index + 1).join("/")}`;
      const label = labelMap[segment] ?? segment.replace(/-/g, " ");

      return {
        title: <Link to={path}>{label}</Link>,
      };
    });

    return [{ title: <Link to="/admin">Dashboard</Link> }, ...builtItems];
  }, [location.pathname]);

  return <Breadcrumb className={styles.breadcrumb} items={items} />;
};

export default Breadcrumbs;
