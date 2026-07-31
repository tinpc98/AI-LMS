import React from "react";
import { Row, Col, Card, Statistic, Tag, Progress } from "antd";
import {
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  RobotOutlined,
  RiseOutlined,
  CheckCircleOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
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
import { mockUsers } from "../../../features/accountManagement/account.mock";
import { mockCourses } from "../../../features/courseManagement/course.mock";
import { mockClasses } from "../../../features/classManagement/class.mock";
import { mockAILogs } from "../../../features/aiManagement/mock/aiLogs.mock";
import { mockLiveSessions } from "../../../features/classManagement/liveSessions.mock";

const COLORS = ["#1677ff", "#52c41a", "#faad14", "#ff4d4f", "#722ed1", "#13c2c2"];

export const ReportOverview: React.FC = () => {
  const students = mockUsers.filter((u) => u.role === "Student");
  const teachers = mockUsers.filter((u) => u.role === "Teacher");
  const totalCourses = mockCourses.length;
  const totalClasses = mockClasses.length;
  const activeClasses = mockClasses.filter((c) => c.status === "Active").length;
  const liveSessionsCount = mockLiveSessions.length;
  const aiLogsCount = mockAILogs.length;

  const totalCapacity = mockClasses.reduce((acc, curr) => acc + curr.maxStudents, 0);
  const totalEnrolled = mockClasses.reduce((acc, curr) => acc + curr.currentStudents, 0);
  const fillRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;

  // Chart Data Preparation
  const monthlyTrendData = [
    { month: "Tháng 2", students: 120, teachers: 12, courses: 8, aiUsage: 450 },
    { month: "Tháng 3", students: 280, teachers: 18, courses: 10, aiUsage: 780 },
    { month: "Tháng 4", students: 450, teachers: 24, courses: 12, aiUsage: 1100 },
    { month: "Tháng 5", students: 680, teachers: 30, courses: 14, aiUsage: 1650 },
    { month: "Tháng 6", students: 920, teachers: 36, courses: 16, aiUsage: 2300 },
    { month: "Tháng 7", students: 1250, teachers: 42, courses: 18, aiUsage: 3100 },
  ];

  const classStatusData = [
    {
      name: "Đang diễn ra (Active)",
      value: mockClasses.filter((c) => c.status === "Active").length,
    },
    { name: "Sắp mở (Upcoming)", value: mockClasses.filter((c) => c.status === "Upcoming").length },
    {
      name: "Đã hoàn thành (Completed)",
      value: mockClasses.filter((c) => c.status === "Completed").length,
    },
  ];

  const aiFeatureData = [
    {
      feature: "Chatbot AI",
      usage: mockAILogs.filter((l) => l.feature === "Chatbot").length * 45 + 120,
    },
    {
      feature: "Tóm tắt bài học",
      usage: mockAILogs.filter((l) => l.feature === "Summary").length * 35 + 85,
    },
    {
      feature: "Tạo trắc nghiệm",
      usage: mockAILogs.filter((l) => l.feature === "Quiz").length * 28 + 60,
    },
    {
      feature: "Chấm điểm tự động",
      usage: mockAILogs.filter((l) => l.feature === "Exam").length * 19 + 40,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-500 font-medium">Tổng Học Sinh</span>}
              value={students.length * 250 || 1250}
              prefix={<UserOutlined className="text-blue-500 mr-2 p-2 bg-blue-50 rounded-lg" />}
              suffix={
                <Tag color="blue" className="ml-2 rounded-full">
                  <RiseOutlined /> +14.2%
                </Tag>
              }
            />
            <div className="mt-3 text-xs text-gray-400">
              Đang hoạt động: {students.length} tài khoản mẫu
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-500 font-medium">Giáo Viên & Trợ Giảng</span>}
              value={teachers.length * 10 || 42}
              prefix={<TeamOutlined className="text-purple-500 mr-2 p-2 bg-purple-50 rounded-lg" />}
              suffix={
                <Tag color="purple" className="ml-2 rounded-full">
                  <RiseOutlined /> +5.0%
                </Tag>
              }
            />
            <div className="mt-3 text-xs text-gray-400">
              Giáo viên active: {teachers.filter((t) => t.status === "Active").length}
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
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

        <Col xs={24} sm={12} lg={6}>
          <Card className="rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <Statistic
              title={<span className="text-gray-500 font-medium">Yêu Cầu AI Đã Xử Lý</span>}
              value={aiLogsCount * 420 || 3100}
              prefix={<RobotOutlined className="text-amber-500 mr-2 p-2 bg-amber-50 rounded-lg" />}
              suffix={
                <Tag color="amber" className="ml-2 rounded-full">
                  <RiseOutlined /> +28%
                </Tag>
              }
            />
            <div className="mt-3 text-xs text-gray-400">Phản hồi trung bình: ~950ms</div>
          </Card>
        </Col>
      </Row>

      {/* Progress metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card
            title="Tỷ lệ lấp đầy lớp học"
            className="rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium">Học sinh đăng ký / Tổng chỗ</span>
              <span className="font-bold text-blue-600">
                {totalEnrolled} / {totalCapacity} ({fillRate}%)
              </span>
            </div>
            <Progress
              percent={fillRate}
              status="active"
              strokeColor={{ "0%": "#108ee9", "100%": "#87d068" }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card
            title="Phòng học trực tuyến Live Session"
            className="rounded-xl shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <VideoCameraOutlined className="text-2xl text-red-500 p-3 bg-red-50 rounded-xl" />
                <div>
                  <div className="text-lg font-bold text-gray-800">
                    {liveSessionsCount} Phòng học đang hoạt động
                  </div>
                  <div className="text-xs text-gray-500">Nền tảng tích hợp Jitsi & Zoom SDK</div>
                </div>
              </div>
              <Tag
                color="red"
                className="px-3 py-1 text-xs font-semibold rounded-full animate-pulse"
              >
                ● LIVE NOW
              </Tag>
            </div>
          </Card>
        </Col>
      </Row>

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
                      <stop offset="5%" stopColor="#1677ff" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#722ed1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#722ed1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" tickLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="students"
                    name="Học sinh"
                    stroke="#1677ff"
                    fillOpacity={1}
                    fill="url(#colorStudents)"
                  />
                  <Area
                    type="monotone"
                    dataKey="aiUsage"
                    name="Lượt dùng AI"
                    stroke="#722ed1"
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
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="feature" tickLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="usage" name="Lượt tương tác" fill="#4f46e5" radius={[6, 6, 0, 0]} />
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
