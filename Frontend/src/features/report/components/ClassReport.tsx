import React from "react";
import { Row, Col, Card, Table, Tag, Progress, Statistic } from "antd";
import {
  AppstoreOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { mockClasses } from "../../../features/class/class.mock";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

export const ClassReport: React.FC = () => {
  const activeClasses = mockClasses.filter((c) => c.status === "Active").length;
  const upcomingClasses = mockClasses.filter((c) => c.status === "Upcoming").length;

  const classFillRateData = mockClasses.map((c) => ({
    name: c.className,
    current: c.currentStudents,
    max: c.maxStudents,
    rate: Math.round((c.currentStudents / c.maxStudents) * 100),
  }));

  const columns = [
    {
      title: "Tên lớp học",
      dataIndex: "className",
      key: "className",
      render: (text: string, record: any) => (
        <div>
          <div className="font-semibold text-gray-800">{text}</div>
          <div className="text-xs text-gray-400">Mã lớp: {record.classCode}</div>
        </div>
      ),
    },
    {
      title: "Hình thức học",
      dataIndex: "learningMode",
      key: "learningMode",
      render: (mode: string) => {
        const color = mode === "Online" ? "blue" : mode === "Offline" ? "green" : "purple";
        return <Tag color={color}>{mode}</Tag>;
      },
    },
    {
      title: "Lịch học",
      key: "schedule",
      render: (_: any, record: any) => (
        <div className="text-xs text-gray-600">
          <div>{record.schedule?.days?.join(", ") || "N/A"}</div>
          <div>
            {record.schedule?.startTime
              ? `${record.schedule.startTime} - ${record.schedule.endTime}`
              : "N/A"}
          </div>
        </div>
      ),
    },
    {
      title: "Sĩ số lớp",
      key: "capacity",
      render: (_: any, record: any) => {
        const percent = Math.round((record.currentStudents / record.maxStudents) * 100);
        return (
          <div className="w-36">
            <div className="flex justify-between text-xs mb-1">
              <span>
                {record.currentStudents}/{record.maxStudents} HS
              </span>
              <span className="font-semibold">{percent}%</span>
            </div>
            <Progress percent={percent} size="small" showInfo={false} />
          </div>
        );
      },
    },
    {
      title: "Phòng học",
      dataIndex: "classroom",
      key: "classroom",
      render: (room: string) =>
        room ? <Tag color="gold">{room}</Tag> : <Tag color="default">Trực tuyến</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color =
          status === "Active" ? "success" : status === "Upcoming" ? "processing" : "default";
        const label =
          status === "Active" ? "Đang diễn ra" : status === "Upcoming" ? "Sắp mở" : "Đã xong";
        return <Tag color={color}>{label}</Tag>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Tổng Số Lớp Học"
              value={mockClasses.length}
              prefix={<AppstoreOutlined className="text-blue-500 mr-2 p-2 bg-blue-50 rounded-lg" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Lớp Đang Hoạt Động"
              value={activeClasses}
              prefix={
                <CheckCircleOutlined className="text-green-500 mr-2 p-2 bg-green-50 rounded-lg" />
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Lớp Sắp Khai Giảng"
              value={upcomingClasses}
              prefix={
                <ClockCircleOutlined className="text-amber-500 mr-2 p-2 bg-amber-50 rounded-lg" />
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Sĩ Số Trung Bình"
              value={
                mockClasses.length > 0
                  ? Math.round(
                      mockClasses.reduce((acc, c) => acc + c.currentStudents, 0) /
                        mockClasses.length
                    )
                  : 0
              }
              suffix="Học sinh/lớp"
              prefix={<TeamOutlined className="text-indigo-500 mr-2 p-2 bg-indigo-50 rounded-lg" />}
            />
          </Card>
        </Col>
      </Row>

      {/* Chart */}
      <Card
        title="So sánh Sĩ số Thực tế vs Chỉ tiêu Sĩ số Tối đa của các Lớp"
        className="rounded-xl border border-gray-100 shadow-sm"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classFillRateData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-default)" />
              <XAxis dataKey="name" tickLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Bar dataKey="current" name="Đã đăng ký" fill="var(--color-action-primary-bg)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="max" name="Chỉ tiêu tối đa" fill="var(--color-border-default)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Table */}
      <Card
        title="Báo Cáo Chi Tiết Các Lớp Học"
        className="rounded-xl border border-gray-100 shadow-sm"
      >
        <Table columns={columns} dataSource={mockClasses} rowKey="id" pagination={false} />
      </Card>
    </div>
  );
};

export default ClassReport;
