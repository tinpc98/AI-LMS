import React, { useMemo } from "react";
import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";
import { HomeOutlined } from "@ant-design/icons";

const breadcrumbNameMap: Record<string, string> = {
  "/teacher": "Trang chủ Dashboard",
  "/teacher/classes": "Quản lý lớp học",
  "/teacher/classroom-detail": "Chi tiết lớp học",
  "/teacher/attendance": "Điểm danh lớp học",
  "/teacher/lessonManagement": "Quản lý bài giảng",
  "/teacher/questionbank": "Ngân hàng câu hỏi",
  "/teacher/exammanagement": "Quản lý kỳ thi",
  "/teacher/examresults": "Kết quả kỳ thi",
  "/teacher/exam-review": "Chấm bài tự luận",
};

export const TeacherBreadcrumb: React.FC = React.memo(() => {
  const location = useLocation();

  const breadcrumbItems = useMemo(() => {
    const pathSnippets = location.pathname.split("/").filter((i) => i);
    
    const extraItems = pathSnippets.map((_, index) => {
      const url = `/${pathSnippets.slice(0, index + 1).join("/")}`;
      
      // Tìm nhãn phù hợp trong map hoặc lấy mẫu route gốc
      const baseRouteKey = Object.keys(breadcrumbNameMap).find(
        (key) => url === key || url.startsWith(`${key}/`)
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
          <Link to="/teacher">
            <HomeOutlined />
          </Link>
        ),
      },
      ...extraItems,
    ];
  }, [location.pathname]);

  return <Breadcrumb items={breadcrumbItems} style={{ margin: 0 }} />;
});

TeacherBreadcrumb.displayName = "TeacherBreadcrumb";
