import React from "react";
import { Row, Col, Card, Table, Tag, Statistic, Progress } from "antd";
import {
  RobotOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloudServerOutlined,
} from "@ant-design/icons";
import { mockAILogs } from "../../../features/ai/mock/aiLogs.mock";
import { mockAIModels } from "../../../features/ai/mock/models.mock";
import { mockAIFeatures } from "../../../features/ai/mock/features.mock";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export const AIAnalytics: React.FC = () => {
  const totalTokens = mockAILogs.reduce((acc, curr) => acc + curr.tokensUsed, 0);
  const avgLatency = Math.round(
    mockAILogs.reduce((acc, curr) => acc + curr.responseTimeMs, 0) / (mockAILogs.length || 1)
  );
  const successCount = mockAILogs.filter((l) => l.status === "Success").length;
  const successRate =
    mockAILogs.length > 0 ? Math.round((successCount / mockAILogs.length) * 100) : 100;

  const hourlyUsageData = [
    { hour: "08:00", requests: 45, tokens: 18500 },
    { hour: "10:00", requests: 82, tokens: 34200 },
    { hour: "12:00", requests: 35, tokens: 14100 },
    { hour: "14:00", requests: 110, tokens: 49000 },
    { hour: "16:00", requests: 95, tokens: 41200 },
    { hour: "18:00", requests: 140, tokens: 62500 },
    { hour: "20:00", requests: 165, tokens: 78000 },
  ];

  const columns = [
    {
      title: "Mã nhật ký (Log ID)",
      dataIndex: "id",
      key: "id",
      render: (id: string) => <Tag color="geekblue">{id}</Tag>,
    },
    {
      title: "Tính năng AI",
      dataIndex: "feature",
      key: "feature",
      render: (feature: string) => {
        const color =
          feature === "Chatbot"
            ? "purple"
            : feature === "Summary"
              ? "cyan"
              : feature === "Quiz"
                ? "green"
                : "gold";
        return <Tag color={color}>{feature}</Tag>;
      },
    },
    {
      title: "Người dùng",
      dataIndex: "userName",
      key: "userName",
      render: (text: string) => <span className="font-medium text-gray-800">{text}</span>,
    },
    {
      title: "Prompt yêu cầu",
      dataIndex: "prompt",
      key: "prompt",
      render: (text: string) => (
        <span className="text-xs text-gray-600 truncate max-w-xs block">{text}</span>
      ),
    },
    {
      title: "Số Tokens",
      dataIndex: "tokensUsed",
      key: "tokensUsed",
      render: (val: number) => <span className="font-bold text-indigo-600">{val} tokens</span>,
    },
    {
      title: "Thời gian phản hồi",
      dataIndex: "responseTimeMs",
      key: "responseTimeMs",
      render: (val: number) => <span>{val} ms</span>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => (
        <Tag color={status === "Success" ? "success" : "error"}>
          {status === "Success" ? "Thành công" : "Lỗi"}
        </Tag>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Metrics */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Tổng Lượt Yêu Cầu AI"
              value={mockAILogs.length * 350 + 120}
              prefix={<RobotOutlined className="text-amber-500 mr-2 p-2 bg-amber-50 rounded-lg" />}
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Tổng Tokens Đã Tiêu Tốn"
              value={totalTokens * 400 + 152000}
              prefix={
                <ThunderboltOutlined className="text-indigo-500 mr-2 p-2 bg-indigo-50 rounded-lg" />
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Độ Trễ Phản Hồi TB (Latency)"
              value={avgLatency || 950}
              suffix="ms"
              prefix={
                <ClockCircleOutlined className="text-blue-500 mr-2 p-2 bg-blue-50 rounded-lg" />
              }
            />
          </Card>
        </Col>

        <Col xs={24} sm={6}>
          <Card className="rounded-xl border border-gray-100 shadow-sm">
            <Statistic
              title="Tỷ Lệ Xử Lý Thành Công"
              value={successRate}
              suffix="%"
              prefix={
                <CheckCircleOutlined className="text-green-500 mr-2 p-2 bg-green-50 rounded-lg" />
              }
            />
          </Card>
        </Col>
      </Row>

      {/* Model status cards */}
      <Card
        title="Các Mô Hình AI Đang Hoạt Động (Active AI Models)"
        className="rounded-xl border border-gray-100 shadow-sm"
      >
        <Row gutter={[16, 16]}>
          {mockAIModels.map((model) => (
            <Col xs={24} sm={12} md={6} key={model.id}>
              <div className="p-4 border border-gray-100 rounded-xl bg-gray-50/50 hover:border-indigo-200 transition-all">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-gray-800 flex items-center gap-2">
                    <CloudServerOutlined className="text-indigo-500" />
                    {model.name}
                  </span>
                  <Tag color={model.isDefault ? "purple" : "blue"}>{model.provider}</Tag>
                </div>
                <div className="text-xs text-gray-500 mb-2">
                  Max Token: {model.maxContextTokens.toLocaleString()}
                </div>
                <Progress
                  percent={model.status ? 100 : 0}
                  size="small"
                  status={model.status ? "success" : "exception"}
                />
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Chart */}
      <Card
        title="Tần Suất Sử Dụng & Token Tiêu Tốn Trong Ngày"
        className="rounded-xl border border-gray-100 shadow-sm"
      >
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyUsageData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTokens" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-secondary-icon)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-secondary-icon)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-default)" />
              <XAxis dataKey="hour" tickLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="tokens"
                name="Số Tokens tiêu tốn"
                stroke="var(--color-secondary-icon)"
                fillOpacity={1}
                fill="url(#colorTokens)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Logs Table */}
      <Card
        title="Nhật Ký Tương Tác AI (AI Log Traces)"
        className="rounded-xl border border-gray-100 shadow-sm"
      >
        <Table columns={columns} dataSource={mockAILogs} rowKey="id" pagination={false} />
      </Card>
    </div>
  );
};

export default AIAnalytics;
