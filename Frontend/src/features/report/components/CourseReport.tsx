import React from "react";
import { Row, Col, Card, Table, Tag, Statistic } from "antd";
import { BookOutlined, DollarOutlined, AppstoreOutlined } from "@ant-design/icons";
import { mockCourses } from "../../../features/course/course.mock";
import { mockClasses } from "../../../features/class/class.mock";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export const CourseReport: React.FC = () => {
  const publishedCourses = mockCourses.filter((c) => c.status === "Published").length;
  const totalLessons = mockCourses.reduce((acc, curr) => acc + curr.totalLessons, 0);

  const courseRevenueData = mockCourses.map((c) => ({
    name: c.courseName,
    fee: c.tuitionFee,
    lessons: c.totalLessons,
    weeks: c.durationWeeks,
  }));

  const columns = [
    {
      title: "Tên khóa học",
      dataIndex: "courseName",
      key: "courseName",
      render: (text: string, record: any) => (
        <div>
          <div className="font-semibold text-gray-800">{text}</div>
          <div className="text-xs text-gray-400">Đối tượng: {record.target}</div>
        </div>
      ),
    },
    {
      title: "Môn học",
      dataIndex: "subject",
      key: "subject",
      render: (subject: string) => <Tag color="blue">{subject}</Tag>,
    },
    {
      title: "Khối lớp",
      dataIndex: "grade",
      key: "grade",
      render: (grade: number) => <Tag color="purple">Khối {grade}</Tag>,
    },
    {
      title: "Học phí",
      dataIndex: "tuitionFee",
      key: "tuitionFee",
      render: (fee: number) => (
        <span className="font-bold text-emerald-600">{fee.toLocaleString("vi-VN")} VNĐ</span>
      ),
    },
    {
      title: "Thời lượng",
      key: "duration",
      render: (_: any, record: any) => (
        <span>
          {record.durationWeeks} tuần ({record.totalLessons} bài học)
        </span>
      ),
    },
    {
      title: "Số lớp đã mở",
      key: "classesCount",
      render: (_: any, record: any) => {
        const count = mockClasses.filter((cl) => cl.courseId === record.id).length;
        return <Tag color="cyan">{count} Lớp</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color =
          status === "Published" ? "success" : status === "Draft" ? "warning" : "default";
        const label =
          status === "Published" ? "Đã xuất bản" : status === "Draft" ? "Bản nháp" : "Đã đóng";
        return <Tag color={color}>{label}</Tag>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Tổng Số Khóa Học"
              value={mockCourses.length}
              prefix={<BookOutlined className="text-blue-500 mr-2 p-2 bg-blue-50 rounded-lg" />}
              suffix={
                <span className="text-xs text-gray-400">({publishedCourses} đã xuất bản)</span>
              }
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Tổng Số Bài Học Đã Biên Soạn"
              value={totalLessons}
              prefix={
                <AppstoreOutlined className="text-purple-500 mr-2 p-2 bg-purple-50 rounded-lg" />
              }
              suffix="Bài học"
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Học Phí Trung Bình / Khóa"
              value={
                mockCourses.length > 0
                  ? Math.round(
                      mockCourses.reduce((a, b) => a + b.tuitionFee, 0) / mockCourses.length
                    )
                  : 0
              }
              prefix={
                <DollarOutlined className="text-emerald-500 mr-2 p-2 bg-emerald-50 rounded-lg" />
              }
              suffix="VNĐ"
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Card
        title="So sánh Học phí & Số bài học giữa các Khóa học"
        className="rounded-xl border border-gray-100 shadow-sm"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={courseRevenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-default)" />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis
                yAxisId="left"
                orientation="left"
                stroke="var(--color-action-primary-bg)"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="var(--color-success-base)"
                tickLine={false}
                axisLine={false}
              />
              <Tooltip />
              <Bar
                yAxisId="left"
                dataKey="fee"
                name="Học phí (VNĐ)"
                fill="var(--color-action-primary-bg)"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                yAxisId="right"
                dataKey="lessons"
                name="Số bài học"
                fill="var(--color-success-base)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Course List Table */}
      <Card title="Danh Sách Các Khóa Học" className="rounded-xl border border-gray-100 shadow-sm">
        <Table columns={columns} dataSource={mockCourses} rowKey="id" pagination={false} />
      </Card>
    </div>
  );
};

export default CourseReport;
