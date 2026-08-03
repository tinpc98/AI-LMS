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

export const TeacherBreadcrumb: React.FC = React.memo(() => {
  const location = useLocation();
  const { entityTitle, loading } = useBreadcrumb();

  const breadcrumbItems = useMemo(() => {
    const pathname = location.pathname.replace(/\/$/, "");
    const segments = pathname.split("/").filter(Boolean);

    // Mặc định cho trang chủ teacher
    if (segments.length <= 1 || pathname === "/teacher") {
      return [
        {
          title: (
            <Link to="/teacher" aria-label="Trang chủ" style={{ color: "var(--color-text-description)" }}>
              <HomeOutlined style={{ fontSize: 16 }} />
            </Link>
          ),
        },
      ];
    }

    const items: BreadcrumbItemDef[] = [{ isHome: true, path: "/teacher" }];

    // Match theo pattern route teacher
    if (pathname === "/teacher/classes" || pathname === "/teacher/classroom") {
      items.push({ title: "Quản lý lớp học" });
    } else if (pathname.startsWith("/teacher/classroom-detail/")) {
      items.push({ title: "Quản lý lớp học", path: "/teacher/classes" });
      items.push({ isEntity: true });
    } else if (pathname === "/teacher/questionbank") {
      items.push({ title: "Ngân hàng câu hỏi" });
    } else if (pathname.startsWith("/teacher/examresults/")) {
      items.push({ title: "Quản lý lớp học", path: "/teacher/classes" });
      items.push({ isEntity: true, title: "Kết quả kỳ thi" });
    } else if (pathname.startsWith("/teacher/exam-review/")) {
      items.push({ title: "Quản lý lớp học", path: "/teacher/classes" });
      items.push({ isEntity: true, title: "Chấm bài tự luận" });
    } else {
      const sectionKey = segments[1];
      const fallbackTitleMap: Record<string, string> = {
        classes: "Quản lý lớp học",
        classroom: "Quản lý lớp học",
        questionbank: "Ngân hàng câu hỏi",
        "classroom-detail": "Chi tiết lớp học",
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
            <Link to="/teacher" aria-label="Trang chủ" style={{ color: "var(--color-text-description)" }}>
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

TeacherBreadcrumb.displayName = "TeacherBreadcrumb";

export default TeacherBreadcrumb;
