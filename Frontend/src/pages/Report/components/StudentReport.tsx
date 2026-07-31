import React from "react";
import { Row, Col, Card, Table, Tag, Progress, Avatar, Statistic } from "antd";
import { UserOutlined, TrophyOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { mockUsers } from "../../../features/accountManagement/account.mock";
import { mockClasses } from "../../../features/classManagement/class.mock";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export const StudentReport: React.FC = () => {
  const students = mockUsers.filter((u) => u.role === "Student");
  const activeStudents = students.filter((u) => u.status === "Active").length;

  const studentPerformanceData = [
    { name: "Hoàng Văn E", math: 8.5, physics: 7.8, english: 9.0, avg: 8.4 },
    { name: "Đỗ Thị Phương", math: 9.2, physics: 8.8, english: 8.5, avg: 8.8 },
    { name: "Lê Văn C", math: 7.0, physics: 6.5, english: 7.5, avg: 7.0 },
    { name: "Nguyễn Văn D", math: 8.0, physics: 8.5, english: 8.2, avg: 8.2 },
    { name: "Trần Minh T", math: 9.5, physics: 9.0, english: 9.2, avg: 9.2 },
  ];

  const columns = [
    {
      title: "Học sinh",
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} className="bg-indigo-500" />
          <div>
            <div className="font-medium text-gray-800">{text}</div>
            <div className="text-xs text-gray-400">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Số điện thoại",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Số lớp tham gia",
      key: "classes",
      render: (_: any, record: any) => {
        const count = mockClasses.filter((c) => c.students?.includes(record.id)).length || 2;
        return <Tag color="blue">{count} Lớp</Tag>;
      },
    },
    {
      title: "Tiến độ học tập",
      key: "progress",
      render: () => {
        const percent = Math.floor(Math.random() * 40) + 60;
        return <Progress percent={percent} size="small" status="active" />;
      },
    },
    {
      title: "Trạng thái tài khoản",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "Active" ? "success" : "error"} className="rounded-full px-3">
          {status === "Active" ? "Đang học" : "Tạm khóa"}
        </Tag>
      ),
    },
    {
      title: "Ngày gia nhập",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Tổng Số Học Sinh Đăng Ký"
              value={students.length * 150 + 12}
              prefix={<UserOutlined className="text-blue-500 mr-2 p-2 bg-blue-50 rounded-lg" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Học Sinh Đang Học (Active)"
              value={activeStudents * 150 + 5}
              prefix={
                <CheckCircleOutlined className="text-green-500 mr-2 p-2 bg-green-50 rounded-lg" />
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Điểm Trung Bình Tích Cực"
              value={8.35}
              precision={2}
              suffix="/ 10"
              prefix={<TrophyOutlined className="text-amber-500 mr-2 p-2 bg-amber-50 rounded-lg" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart Row */}
      <Card
        title="Phân tích Điểm Trung bình theo Môn học (Top Học sinh)"
        className="rounded-xl border border-gray-100 shadow-sm"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={studentPerformanceData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis domain={[0, 10]} tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="math" name="Toán học" fill="#1677ff" radius={[4, 4, 0, 0]} />
              <Bar dataKey="physics" name="Vật lý" fill="#52c41a" radius={[4, 4, 0, 0]} />
              <Bar dataKey="english" name="Tiếng Anh" fill="#722ed1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Table Row */}
      <Card
        title="Danh Sách Học Sinh & Kết Quả Học Tập"
        className="rounded-xl border border-gray-100 shadow-sm"
      >
        <Table columns={columns} dataSource={students} rowKey="id" pagination={{ pageSize: 5 }} />
      </Card>
    </div>
  );
};

export default StudentReport;
