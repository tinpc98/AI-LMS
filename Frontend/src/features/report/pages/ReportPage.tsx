import React, { useState } from "react";
import { Tabs, Card, Typography, Breadcrumb, message, Alert } from "antd";
import { BarChartOutlined, UserOutlined, TeamOutlined, HomeOutlined } from "@ant-design/icons";
import { ReportFilter } from "../components/ReportFilter";
import type { FilterValues } from "../components/ReportFilter";
import { ReportOverview } from "../components/ReportOverview";
import { StudentReport } from "../components/StudentReport";
import { TeacherReport } from "../components/TeacherReport";

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
      key: "teachers",
      label: (
        <span className="flex items-center gap-2">
          <TeamOutlined /> Giáo Viên
        </span>
      ),
      children: <TeacherReport />,
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
