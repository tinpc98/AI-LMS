import React, { useMemo } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";
import { HomeOutlined } from "@ant-design/icons";

const breadcrumbNameMap: Record<string, string> = {
  "/student": "Trang chủ Dashboard",
  "/student/myclasses": "Lớp học của tôi",
  "/student/classdetail": "Chi tiết lớp học",
  "/student/studentassignment": "Bài tập sinh viên",
  "/student/lessonview": "Nội dung bài học",
  "/student/notification": "Thông báo",
  "/student/profile": "Hồ sơ cá nhân",
};

export const StudentBreadcrumb: React.FC = React.memo(() => {
  const location = useLocation();

  const breadcrumbItems = useMemo(() => {
    const pathSnippets = location.pathname.split("/").filter((i) => i);

    if (pathSnippets.length === 0) {
      return [
        {
          title: (
            <Link to="/student">
              <HomeOutlined /> <span style={{ marginLeft: 4 }}>Trang chủ</span>
            </Link>
          ),
        },
      ];
    }

    const extraItems = pathSnippets.map((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join("/")}`;

      const baseRouteKey = Object.keys(breadcrumbNameMap).find(
        (key) => key !== "/student" && (url === key || url.startsWith(`${key}/`))
      );

      const title = baseRouteKey ? breadcrumbNameMap[baseRouteKey] : pathSnippets[index];
      const isLast = index === pathSnippets.length - 1;

      return {
        title: isLast ? title : <Link to={url}>{title}</Link>,
      };
    });

    return [
      {
        title: (
          <Link to="/student">
            <HomeOutlined />
          </Link>
        ),
      },
      ...extraItems,
    ];
  }, [location.pathname]);

  return <Breadcrumb items={breadcrumbItems} style={{ margin: 0 }} />;
});

StudentBreadcrumb.displayName = "StudentBreadcrumb";

export default StudentBreadcrumb;
