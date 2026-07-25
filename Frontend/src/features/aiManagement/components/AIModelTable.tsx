import { Badge, Button, Input, Row, Col, Select, Table, Tag, Tooltip, Typography, Empty } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  PoweroffOutlined,
  CheckOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { AIModel, ModelProvider, ModelStatus } from "../types/aiManagement.types";

interface AIModelTableProps {
  data: AIModel[];
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  providerFilter: string;
  onProviderFilterChange: (value: string) => void;
  onView: (model: AIModel) => void;
  onEdit: (model: AIModel) => void;
  onToggleStatus: (id: string) => void;
  onSetDefault: (id: string) => void;
  onCreate: () => void;
}

const getProviderColor = (provider: ModelProvider) => {
  switch (provider) {
    case "OpenAI":
      return "green";
    case "Google":
      return "blue";
    case "Anthropic":
      return "purple";
    case "Meta":
      return "orange";
    default:
      return "cyan";
  }
};

const AIModelTable = ({
  data,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  providerFilter,
  onProviderFilterChange,
  onView,
  onEdit,
  onToggleStatus,
  onSetDefault,
  onCreate,
}: AIModelTableProps) => {
  const columns = [
    {
      title: "Provider",
      dataIndex: "provider",
      key: "provider",
      width: 120,
      render: (provider: ModelProvider) => (
        <Tag color={getProviderColor(provider)}>{provider}</Tag>
      ),
    },
    {
      title: "Model Name",
      key: "name",
      width: 220,
      render: (_: unknown, record: AIModel) => (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Typography.Text strong>{record.name}</Typography.Text>
            {record.isDefault && <Badge status="success" text={<span style={{ fontSize: 11, color: "#52c41a", fontWeight: 600 }}>Default</span>} />}
          </div>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Version: {record.version}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority: number) => <Tag color="geekblue">Priority {priority}</Tag>,
    },
    {
      title: "Context Window",
      dataIndex: "maxContextTokens",
      key: "maxContextTokens",
      width: 130,
      render: (tokens: number) => `${(tokens / 1000).toLocaleString()}k tokens`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 110,
      render: (status: ModelStatus) => (
        <Tag color={status === "Active" ? "green" : "default"}>{status}</Tag>
      ),
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (dateStr: string) => new Date(dateStr).toLocaleDateString("vi-VN"),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 160,
      align: "right" as const,
      render: (_: unknown, record: AIModel) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <Tooltip title="View Details">
            <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
          </Tooltip>
          <Tooltip title="Edit Model">
            <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Tooltip>
          <Tooltip title={record.status === "Active" ? "Disable Model" : "Enable Model"}>
            <Button
              size="small"
              danger={record.status === "Active"}
              icon={<PoweroffOutlined />}
              onClick={() => onToggleStatus(record.id)}
            />
          </Tooltip>
          {!record.isDefault && (
            <Tooltip title="Set as Default Model">
              <Button
                size="small"
                type="dashed"
                icon={<CheckOutlined style={{ color: "#52c41a" }} />}
                onClick={() => onSetDefault(record.id)}
              />
            </Tooltip>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Input
            allowClear
            placeholder="Search model name or provider..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Select
            style={{ width: "100%" }}
            placeholder="Provider"
            value={providerFilter}
            onChange={onProviderFilterChange}
            options={[
              { label: "All Providers", value: "All" },
              { label: "OpenAI", value: "OpenAI" },
              { label: "Google", value: "Google" },
              { label: "Anthropic", value: "Anthropic" },
              { label: "Meta", value: "Meta" },
            ]}
          />
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Select
            style={{ width: "100%" }}
            placeholder="Status"
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={[
              { label: "All Status", value: "All" },
              { label: "Active", value: "Active" },
              { label: "Disabled", value: "Disabled" },
            ]}
          />
        </Col>
        <Col xs={24} sm={12} md={3}>
          <Button icon={<ReloadOutlined />} onClick={() => { onSearchChange(""); onStatusFilterChange("All"); onProviderFilterChange("All"); }} block>
            Reset
          </Button>
        </Col>
        <Col xs={24} sm={12} md={3}>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate} block>
            Add Model
          </Button>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 6 }}
        scroll={{ x: 1000 }}
        locale={{ emptyText: <Empty description="No AI models found" /> }}
      />
    </div>
  );
};

export default AIModelTable;
