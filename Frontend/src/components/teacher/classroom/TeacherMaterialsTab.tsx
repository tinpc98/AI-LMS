import React, { useState, useMemo, useCallback } from "react";
import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Input,
  Select,
  Modal,
  Form,
  Space,
  Typography,
  Popconfirm,
  Empty,
  Skeleton,
  Alert,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FileTextOutlined,
  FilePdfOutlined,
  VideoCameraOutlined,
  LinkOutlined,
  FileUnknownOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  DeleteOutlined,
  FolderOpenOutlined,
  ExportOutlined,
  ReloadOutlined,
  UserOutlined,
} from "@ant-design/icons";

import { classApi } from "../../../api/classApi";
import { toast } from "../../../utils/toast";

const { Title, Text, Paragraph } = Typography;

interface ResourceItem {
  _id: string;
  title: string;
  description?: string;
  type: "Document" | "Video" | "Link" | "Other" | string;
  url: string;
  uploadedBy?: {
    _id?: string;
    fullName?: string;
    email?: string;
  } | string;
  uploadedAt?: string;
}

interface TeacherMaterialsTabProps {
  classId: string;
  className?: string;
  resources?: ResourceItem[];
  teacherName?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export const TeacherMaterialsTab: React.FC<TeacherMaterialsTabProps> = React.memo(
  ({ classId, className = "Lớp học", resources = [], teacherName = "Giảng viên", onRefresh, loading = false }) => {
    // Toolbar state
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();

    // Statistics breakdown
    const stats = useMemo(() => {
      const total = resources.length;
      const docs = resources.filter((r) => r.type === "Document").length;
      const videos = resources.filter((r) => r.type === "Video").length;
      const links = resources.filter((r) => r.type === "Link").length;
      const others = resources.filter((r) => !["Document", "Video", "Link"].includes(r.type)).length;

      return { total, docs, videos, links, others };
    }, [resources]);

    // Filter & Sort materials
    const filteredResources = useMemo(() => {
      let result = [...resources];

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        result = result.filter(
          (r) => r.title.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q)
        );
      }

      // Filter by type
      if (typeFilter !== "all") {
        result = result.filter((r) => (r.type || "Document").toLowerCase() === typeFilter.toLowerCase());
      }

      // Sort
      result.sort((a, b) => {
        if (sortBy === "name-asc") return a.title.localeCompare(b.title);
        if (sortBy === "oldest") return (a.uploadedAt || "").localeCompare(b.uploadedAt || "");
        // Default: newest
        return (b.uploadedAt || "").localeCompare(a.uploadedAt || "");
      });

      return result;
    }, [resources, searchQuery, typeFilter, sortBy]);

    // Handle add new resource
    const handleAddResourceSubmit = async (values: any) => {
      if (!classId) return;
      setSubmitting(true);
      try {
        await classApi.addResource(classId, {
          title: values.title.trim(),
          description: values.description?.trim() || "",
          type: values.type || "Document",
          url: values.url.trim(),
        });

        toast.success("Thêm tài liệu học tập mới thành công!");
        setIsAddModalOpen(false);
        form.resetFields();
        if (onRefresh) onRefresh();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Lỗi khi thêm tài liệu!");
      } finally {
        setSubmitting(false);
      }
    };

    // Handle delete resource
    const handleDeleteResource = async (resourceId: string) => {
      if (!classId || !resourceId) return;
      try {
        await classApi.removeResource(classId, resourceId);
        toast.success("Đã xóa tài liệu khỏi lớp học!");
        if (onRefresh) onRefresh();
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Lỗi khi xóa tài liệu!");
      }
    };

    // Helper: File Type Icon
    const getFileTypeIcon = (type?: string) => {
      switch (type) {
        case "Video":
          return <VideoCameraOutlined style={{ fontSize: 24, color: "#ff4d4f" }} />;
        case "Link":
          return <LinkOutlined style={{ fontSize: 24, color: "#1890ff" }} />;
        case "Document":
          return <FilePdfOutlined style={{ fontSize: 24, color: "#fa8c16" }} />;
        default:
          return <FileUnknownOutlined style={{ fontSize: 24, color: "#722ed1" }} />;
      }
    };

    // Helper: File Type Tag
    const getTypeTag = (type?: string) => {
      switch (type) {
        case "Video":
          return <Tag color="error">Video bài giảng</Tag>;
        case "Link":
          return <Tag color="processing">Liên kết Website</Tag>;
        case "Document":
          return <Tag color="warning">Tài liệu / PDF</Tag>;
        default:
          return <Tag color="purple">{type || "Khác"}</Tag>;
      }
    };

