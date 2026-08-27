import React from "react";
import { Row, Col, Card, Statistic, Tag, Skeleton, Alert } from "antd";
import { UserOutlined, TeamOutlined, BookOutlined, CheckCircleOutlined } from "@ant-design/icons";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useDashboardQuery } from "../../../features/dashboard/hooks/useDashboardQuery";

const COLORS = [
  "var(--color-action-primary-bg)",
  "var(--color-success-base)",
  "var(--color-warning-base)",
  "var(--color-error-base)",
  "var(--color-secondary-icon)",
  "var(--color-info-base)",
];

export const ReportOverview: React.FC = () => {
  const { data, loading, error, registrationChart, courseDistribution, classStatusChart, aiChart } =
    useDashboardQuery();

  if (loading) return <Skeleton active paragraph={{ rows: 10 }} />;
  if (error)
    return <Alert type="error" message="Lỗi tải dữ liệu báo cáo" description={error.message} />;
  if (!data) return <Alert type="info" message="Chưa có dữ liệu" />;

  const studentsCount = data.activeStudents || 0;
  const teachersCount = data.activeTeachers || 0;
  const totalCourses = data.totalCourses || 0;
  const totalClasses = data.totalClasses || 0;
  const activeClasses = data.activeClasses || 0;

  const monthlyTrendData = registrationChart.length > 0 ? registrationChart : [];

  const classStatusData = classStatusChart.map((item) => ({
    name: item.status,
    value: item.count,
  }));

  const aiFeatureData = aiChart.length > 0 ? aiChart : [];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card className="rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-500 font-medium">Tổng Học Sinh</span>}
              value={studentsCount}
              prefix={<UserOutlined className="text-blue-500 mr-2 p-2 bg-blue-50 rounded-lg" />}
            />
            <div className="mt-3 text-xs text-gray-400">
              Đang hoạt động: {studentsCount} tài khoản
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card className="rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-500 font-medium">Giáo Viên & Trợ Giảng</span>}
              value={teachersCount}
              prefix={<TeamOutlined className="text-purple-500 mr-2 p-2 bg-purple-50 rounded-lg" />}
            />
            <div className="mt-3 text-xs text-gray-400">Giáo viên active: {teachersCount}</div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={8}>
          <Card className="rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-500 font-medium">Khóa Học & Lớp Học</span>}
              value={totalClasses}
              prefix={
                <BookOutlined className="text-emerald-500 mr-2 p-2 bg-emerald-50 rounded-lg" />
              }
              suffix={
                <Tag color="emerald" className="ml-2 rounded-full">
                  <CheckCircleOutlined /> {activeClasses} Đang mở
                </Tag>
              }
            />
            <div className="mt-3 text-xs text-gray-400">Tổng số khóa học: {totalCourses} khóa</div>
          </Card>
        </Col>
      </Row>
      {/*
        Đã bỏ card "Yêu Cầu AI Đã Xử Lý" (aiLogsCount*420||3100 — số cố định không có nguồn),
        card "Tỷ lệ lấp đầy lớp học" và "Phòng học Live Session" (capacity/enrolled/liveSessions
        đều hardcode 0, kèm tag "LIVE NOW" gây hiểu nhầm là đang theo dõi thời gian thực) và các
        tag tăng trưởng +14.2%/+5.0%/+28% (không có dữ liệu trend thật). Chỉ thêm lại khi có
        API tổng hợp thật cho các số liệu này.
      */}

      {/* Charts Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card
            title="Xu hướng tăng trưởng Hệ thống (6 tháng qua)"
            className="rounded-xl shadow-sm border border-gray-100"
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTrendData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="5%"
                        stopColor="var(--color-action-primary-bg)"
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="95%"
                        stopColor="var(--color-action-primary-bg)"
                        stopOpacity={0}
                      />
                    </linearGradient>
                    <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-secondary-icon)" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="var(--color-secondary-icon)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border-default)"
                  />
                  <XAxis dataKey="month" tickLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="students"
                    name="Học sinh"
                    stroke="var(--color-action-primary-bg)"
                    fillOpacity={1}
                    fill="url(#colorStudents)"
                  />
                  <Area
                    type="monotone"
                    dataKey="aiUsage"
                    name="Lượt dùng AI"
                    stroke="var(--color-secondary-icon)"
                    fillOpacity={1}
                    fill="url(#colorAI)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card
            title="Phân bố Trạng thái Lớp học"
            className="rounded-xl shadow-sm border border-gray-100"
          >
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={classStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {classStatusData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* AI Usage Bar Chart */}
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Card
            title="Thống kê Tần suất Sử dụng Tính năng AI trong Hệ thống"
            className="rounded-xl shadow-sm border border-gray-100"
          >
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aiFeatureData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="var(--color-border-default)"
                  />
                  <XAxis dataKey="feature" tickLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar
                    dataKey="usage"
                    name="Lượt tương tác"
                    fill="var(--color-secondary-icon)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default ReportOverview;
