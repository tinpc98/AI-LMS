import React, { useMemo } from "react";
import { Breadcrumb, Skeleton } from "antd";
import { Link, useLocation } from "react-router-dom";
import { HomeOutlined } from "@ant-design/icons";
import { useBreadcrumb } from "../../../context/BreadcrumbContext";

interface BreadcrumbItemDef {
  title?: React.ReactNode;
  path?: string;
  isHome?: boolean;
  isEntity?: boolean;
}

export const StudentBreadcrumb: React.FC = React.memo(() => {
  const location = useLocation();
  const { entityTitle, loading } = useBreadcrumb();

  const breadcrumbItems = useMemo(() => {
    const pathname = location.pathname.replace(/\/$/, "");
    const segments = pathname.split("/").filter(Boolean);

    // Mặc định cho trang chủ student
    if (segments.length <= 1 || pathname === "/student" || pathname === "/student/dashboard") {
      return [
        {
          title: (
            <Link to="/student" aria-label="Trang chủ" style={{ color: "var(--color-text-description)" }}>
              <HomeOutlined style={{ fontSize: 16 }} />
            </Link>
          ),
        },
      ];
    }

    const items: BreadcrumbItemDef[] = [{ isHome: true, path: "/student" }];

    // Match theo pattern route
    if (pathname === "/student/myclasses") {
      items.push({ title: "Lớp học của tôi" });
    } else if (pathname.startsWith("/student/classdetail/")) {
      items.push({ title: "Lớp học của tôi", path: "/student/myclasses" });
      items.push({ isEntity: true });
    } else if (pathname === "/student/studentassignment") {
      items.push({ title: "Bài tập sinh viên" });
    } else if (pathname.startsWith("/student/studentassignment/")) {
      items.push({ title: "Bài tập sinh viên", path: "/student/studentassignment" });
      items.push({ isEntity: true, title: "Chi tiết bài tập" });
    } else if (pathname.startsWith("/student/lessonview/")) {
      items.push({ title: "Lớp học của tôi", path: "/student/myclasses" });
      items.push({ isEntity: true, title: "Nội dung bài học" });
    } else if (pathname === "/student/notifications") {
      items.push({ title: "Thông báo" });
    } else {
      // Fallback cho các route khác
      const sectionKey = segments[1];
      const fallbackTitleMap: Record<string, string> = {
        myclasses: "Lớp học của tôi",
        studentassignment: "Bài tập sinh viên",
        classdetail: "Chi tiết lớp học",
        notifications: "Thông báo",
      };
      items.push({ title: fallbackTitleMap[sectionKey] || sectionKey });
      if (segments.length > 2) {
        items.push({ isEntity: true });
      }
    }

    return items.map((item, index) => {
      const isLast = index === items.length - 1;

      if (item.isHome) {
        return {
          title: (
            <Link to="/student" aria-label="Trang chủ" style={{ color: "var(--color-text-description)" }}>
              <HomeOutlined style={{ fontSize: 16 }} />
            </Link>
          ),
        };
      }

      if (item.isEntity) {
        if (loading || !entityTitle) {
          return {
            title: (
              <Skeleton.Input
                active
                size="small"
                style={{ width: 140, height: 16, borderRadius: 4, verticalAlign: "middle" }}
              />
            ),
          };
        }

        const displayTitle = entityTitle || (typeof item.title === "string" ? item.title : "Chi tiết");
        return {
          title: (
            <span
              style={{
                color: "var(--color-text-title)",
                fontWeight: 600,
                maxWidth: 240,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "inline-block",
                verticalAlign: "bottom",
              }}
              title={displayTitle}
            >
              {displayTitle}
            </span>
          ),
        };
      }

      if (isLast) {
        return {
          title: (
            <span
              style={{
                color: "var(--color-text-title)",
                fontWeight: 600,
                maxWidth: 240,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "inline-block",
                verticalAlign: "bottom",
              }}
            >
              {item.title}
            </span>
          ),
        };
      }

      return {
        title: item.path ? (
          <Link to={item.path} style={{ color: "var(--color-text-description)" }}>
            {item.title}
          </Link>
        ) : (
          <span style={{ color: "var(--color-text-description)" }}>{item.title}</span>
        ),
      };
    });
  }, [location.pathname, entityTitle, loading]);

  return <Breadcrumb items={breadcrumbItems} style={{ margin: 0 }} />;
});

StudentBreadcrumb.displayName = "StudentBreadcrumb";

export default StudentBreadcrumb;