    const columns: ColumnsType<ResourceItem> = [
      {
        title: "Tài liệu",
        key: "title",
        render: (_, record) => (
          <Space size={12} align="start">
            {getFileTypeIcon(record.type)}
            <div>
              <Text strong style={{ fontSize: 14, display: "block" }}>
                {record.title}
              </Text>
              {record.description && (
                <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ margin: "2px 0 0", fontSize: 12 }}>
                  {record.description}
                </Paragraph>
              )}
            </div>
          </Space>
        ),
      },
      {
        title: "Loại tệp",
        dataIndex: "type",
        key: "type",
        width: 140,
        render: (type) => getTypeTag(type),
      },
      {
        title: "Người đăng",
        dataIndex: "uploadedBy",
        key: "uploadedBy",
        width: 180,
        render: (uploadedBy) => {
          const uName = typeof uploadedBy === "object" ? uploadedBy?.fullName : teacherName;
          return (
            <Space size={6}>
              <UserOutlined style={{ color: "#8c8c8c" }} />
              <Text style={{ fontSize: 13 }}>{uName || teacherName}</Text>
            </Space>
          );
        },
      },
      {
        title: "Ngày đăng",
        dataIndex: "uploadedAt",
        key: "uploadedAt",
        width: 140,
        render: (date) => (date ? new Date(date).toLocaleDateString("vi-VN") : "Hôm nay"),
      },
      {
        title: "Thao tác",
        key: "action",
        width: 160,
        align: "right",
        render: (_, record) => (
          <Space size={8}>
            <Tooltip title="Mở liên kết / Xem tài liệu">
              <Button
                type="primary"
                size="small"
                icon={<ExportOutlined />}
                onClick={() => window.open(record.url, "_blank")}
                style={{ borderRadius: 6 }}
              >
                Mở
              </Button>
            </Tooltip>

            <Popconfirm
              title="Xóa tài liệu này?"
              description="Hành động này sẽ gỡ tài liệu khỏi lớp học."
              onConfirm={() => handleDeleteResource(record._id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Xóa tài liệu">
                <Button type="text" danger size="small" icon={<DeleteOutlined />} />
              </Tooltip>
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* 1. Header Banner & Quick Statistics */}
        <Card
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, #1890ff 0%, #096dd9 100%)",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(24, 144, 255, 0.25)",
          }}
          styles={{ body: { padding: "24px 32px" } }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 20 }}>
            <div>
              <Space size={12} align="center">
                <FolderOpenOutlined style={{ fontSize: 28, color: "#fff" }} />
                <Title level={4} style={{ color: "#fff", margin: 0, fontWeight: 700 }}>
                  Kho Tài liệu & Học liệu lớp: {className}
                </Title>
              </Space>
              <Text style={{ color: "rgba(255,255,255,0.85)", display: "block", marginTop: 4, fontSize: 13 }}>
                Đăng tải và chia sẻ các tệp PDF, tài liệu hướng dẫn, video và liên kết bài học cho học sinh trong lớp.
              </Text>
            </div>

            {onRefresh && (
              <Button
                type="default"
                icon={<ReloadOutlined spin={loading} />}
                onClick={onRefresh}
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderColor: "rgba(255,255,255,0.4)",
                  color: "#fff",
                  fontWeight: 600,
                }}
              >
                Làm mới
              </Button>
            )}
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={4.8} style={{ flex: 1 }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>Tổng số tệp</Text>}
                  value={stats.total}
                  styles={{ content: { color: "#fff", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={4.8} style={{ flex: 1 }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>📄 Văn bản / PDF</Text>}
                  value={stats.docs}
                  prefix={<FilePdfOutlined style={{ color: "#ffe58f", marginRight: 6 }} />}
                  styles={{ content: { color: "#fff", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={4.8} style={{ flex: 1 }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>🎥 Video bài giảng</Text>}
                  value={stats.videos}
                  prefix={<VideoCameraOutlined style={{ color: "#ff9c6e", marginRight: 6 }} />}
                  styles={{ content: { color: "#fff", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={4.8} style={{ flex: 1 }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>🔗 Liên kết Link</Text>}
                  value={stats.links}
                  prefix={<LinkOutlined style={{ color: "#91caff", marginRight: 6 }} />}
                  styles={{ content: { color: "#fff", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={4.8} style={{ flex: 1 }}>
              <div style={{ backgroundColor: "rgba(255,255,255,0.15)", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.25)" }}>
                <Statistic
                  title={<Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>📂 Tệp khác</Text>}
                  value={stats.others}
                  styles={{ content: { color: "#fff", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>
          </Row>
        </Card>

        {/* 2. Main Content: Toolbar & Table */}
        <Card
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <Space size={12} wrap>
                <Input
                  placeholder="Tìm tài liệu theo tên..."
                  prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: 240, borderRadius: 8 }}
                  allowClear
                />

                <Select
                  value={typeFilter}
                  onChange={(val) => setTypeFilter(val)}
                  style={{ width: 160 }}
                  suffixIcon={<FilterOutlined />}
                  options={[
                    { value: "all", label: "Tất cả loại tệp" },
                    { value: "document", label: "Văn bản / PDF" },
                    { value: "video", label: "Video bài giảng" },
                    { value: "link", label: "Liên kết Link" },
                    { value: "other", label: "Loại tệp khác" },
                  ]}
                />

                <Select
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  style={{ width: 140 }}
                  options={[
                    { value: "newest", label: "Mới nhất" },
                    { value: "oldest", label: "Cũ nhất" },
                    { value: "name-asc", label: "Tên A -> Z" },
                  ]}
                />
              </Space>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsAddModalOpen(true)}
                style={{ fontWeight: 600, borderRadius: 8 }}
              >
                Tải tài liệu mới
              </Button>
            </div>
          }
          style={{ borderRadius: 12 }}
          styles={{ body: { padding: 0 } }}
        >
          {loading ? (
            <div style={{ padding: 24 }}>
              <Skeleton active paragraph={{ rows: 6 }} />
            </div>
          ) : filteredResources.length > 0 ? (
            <Table
              columns={columns}
              dataSource={filteredResources}
              rowKey={(record, index) => record._id || `res-${index}`}
              pagination={{ pageSize: 10, showSizeChanger: false }}
            />
          ) : (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text type="secondary">
                    {searchQuery || typeFilter !== "all"
                      ? "Không tìm thấy tài liệu nào phù hợp từ khóa tìm kiếm."
                      : "Lớp học chưa có tài liệu nào được đăng tải."}
                  </Text>
                }
              >
                {!searchQuery && typeFilter === "all" && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsAddModalOpen(true)} style={{ borderRadius: 6 }}>
                    Tải tài liệu đầu tiên
                  </Button>
                )}
              </Empty>
            </div>
          )}
        </Card>

        {/* 3. Modal Thêm Tài nguyên mới */}
        <Modal
          title="Tải lên / Thêm tài liệu mới cho lớp học"
          open={isAddModalOpen}
          onCancel={() => {
            setIsAddModalOpen(false);
            form.resetFields();
          }}
          footer={null}
          destroyOnClose
        >
          <Form form={form} layout="vertical" onFinish={handleAddResourceSubmit} style={{ marginTop: 16 }}>
            <Form.Item
              name="title"
              label="Tiêu đề tài liệu"
              rules={[{ required: true, message: "Vui lòng nhập tiêu đề tài liệu!" }]}
            >
              <Input placeholder="Ví dụ: Tài liệu ôn tập Chương 1 - Đề cương môn học" />
            </Form.Item>

            <Form.Item name="type" label="Loại tài nguyên" initialValue="Document">
              <Select
                options={[
                  { value: "Document", label: "Văn bản / Tài liệu PDF" },
                  { value: "Video", label: "Video bài giảng" },
                  { value: "Link", label: "Liên kết trang web (Link)" },
                  { value: "Other", label: "Tệp đính kèm khác" },
                ]}
              />
            </Form.Item>

            <Form.Item
              name="url"
              label="Đường dẫn URL tài nguyên"
              rules={[
                { required: true, message: "Vui lòng nhập đường dẫn URL tài nguyên!" },
                { type: "url", message: "Vui lòng nhập định dạng URL hợp lệ (http:// hoặc https://)!" },
              ]}
            >
              <Input placeholder="https://drive.google.com/... hoặc https://youtube.com/..." />
            </Form.Item>

            <Form.Item name="description" label="Mô tả / Ghi chú cho học sinh">
              <Input.TextArea rows={3} placeholder="Nhập ghi chú chi tiết hoặc dặn dò học sinh khi xem tài liệu..." />
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <Button onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
              <Button type="primary" htmlType="submit" loading={submitting}>
                Lưu tài liệu
              </Button>
            </div>
          </Form>
        </Modal>
      </div>
    );
  }
);

TeacherMaterialsTab.displayName = "TeacherMaterialsTab";
