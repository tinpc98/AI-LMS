import { Button, Card, Col, Empty, Input, Row, Select, Statistic, Table, Tag, Tooltip, Typography } from "antd";
import {
  FilePdfOutlined,
  FileWordOutlined,
  FileZipOutlined,
  FileTextOutlined,
  SyncOutlined,
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  BookOutlined,
} from "@ant-design/icons";
import type { KnowledgeCategory, KnowledgeDocument, KnowledgeFileType, KnowledgeStatus } from "../types/aiManagement.types";

interface KnowledgeTableProps {
  data: KnowledgeDocument[];
  stats: { total: number; indexed: number; pending: number; failed: number };
  search: string;
  onSearchChange: (val: string) => void;
  categoryFilter: string;
  onCategoryFilterChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  reindexingId: string | null;
  onView: (doc: KnowledgeDocument) => void;
  onReindex: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
}

const getFileIcon = (fileType: KnowledgeFileType) => {
  switch (fileType) {
    case "pdf":
      return <FilePdfOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />;
    case "docx":
      return <FileWordOutlined style={{ color: "#1890ff", fontSize: 18 }} />;
    case "zip":
      return <FileZipOutlined style={{ color: "#fa8c16", fontSize: 18 }} />;
    default:
      return <FileTextOutlined style={{ color: "#8c8c8c", fontSize: 18 }} />;
  }
};

const getStatusTag = (status: KnowledgeStatus) => {
  switch (status) {
    case "Indexed":
      return <Tag color="green" icon={<CheckCircleOutlined />}>Indexed</Tag>;
    case "Pending":
      return <Tag color="orange" icon={<ClockCircleOutlined />}>Pending</Tag>;
    case "Failed":
      return <Tag color="red" icon={<CloseCircleOutlined />}>Failed</Tag>;
  }
};

const KnowledgeTable = ({
  data,
  stats,
  search,
  onSearchChange,
  categoryFilter,
  onCategoryFilterChange,
  statusFilter,
  onStatusFilterChange,
  reindexingId,
  onView,
  onReindex,
  onDelete,
  onCreate,
}: KnowledgeTableProps) => {
  const columns = [
    {
      title: "Document Name",
      key: "name",
      width: 280,
      ellipsis: true,
      render: (_: unknown, record: KnowledgeDocument) => (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {getFileIcon(record.fileType)}
          <div style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
            <Typography.Text strong style={{ display: "block" }}>
              {record.name}
            </Typography.Text>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Uploaded by {record.uploadedBy}
            </Typography.Text>
          </div>
        </div>
      ),
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      width: 120,
      render: (cat: KnowledgeCategory) => <Tag color="blue">{cat}</Tag>,
    },
    {
      title: "File Size",
      dataIndex: "fileSizeMB",
      key: "fileSizeMB",
      width: 100,
      render: (size: number) => `${size} MB`,
    },
    {
      title: "Chunks",
      dataIndex: "chunksCount",
      key: "chunksCount",
      width: 110,
      render: (count: number) => `${count.toLocaleString()} chunks`,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      width: 120,
      render: (status: KnowledgeStatus) => getStatusTag(status),
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
      render: (_: unknown, record: KnowledgeDocument) => (
        <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
          <Tooltip title="View Document Details">
            <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
          </Tooltip>
          <Tooltip title="Re-index Vector Embeddings">
            <Button
              size="small"
              icon={<SyncOutlined spin={reindexingId === record.id} />}
              onClick={() => onReindex(record.id)}
            />
          </Tooltip>
          <Tooltip title="Delete Document">
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(record.id)} />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: "14px 18px" }}>
            <Statistic
              title="Total Documents"
              value={stats.total}
              prefix={<BookOutlined style={{ color: "#1890ff", marginRight: 8 }} />}
              valueStyle={{ fontSize: 20, fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: "14px 18px" }}>
            <Statistic
              title="Indexed"
              value={stats.indexed}
              prefix={<CheckCircleOutlined style={{ color: "#52c41a", marginRight: 8 }} />}
              valueStyle={{ fontSize: 20, fontWeight: 600, color: "#52c41a" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: "14px 18px" }}>
            <Statistic
              title="Pending"
              value={stats.pending}
              prefix={<ClockCircleOutlined style={{ color: "#fa8c16", marginRight: 8 }} />}
              valueStyle={{ fontSize: 20, fontWeight: 600, color: "#fa8c16" }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card bordered={false} bodyStyle={{ padding: "14px 18px" }}>
            <Statistic
              title="Failed"
              value={stats.failed}
              prefix={<CloseCircleOutlined style={{ color: "#ff4d4f", marginRight: 8 }} />}
              valueStyle={{ fontSize: 20, fontWeight: 600, color: "#ff4d4f" }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[12, 12]} align="middle" style={{ marginBottom: 16 }}>
        <Col xs={24} md={8}>
          <Input
            allowClear
            placeholder="Search document name..."
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
              { label: "Toán", value: "Toán" },
              { label: "Vật Lý", value: "Vật Lý" },
              { label: "Hóa Học", value: "Hóa Học" },
              { label: "Tiếng Anh", value: "Tiếng Anh" },
              { label: "Chung", value: "Chung" },
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
              { label: "Indexed", value: "Indexed" },
              { label: "Pending", value: "Pending" },
              { label: "Failed", value: "Failed" },
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
            Add Doc
          </Button>
        </Col>
      </Row>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={data}
        pagination={{ pageSize: 6 }}
        scroll={{ x: 1000 }}
        locale={{ emptyText: <Empty description="No knowledge documents found" /> }}
      />
    </div>
  );
};

export default KnowledgeTable;
