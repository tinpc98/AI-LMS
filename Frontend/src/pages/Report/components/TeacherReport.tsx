import React from "react";
import { Row, Col, Card, Table, Tag, Avatar, Statistic, Rate, Progress } from "antd";
import { TeamOutlined, StarOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { mockUsers } from "../../../features/accountManagement/account.mock";
import { mockClasses } from "../../../features/classManagement/class.mock";
import { mockLiveSessions } from "../../../features/classManagement/liveSessions.mock";

export const TeacherReport: React.FC = () => {
  const teachers = mockUsers.filter((u) => u.role === "Teacher");
  const activeTeachers = teachers.filter((u) => u.status === "Active").length;

  const teacherPerformanceList = teachers.map((t) => {
    const assignedClasses = mockClasses.filter((c) => c.teacherId === t.id);
    const liveCount = mockLiveSessions.filter((s) => s.teacherName === t.fullName).length;
    const totalStudentsTaught = assignedClasses.reduce((acc, c) => acc + c.currentStudents, 0);

    return {
      ...t,
      classCount: assignedClasses.length,
      liveCount,
      totalStudentsTaught,
      rating: 4.8,
      onTimeRate: 98,
    };
  });

  const columns = [
    {
      title: "Giáo viên",
      dataIndex: "fullName",
      key: "fullName",
      render: (text: string, record: any) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<TeamOutlined />} className="bg-purple-600" />
          <div>
            <div className="font-semibold text-gray-800">{text}</div>
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
      title: "Lớp phụ trách",
      dataIndex: "classCount",
      key: "classCount",
      render: (count: number) => <Tag color="purple">{count} Lớp</Tag>,
    },
    {
      title: "Học sinh phụ trách",
      dataIndex: "totalStudentsTaught",
      key: "totalStudentsTaught",
      render: (count: number) => <span className="font-medium text-gray-700">{count} Học sinh</span>,
    },
    {
      title: "Buổi dạy trực tuyến",
      dataIndex: "liveCount",
      key: "liveCount",
      render: (count: number) => <Tag color="blue">{count} Buổi Live</Tag>,
    },
    {
      title: "Đánh giá từ Học sinh",
      dataIndex: "rating",
      key: "rating",
      render: (val: number) => (
        <div className="flex items-center gap-2">
          <Rate disabled defaultValue={val} allowHalf style={{ fontSize: 14 }} />
          <span className="font-bold text-amber-600">{val}</span>
        </div>
      ),
    },
    {
      title: "Tỷ lệ đúng giờ",
      dataIndex: "onTimeRate",
      key: "onTimeRate",
      render: (rate: number) => <Progress percent={rate} size="small" status="success" />,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "Active" ? "success" : "default"}>
          {status === "Active" ? "Đang công tác" : "Nghỉ phép/Dừng"}
        </Tag>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Header */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Tổng Số Giảng Viên & Trợ Giảng"
              value={teachers.length * 10 || 42}
              prefix={<TeamOutlined className="text-purple-500 mr-2 p-2 bg-purple-50 rounded-lg" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Đang Giảng Dạy Đột Phá"
              value={activeTeachers * 10 || 36}
              prefix={<CheckCircleOutlined className="text-green-500 mr-2 p-2 bg-green-50 rounded-lg" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Điểm Đánh Giá Giảng Dạy TB"
              value={4.85}
              precision={2}
              suffix="/ 5.0"
              prefix={<StarOutlined className="text-amber-500 mr-2 p-2 bg-amber-50 rounded-lg" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Table */}
      <Card title="Báo Cáo Năng Lực & Hiệu Suất Giảng Dạy của Giáo Viên" className="rounded-xl border border-gray-100 shadow-sm">
        <Table
          columns={columns}
          dataSource={teacherPerformanceList}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default TeacherReport;
