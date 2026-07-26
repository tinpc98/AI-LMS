import React from "react";
import { Row, Col, Card, Table, Tag, Progress, Statistic } from "antd";
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  CheckOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";
import { mockLiveSessions } from "../../../features/classManagement/liveSessions.mock";
import { mockClasses } from "../../../features/classManagement/class.mock";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export const AttendanceReport: React.FC = () => {
  const attendanceWeeklyData = [
    { day: "Thứ 2", present: 95, absent: 5, late: 2 },
    { day: "Thứ 3", present: 92, absent: 8, late: 4 },
    { day: "Thứ 4", present: 96, absent: 4, late: 1 },
    { day: "Thứ 5", present: 90, absent: 10, late: 5 },
    { day: "Thứ 6", present: 94, absent: 6, late: 3 },
    { day: "Thứ 7", present: 88, absent: 12, late: 7 },
    { day: "Chủ Nhật", present: 98, absent: 2, late: 0 },
  ];

  const attendanceByClassList = mockClasses.map((c) => ({
    id: c.id,
    className: c.className,
    classCode: c.classCode,
    totalStudents: c.currentStudents,
    averageAttendanceRate: Math.floor(Math.random() * 10) + 90, // 90-99%
    onTimeRate: Math.floor(Math.random() * 15) + 82, // 82-97%
    liveSessionCount: mockLiveSessions.filter((s) => s.classId === c.id).length || 4,
  }));

  const columns = [
    {
      title: "Lớp học",
      dataIndex: "className",
      key: "className",
      render: (text: string, record: any) => (
        <div>
          <div className="font-semibold text-gray-800">{text}</div>
          <div className="text-xs text-gray-400">Mã: {record.classCode}</div>
        </div>
      ),
    },
    {
      title: "Sĩ số",
      dataIndex: "totalStudents",
      key: "totalStudents",
      render: (val: number) => <span>{val} Học sinh</span>,
    },
    {
      title: "Tỷ lệ Điểm danh",
      dataIndex: "averageAttendanceRate",
      key: "averageAttendanceRate",
      render: (rate: number) => (
        <div className="w-36">
          <Progress percent={rate} size="small" status="active" strokeColor="#52c41a" />
        </div>
      ),
    },
    {
      title: "Tỷ lệ Đúng giờ",
      dataIndex: "onTimeRate",
      key: "onTimeRate",
      render: (rate: number) => (
        <div className="w-36">
          <Progress percent={rate} size="small" strokeColor="#1677ff" />
        </div>
      ),
    },
    {
      title: "Số buổi đã diễn ra",
      dataIndex: "liveSessionCount",
      key: "liveSessionCount",
      render: (val: number) => <Tag color="blue">{val} Buổi</Tag>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Tỷ Lệ Điểm Danh Trung Bình"
              value={94.5}
              precision={1}
              suffix="%"
              prefix={<CheckOutlined className="text-green-500 mr-2 p-2 bg-green-50 rounded-lg" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Tỷ Lệ Tham Gia Đúng Giờ"
              value={91.2}
              precision={1}
              suffix="%"
              prefix={<CheckCircleOutlined className="text-blue-500 mr-2 p-2 bg-blue-50 rounded-lg" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={8}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Tổng Số Buổi Live Đã Tổ Chức"
              value={48}
              prefix={<VideoCameraOutlined className="text-purple-500 mr-2 p-2 bg-purple-50 rounded-lg" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Card title="Xu hướng Điểm danh & Đi học đúng giờ theo Tuần" className="rounded-xl border border-gray-100 shadow-sm">
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={attendanceWeeklyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorPresent" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#52c41a" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#52c41a" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
              <XAxis dataKey="day" tickLine={false} />
              <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
              <Tooltip />
              <Area type="monotone" dataKey="present" name="Có mặt (%)" stroke="#52c41a" fillOpacity={1} fill="url(#colorPresent)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Table */}
      <Card title="Thống Kê Điểm Danh Theo Lớp Học" className="rounded-xl border border-gray-100 shadow-sm">
        <Table
          columns={columns}
          dataSource={attendanceByClassList}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default AttendanceReport;
