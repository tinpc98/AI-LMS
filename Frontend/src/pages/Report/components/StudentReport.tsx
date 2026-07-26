import React from "react";
import { Row, Col, Card, Statistic, Table, Tag, Progress, Typography } from "antd";
import { UserOutlined, UserAddOutlined, CheckCircleOutlined, TrophyOutlined } from "@ant-design/icons";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import type { ColumnsType } from "antd/es/table";
import type { DateRangeState } from "../../../utils/reportTransformer";
import { transformStudentReport } from "../../../utils/reportTransformer";

const { Title, Text } = Typography;

interface StudentReportProps {
  filter: DateRangeState;
}

export const StudentReport: React.FC<StudentReportProps> = ({ filter }) => {
  const { stats, registrationTrend, studentsByCourse, studentsByClass, tableData } =
    transformStudentReport(filter);

  const columns: ColumnsType<any> = [
    {
      title: "Học sinh",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <div>
          <Text style={{ fontWeight: 600, color: "#1f1f1f" }}>{text}</Text>
          <Text type="secondary" style={{ fontSize: "12px", display: "block" }}>{record.email}</Text>
        </div>
      ),
    },
    {
      title: "Lớp học",
      dataIndex: "className",
      key: "className",
      render: (text) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: "Khóa học",
      dataIndex: "courseName",
      key: "courseName",
    },
    {
      title: "Tiến độ học tập",
      dataIndex: "progress",
      key: "progress",
      render: (val) => (
        <div style={{ width: 140 }}>
          <Progress percent={val} size="small" strokeColor={val >= 80 ? "#52c41a" : "#1677ff"} />
        </div>
      ),
    },
    {
      title: "Điểm trung bình",
      dataIndex: "avgScore",
      key: "avgScore",
      render: (val) => (
        <Tag color={val >= 8.0 ? "gold" : val >= 6.5 ? "green" : "volcano"} style={{ fontWeight: 600 }}>
          {val} điểm
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => (
        <Tag color={status === "Active" ? "success" : "error"} style={{ borderRadius: "4px" }}>
          {status === "Active" ? "Đang học" : "Tạm khóa"}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      {/* 4 Stat Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" styles={{ body: { padding: "20px" } }} style={{ borderRadius: "14px", border: "1px solid #f0f0f0" }}>
            <Statistic title="Total Students" value={stats.totalStudents} prefix={<UserOutlined style={{ color: "#1677ff" }} />} styles={{ content: { fontSize: "26px", fontWeight: 700 } }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" styles={{ body: { padding: "20px" } }} style={{ borderRadius: "14px", border: "1px solid #f0f0f0" }}>
            <Statistic title="New Students" value={stats.newStudents} prefix={<UserAddOutlined style={{ color: "#52c41a" }} />} styles={{ content: { fontSize: "26px", fontWeight: 700 } }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" styles={{ body: { padding: "20px" } }} style={{ borderRadius: "14px", border: "1px solid #f0f0f0" }}>
            <Statistic title="Active Students" value={stats.activeStudents} prefix={<CheckCircleOutlined style={{ color: "#722ed1" }} />} styles={{ content: { fontSize: "26px", fontWeight: 700 } }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card variant="borderless" styles={{ body: { padding: "20px" } }} style={{ borderRadius: "14px", border: "1px solid #f0f0f0" }}>
            <Statistic title="Completed Courses" value={stats.completedCourses} prefix={<TrophyOutlined style={{ color: "#fa8c16" }} />} styles={{ content: { fontSize: "26px", fontWeight: 700 } }} />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} lg={12}>
          <Card variant="borderless" styles={{ body: { padding: "24px" } }} style={{ borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Title level={4} style={{ margin: "0 0 16px 0", fontWeight: 700 }}>Xu hướng đăng ký học sinh 📈</Title>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={registrationTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#1677ff" strokeWidth={3} name="Học sinh mới" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card variant="borderless" styles={{ body: { padding: "24px" } }} style={{ borderRadius: "16px", border: "1px solid #f0f0f0" }}>
            <Title level={4} style={{ margin: "0 0 16px 0", fontWeight: 700 }}>Phân bổ học sinh theo lớp học 🏫</Title>
            <div style={{ width: "100%", height: 260 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={studentsByClass}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#722ed1" radius={[6, 6, 0, 0]} name="Sĩ số" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Student Detail Table */}
      <Card variant="borderless" styles={{ body: { padding: "24px" } }} style={{ borderRadius: "16px", border: "1px solid #f0f0f0" }}>
        <Title level={4} style={{ margin: "0 0 16px 0", fontWeight: 700 }}>Danh sách chi tiết học sinh 📋</Title>
        <Table columns={columns} dataSource={tableData} rowKey="key" pagination={{ pageSize: 5 }} scroll={{ x: 700 }} />
      </Card>
    </div>
  );
};
