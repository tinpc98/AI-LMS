import React from "react";
import { Row, Col, Card, Table, Tag, Statistic, Progress } from "antd";
import {
  FileTextOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import {
  ResponsiveContainer,
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

const COLORS = ["#52c41a", "#1677ff", "#faad14", "#ff4d4f"];

export const ExamReport: React.FC = () => {
  const examDistributionData = [
    { range: "Xuất sắc (9.0 - 10.0)", count: 35 },
    { range: "Giỏi (8.0 - 8.9)", count: 52 },
    { range: "Khá (6.5 - 7.9)", count: 40 },
    { range: "Trung bình (< 6.5)", count: 18 },
  ];

  const examList = [
    {
      id: "exam-1",
      title: "Bài thi Giữa kỳ: Toán học 10 Nâng cao",
      subject: "Toán học",
      totalParticipants: 45,
      avgScore: 8.2,
      passRate: 95.5,
      cheatDetections: 0,
      status: "GRADED",
    },
    {
      id: "exam-2",
      title: "Kiểm tra 1 tiết: Vật lý 12 - Cơ học",
      subject: "Vật lý",
      totalParticipants: 38,
      avgScore: 7.6,
      passRate: 92.1,
      cheatDetections: 1,
      status: "GRADED",
    },
    {
      id: "exam-3",
      title: "Thi thử THPT Quốc Gia - Tiếng Anh",
      subject: "Tiếng Anh",
      totalParticipants: 62,
      avgScore: 8.4,
      passRate: 98.0,
      cheatDetections: 0,
      status: "GRADED",
    },
    {
      id: "exam-4",
      title: "Đề Thi Cuối Kỳ - Hóa học Nâng cao",
      subject: "Hóa học",
      totalParticipants: 28,
      avgScore: 7.9,
      passRate: 89.2,
      cheatDetections: 2,
      status: "GRADED",
    },
  ];

  const columns = [
    {
      title: "Tên kỳ thi",
      dataIndex: "title",
      key: "title",
      render: (text: string, record: any) => (
        <div>
          <div className="font-semibold text-gray-800">{text}</div>
          <div className="text-xs text-gray-400">Môn: {record.subject}</div>
        </div>
      ),
    },
    {
      title: "Số thí sinh",
      dataIndex: "totalParticipants",
      key: "totalParticipants",
      render: (val: number) => <Tag color="blue">{val} Thí sinh</Tag>,
    },
    {
      title: "Điểm trung bình",
      dataIndex: "avgScore",
      key: "avgScore",
      render: (val: number) => <span className="font-bold text-amber-600">{val} / 10</span>,
    },
    {
      title: "Tỷ lệ Đạt (>=5.0)",
      dataIndex: "passRate",
      key: "passRate",
      render: (rate: number) => (
        <div className="w-32">
          <Progress percent={rate} size="small" status="success" />
        </div>
      ),
    },
    {
      title: "Cảnh báo gian lận (AI Proctor)",
      dataIndex: "cheatDetections",
      key: "cheatDetections",
      render: (count: number) => (
        <Tag color={count > 0 ? "error" : "success"}>
          {count > 0 ? `${count} Trường hợp` : "An toàn (0)"}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: () => <Tag color="purple">Đã chấm điểm</Tag>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Tổng Số Kỳ Thi Đã Tổ Chức"
              value={14}
              prefix={<FileTextOutlined className="text-blue-500 mr-2 p-2 bg-blue-50 rounded-lg" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Điểm Trung Bình Toàn Hệ Thống"
              value={8.02}
              precision={2}
              suffix="/ 10"
              prefix={<TrophyOutlined className="text-amber-500 mr-2 p-2 bg-amber-50 rounded-lg" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Tỷ Lệ Đạt Yêu Cầu"
              value={94.8}
              precision={1}
              suffix="%"
              prefix={<CheckCircleOutlined className="text-green-500 mr-2 p-2 bg-green-50 rounded-lg" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Phát Hiện Gian Lận (AI Proctor)"
              value={3}
              prefix={<ExclamationCircleOutlined className="text-red-500 mr-2 p-2 bg-red-50 rounded-lg" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={14}>
          <Card title="Phân Bổ Phổ Điểm Kỳ Thi" className="rounded-xl border border-gray-100 shadow-sm">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={examDistributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="range" tickLine={false} />
                  <YAxis tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="count" name="Số lượng thí sinh" fill="#1677ff" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={10}>
          <Card title="Tỷ lệ Xếp loại Học lực qua Kỳ thi" className="rounded-xl border border-gray-100 shadow-sm">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={examDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                    nameKey="range"
                  >
                    {examDistributionData.map((_, index) => (
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

      {/* Table */}
      <Card title="Kết Quả Báo Cáo Các Kỳ Thi Mới Nhất" className="rounded-xl border border-gray-100 shadow-sm">
        <Table
          columns={columns}
          dataSource={examList}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default ExamReport;
