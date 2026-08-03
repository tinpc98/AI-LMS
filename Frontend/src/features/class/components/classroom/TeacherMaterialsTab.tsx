import React, { useState, useMemo } from "react";
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
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
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
  WarningOutlined,
  GlobalOutlined,
} from "@ant-design/icons";

import { classApi } from "../../../../api/classApi";
import { toast } from "../../../../utils/toast";
import { getApiErrorMessage } from "../../../../shared/utils/apiError";

const { Title, Text, Paragraph } = Typography;

/**
 * Kiểm tra xem một chuỗi có phải là URL hợp lệ với scheme http hoặc https hay không.
 * Ngăn chặn tuyệt đối các scheme nguy hiểm như javascript:, data:, vbscript:, v.v.
 */
export function isValidHttpUrl(urlString?: string): boolean {
  if (!urlString || typeof urlString !== "string") return false;
  const trimmed = urlString.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    return false;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Trích xuất hostname rút gọn từ URL hợp lệ (ví dụ: youtube.com, drive.google.com).
 */
export function getDomainFromUrl(urlString?: string): string {
  if (!urlString || !isValidHttpUrl(urlString)) return "";
  try {
    const parsed = new URL(urlString.trim());
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

interface ResourceItem {
  _id: string;
  title: string;
  description?: string;
  type: "Document" | "Video" | "Link" | "Other" | string;
  url: string;
  uploadedBy?:
    | {
        _id?: string;
        fullName?: string;
        email?: string;
      }
    | string;
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
  ({
    classId,
    className = "Lớp học",
    resources = [],
    teacherName = "Giảng viên",
    onRefresh,
    loading = false,
  }) => {
    // Toolbar state
    const [searchQuery, setSearchQuery] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [form] = Form.useForm();
    const watchedTitle = Form.useWatch("title", form);
    const isTitleAllDigits = Boolean(
      watchedTitle && typeof watchedTitle === "string" && /^\d+$/.test(watchedTitle.trim())
    );

    // Statistics breakdown
    const stats = useMemo(() => {
      const total = resources.length;
      const docs = resources.filter((r) => r.type === "Document").length;
      const videos = resources.filter((r) => r.type === "Video").length;
      const links = resources.filter((r) => r.type === "Link").length;
      const others = resources.filter(
        (r) => !["Document", "Video", "Link"].includes(r.type)
      ).length;

      return { total, docs, videos, links, others };
    }, [resources]);

    // Filter & Sort materials
    const filteredResources = useMemo(() => {
      let result = [...resources];

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        result = result.filter(
          (r) =>
            r.title.toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q)
        );
      }

      // Filter by type
      if (typeFilter !== "all") {
        result = result.filter(
          (r) => (r.type || "Document").toLowerCase() === typeFilter.toLowerCase()
        );
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
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Lỗi khi thêm tài liệu!"));
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
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Lỗi khi xóa tài liệu!"));
      }
    };

    // Helper: File Type Icon
    const getFileTypeIcon = (type?: string) => {
      switch (type) {
        case "Video":
          return <VideoCameraOutlined style={{ fontSize: 24, color: "var(--color-error-base)" }} />;
        case "Link":
          return <LinkOutlined style={{ fontSize: 24, color: "var(--color-action-primary-bg)" }} />;
        case "Document":
          return <FilePdfOutlined style={{ fontSize: 24, color: "var(--color-warning-base)" }} />;
        default:
          return <FileUnknownOutlined style={{ fontSize: 24, color: "var(--color-secondary-icon)" }} />;
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
        render: (_, record) => {
          const isValidUrl = isValidHttpUrl(record.url);
          const domain = isValidUrl ? getDomainFromUrl(record.url) : "";

          return (
            <Space size={12} align="start">
              {getFileTypeIcon(record.type)}
              <div style={{ maxWidth: 360 }}>
                <Text strong style={{ fontSize: 14, display: "block" }}>
                  {record.title}
                </Text>
                {record.description && (
                  <Paragraph
                    type="secondary"
                    ellipsis={{ rows: 2 }}
                    style={{ margin: "2px 0 4px", fontSize: 12 }}
                  >
                    {record.description}
                  </Paragraph>
                )}

                {/* URL Source / Domain Info */}
                {isValidUrl ? (
                  <Tooltip title={`Mở liên kết: ${record.url}`} placement="topLeft">
                    <a
                      href={record.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        color: "var(--color-action-primary-bg)",
                        maxWidth: 280,
                        textDecoration: "none",
                      }}
                    >
                      <GlobalOutlined style={{ fontSize: 11 }} />
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {domain || record.url}
                      </span>
                      <ExportOutlined style={{ fontSize: 10 }} />
                    </a>
                  </Tooltip>
                ) : (
                  <Tooltip
                    title={`Đường dẫn không an toàn hoặc không hợp lệ: "${record.url}". Hệ thống đã vô hiệu hóa liên kết này.`}
                    placement="topLeft"
                  >
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontSize: 12,
                        color: "var(--color-warning-base)",
                        backgroundColor: "var(--color-warning-bg)",
                        padding: "2px 6px",
                        borderRadius: 4,
                        maxWidth: 280,
                      }}
                    >
                      <WarningOutlined style={{ fontSize: 11 }} />
                      <span
                        style={{
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {record.url || "(Trống)"} - Không an toàn
                      </span>
                    </span>
                  </Tooltip>
                )}
              </div>
            </Space>
          );
        },
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
              <UserOutlined style={{ color: "var(--color-text-description)" }} />
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
        render: (_, record) => {
          const isValidUrl = isValidHttpUrl(record.url);

          return (
            <Space size={8}>
              {isValidUrl ? (
                <Tooltip title="Mở liên kết / Xem tài liệu">
                  <Button
                    type="primary"
                    size="small"
                    icon={<ExportOutlined />}
                    href={record.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ borderRadius: 6 }}
                  >
                    Mở
                  </Button>
                </Tooltip>
              ) : (
                <Tooltip title="Đường dẫn không hợp lệ hoặc không an toàn (chỉ hỗ trợ http:// hoặc https://)">
                  <Button disabled size="small" icon={<WarningOutlined />} style={{ borderRadius: 6 }}>
                    Không hợp lệ
                  </Button>
                </Tooltip>
              )}

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
          );
        },
      },
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {/* 1. Header Banner & Quick Statistics */}
        <Card
          style={{
            borderRadius: 16,
            background: "linear-gradient(135deg, var(--color-action-primary-bg) 0%, var(--color-action-primary-bg-active) 100%)",
            color: "var(--color-surface)",
            boxShadow: "0 8px 24px rgba(24, 144, 255, 0.25)",
          }}
          styles={{ body: { padding: "24px 32px" } }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 20,
            }}
          >
            <div>
              <Space size={12} align="center">
                <FolderOpenOutlined style={{ fontSize: 28, color: "var(--color-surface)" }} />
                <Title level={4} style={{ color: "var(--color-surface)", margin: 0, fontWeight: 700 }}>
                  Kho Tài liệu & Học liệu lớp: {className}
                </Title>
              </Space>
              <Text
                style={{
                  color: "rgba(255,255,255,0.85)",
                  display: "block",
                  marginTop: 4,
                  fontSize: 13,
                }}
              >
                Đăng tải và chia sẻ các tệp PDF, tài liệu hướng dẫn, video và liên kết bài học cho
                học sinh trong lớp.
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
                  color: "var(--color-surface)",
                  fontWeight: 600,
                }}
              >
                Làm mới
              </Button>
            )}
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={12} sm={8} md={4.8} style={{ flex: 1 }}>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <Statistic
                  title={
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                      Tổng số tệp
                    </Text>
                  }
                  value={stats.total}
                  styles={{ content: { color: "var(--color-surface)", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={4.8} style={{ flex: 1 }}>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <Statistic
                  title={
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                      📄 Văn bản / PDF
                    </Text>
                  }
                  value={stats.docs}
                  prefix={<FilePdfOutlined style={{ color: "var(--color-warning-bg)", marginRight: 6 }} />}
                  styles={{ content: { color: "var(--color-surface)", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={4.8} style={{ flex: 1 }}>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <Statistic
                  title={
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                      🎥 Video bài giảng
                    </Text>
                  }
                  value={stats.videos}
                  prefix={<VideoCameraOutlined style={{ color: "var(--color-warning-base)", marginRight: 6 }} />}
                  styles={{ content: { color: "var(--color-surface)", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={4.8} style={{ flex: 1 }}>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <Statistic
                  title={
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                      🔗 Liên kết Link
                    </Text>
                  }
                  value={stats.links}
                  prefix={<LinkOutlined style={{ color: "var(--color-border-primary-tint)", marginRight: 6 }} />}
                  styles={{ content: { color: "var(--color-surface)", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={4.8} style={{ flex: 1 }}>
              <div
                style={{
                  backgroundColor: "rgba(255,255,255,0.15)",
                  padding: "12px 16px",
                  borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.25)",
                }}
              >
                <Statistic
                  title={
                    <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                      📂 Tệp khác
                    </Text>
                  }
                  value={stats.others}
                  styles={{ content: { color: "var(--color-surface)", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>
          </Row>
        </Card>

        {/* 2. Main Content: Toolbar & Table */}
        <Card
          title={
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
              }}
            >
              <Space size={12} wrap>
                <Input
                  placeholder="Tìm tài liệu theo tên..."
                  prefix={<SearchOutlined style={{ color: "var(--color-text-disabled)" }} />}
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
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsAddModalOpen(true)}
                    style={{ borderRadius: 6 }}
                  >
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
          <Form
            form={form}
            layout="vertical"
            onFinish={handleAddResourceSubmit}
            validateTrigger="onBlur"
            style={{ marginTop: 16 }}
          >
            <Form.Item
              name="title"
              label="Tiêu đề tài liệu"
              rules={[
                { required: true, message: "Vui lòng nhập tiêu đề tài liệu!" },
                { whitespace: true, message: "Tiêu đề không được chỉ chứa khoảng trắng!" },
                { min: 3, message: "Tiêu đề tài liệu phải có ít nhất 3 ký tự!" },
                { max: 200, message: "Tiêu đề tài liệu tối đa 200 ký tự!" },
              ]}
              extra={
                isTitleAllDigits ? (
                  <span
                    style={{
                      color: "var(--color-warning-base)",
                      fontSize: 12,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      marginTop: 4,
                    }}
                  >
                    <WarningOutlined />
                    Tiêu đề chỉ toàn chữ số. Bạn nên bổ sung tên mô tả tài liệu rõ ràng hơn để học sinh dễ nhận biết.
                  </span>
                ) : null
              }
            >
              <Input
                placeholder="Ví dụ: Tài liệu ôn tập Chương 1 - Đề cương môn học"
                maxLength={200}
                showCount
              />
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
                {
                  validator: (_, value) => {
                    if (!value || !value.trim()) return Promise.resolve();
                    const trimmed = value.trim();
                    if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
                      return Promise.reject(
                        new Error("URL tài liệu bắt buộc phải bắt đầu bằng http:// hoặc https://")
                      );
                    }
                    try {
                      new URL(trimmed);
                      return Promise.resolve();
                    } catch {
                      return Promise.reject(
                        new Error("Định dạng URL không hợp lệ (ví dụ: https://drive.google.com/...)")
                      );
                    }
                  },
                },
              ]}
            >
              <Input placeholder="https://drive.google.com/... hoặc https://youtube.com/..." />
            </Form.Item>

            <Form.Item
              name="description"
              label="Mô tả / Ghi chú cho học sinh"
              rules={[{ max: 500, message: "Mô tả tối đa 500 ký tự!" }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Nhập ghi chú chi tiết hoặc dặn dò học sinh khi xem tài liệu..."
                maxLength={500}
                showCount
              />
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <Button onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
              <Form.Item noStyle shouldUpdate>
                {() => {
                  const hasErrors = form.getFieldsError().some(({ errors }) => errors.length > 0);
                  const titleVal = form.getFieldValue("title");
                  const urlVal = form.getFieldValue("url");
                  const isFormIncomplete =
                    !titleVal ||
                    !urlVal ||
                    typeof titleVal !== "string" ||
                    typeof urlVal !== "string" ||
                    !titleVal.trim() ||
                    !urlVal.trim();

                  return (
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                      disabled={hasErrors || isFormIncomplete}
                    >
                      Lưu tài liệu
                    </Button>
                  );
                }}
              </Form.Item>
            </div>
          </Form>
        </Modal>
      </div>
    );
  }
);

TeacherMaterialsTab.displayName = "TeacherMaterialsTab";
