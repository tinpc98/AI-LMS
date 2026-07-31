import React, { useState } from "react";
import { Tabs, Card, Typography, Breadcrumb, message } from "antd";
import {
  BarChartOutlined,
  UserOutlined,
  BookOutlined,
  TeamOutlined,
  AppstoreOutlined,
  CheckSquareOutlined,
  FileTextOutlined,
  RobotOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { ReportFilter } from "../components/ReportFilter";
import type { FilterValues } from "../components/ReportFilter";
import { ReportOverview } from "../components/ReportOverview";
import { StudentReport } from "../components/StudentReport";
import { CourseReport } from "../components/CourseReport";
import { TeacherReport } from "../components/TeacherReport";
import { ClassReport } from "../components/ClassReport";
import { AttendanceReport } from "../components/AttendanceReport";
import { ExamReport } from "../components/ExamReport";
import { AIAnalytics } from "../components/AIAnalytics";

const { Title, Paragraph } = Typography;

export const ReportPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [, setFilters] = useState<FilterValues>({});

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };

  const handleResetFilters = () => {
    setFilters({});
    message.info("Đã làm mới bộ lọc báo cáo");
  };

  const handleExport = () => {
    message.success("Đang xuất dữ liệu báo cáo sang định dạng Excel/PDF...");
  };

  const tabItems = [
    {
      key: "overview",
      label: (
        <span className="flex items-center gap-2">
          <BarChartOutlined /> Tổng Quan
        </span>
      ),
      children: <ReportOverview />,
    },
    {
      key: "students",
      label: (
        <span className="flex items-center gap-2">
          <UserOutlined /> Học Sinh
        </span>
      ),
      children: <StudentReport />,
    },
    {
      key: "courses",
      label: (
        <span className="flex items-center gap-2">
          <BookOutlined /> Khóa Học
        </span>
      ),
      children: <CourseReport />,
    },
    {
      key: "teachers",
      label: (
        <span className="flex items-center gap-2">
          <TeamOutlined /> Giáo Viên
        </span>
      ),
      children: <TeacherReport />,
    },
    {
      key: "classes",
      label: (
        <span className="flex items-center gap-2">
          <AppstoreOutlined /> Lớp Học
        </span>
      ),
      children: <ClassReport />,
    },
    {
      key: "attendance",
      label: (
        <span className="flex items-center gap-2">
          <CheckSquareOutlined /> Điểm Danh
        </span>
      ),
      children: <AttendanceReport />,
    },
    {
      key: "exams",
      label: (
        <span className="flex items-center gap-2">
          <FileTextOutlined /> Kỳ Thi
        </span>
      ),
      children: <ExamReport />,
    },
    {
      key: "ai",
      label: (
        <span className="flex items-center gap-2">
          <RobotOutlined /> Phân Tích AI
        </span>
      ),
      children: <AIAnalytics />,
    },
  ];

  return (
    <div className="p-6 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <Breadcrumb
          items={[
            {
              title: (
                <span className="flex items-center gap-1">
                  <HomeOutlined /> Trang chủ
                </span>
              ),
            },
            { title: "Báo cáo & Thống kê" },
          ]}
          className="mb-2 text-xs text-gray-500"
        />
        <div className="flex justify-between items-center">
          <div>
            <Title level={2} className="!mb-1 font-bold text-gray-800">
              Báo Cáo & Phân Tích Dữ Liệu LMS
            </Title>
            <Paragraph className="text-gray-500 !mb-0">
              Hệ thống theo dõi toàn diện hiệu suất học tập, khóa học, giáo viên và hoạt động trợ lý
              AI.
            </Paragraph>
          </div>
        </div>
      </div>

      {/* Global Filter Bar */}
      <ReportFilter
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        onExport={handleExport}
      />

      {/* Main Tabs Navigation */}
      <Card className="rounded-xl border border-gray-100 shadow-sm">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="line"
          size="large"
          tabBarStyle={{ marginBottom: 24 }}
        />
      </Card>
    </div>
  );
};

export default ReportPage;
