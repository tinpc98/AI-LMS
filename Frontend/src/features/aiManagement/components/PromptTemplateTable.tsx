import { Button, Col, Empty, Input, Row, Select, Switch, Table, Tag, Tooltip, Typography } from "antd";
import {
  EyeOutlined,
  EditOutlined,
  CopyOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import type { AIModel, PromptCategory, PromptStatus, PromptTemplate } from "../types/aiManagement.types";

interface PromptTemplateTableProps {
  data: PromptTemplate[];
  models: AIModel[];
  search: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  onView: (prompt: PromptTemplate) => void;
  onEdit: (prompt: PromptTemplate) => void;
  onDuplicate: (prompt: PromptTemplate) => void;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

const getCategoryColor = (cat: PromptCategory) => {
  switch (cat) {
    case "Chatbot":
      return "blue";
    case "Summary":
      return "orange";
    case "Quiz Generator":
      return "purple";
    case "Exam Generator":
      return "magenta";
    case "Homework Assistant":
      return "green";
    case "Essay Evaluation":
      return "cyan";
    case "Learning Recommendation":
      return "geekblue";
    default:
      return "default";
  }
};

const PromptTemplateTable = ({
  data,
  models,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  onView,
  onEdit,
  onDuplicate,
  onToggleStatus,
  onDelete,
  onCreate,
}: PromptTemplateTableProps) => {
  const modelMap = new Map(models.map((m) => [m.id, m]));

  const columns = [
    {
      title: "Prompt Name",
      key: "name",
      width: 240,
      ellipsis: true,
      render: (_: unknown, record: PromptTemplate) => (
        <div>
          <Typography.Text strong style={{ display: "block" }}>
            {record.name}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {record.description}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 160,
      render: (cat: PromptCategory) => <Tag color={getCategoryColor(cat)}>{cat}</Tag>,
    },
    {
      title: "Assigned Model",
      dataIndex: "modelId",
      key: "modelId",
      width: 160,
      render: (modelId: string) => {
        const model = modelMap.get(modelId);
        return model ? `${model.provider} (${model.name})` : modelId;
      },
    },
    {
      title: "Variables",
      dataIndex: "variables",
      key: "variables",
      width: 180,
      render: (vars: string[]) => (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {vars.map((v) => (
            <Tag key={v} style={{ margin: 0, fontSize: 11 }}>
              {`{{${v}}}`}
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: "Status",
      key: "status",
      width: 100,
      render: (_: unknown, record: PromptTemplate) => (
        <Switch
          size="small"
          checked={record.status === "Active"}
          onChange={() => onToggleStatus(record.id)}
        />
      ),
    },
    {
      title: "Updated At",
      dataIndex: "updatedAt",
      key: "updatedAt",
      width: 130,
      render: (dateStr: string) => new Date(dateStr).toLocaleDateString("vi-VN"),
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right" as const,
      width: 140,
      align: "right" as const,
      render: (_: unknown, record: PromptTemplate) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <Tooltip title="View Prompt & Live Preview">
            <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
          </Tooltip>
          <Tooltip title="Edit Template">
            <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Tooltip>
          <Tooltip title="Duplicate Prompt">
            <Button size="small" icon={<CopyOutlined />} onClick={() => onDuplicate(record)} />
          </Tooltip>
          <Tooltip title="Delete Prompt">
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(record.id)} />
          </Tooltip>
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
            placeholder="Search prompt template name or description..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </Col>
        <Col xs={24} sm={12} md={5}>
          <Select
            style={{ width: "100%" }}
            placeholder="Category"
            value={categoryFilter}
            onChange={onCategoryFilterChange}
            options={[
              { label: "All Categories", value: "All" },
              { label: "Chatbot", value: "Chatbot" },
              { label: "Summary", value: "Summary" },
              { label: "Quiz Generator", value: "Quiz Generator" },
              { label: "Exam Generator", value: "Exam Generator" },
              { label: "Homework Assistant", value: "Homework Assistant" },
              { label: "Essay Evaluation", value: "Essay Evaluation" },
              { label: "Learning Recommendation", value: "Learning Recommendation" },
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
          <Button icon={<ReloadOutlined />} onClick={() => { onSearchChange(""); onCategoryFilterChange("All"); onStatusFilterChange("All"); }} block>
            Reset
          </Button>
        </Col>
        <Col xs={24} sm={12} md={3}>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate} block>
            Add Prompt
          </Button>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 6 }}
        scroll={{ x: 1050 }}
        locale={{ emptyText: <Empty description="No prompt templates found" /> }}
      />
    </div>
  );
};

export default PromptTemplateTable;
