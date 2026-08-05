import React, { useState, useMemo, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
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
  Radio,
  Progress,
  Alert,
  Upload,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { RcFile } from "antd/es/upload";
import {
  FilePdfOutlined,
  VideoCameraOutlined,
  LinkOutlined,
  FileUnknownOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileImageOutlined,
  FileZipOutlined,
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
  EyeOutlined,
  CloudUploadOutlined,
  InboxOutlined,
  FileOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";

import { classApi } from "../../../../api/classApi";
import { toast } from "../../../../utils/toast";
import { getApiErrorMessage } from "../../../../shared/utils/apiError";
import { classifyResource } from "../../../lesson/utils/resourceUtils";
import type { ILearningMaterial } from "../../../../types/learningMaterial";

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
  url?: string;
  publicId?: string;
  storageType?: string;
  resourceType?: string;
  format?: string;
  bytes?: number;
  originalFilename?: string;
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

    // Modal & Upload state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [uploadMode, setUploadMode] = useState<"file" | "link">("file");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [submitting, setSubmitting] = useState(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [form] = Form.useForm();
    const watchedTitle = Form.useWatch("title", form);
    const isTitleAllDigits = Boolean(
      watchedTitle && typeof watchedTitle === "string" && /^\d+$/.test(watchedTitle.trim())
    );

    // Statistics breakdown & Quota calculation (Hạn mức 2 GB)
    const CLASS_STORAGE_LIMIT_BYTES = 2 * 1024 * 1024 * 1024;
    const stats = useMemo(() => {
      const total = resources.length;
      const docs = resources.filter((r) => r.type === "Document").length;
      const videos = resources.filter((r) => r.type === "Video").length;
      const links = resources.filter((r) => r.type === "Link").length;
      const others = resources.filter(
        (r) => !["Document", "Video", "Link"].includes(r.type)
      ).length;
      const totalBytes = resources.reduce((sum, r) => sum + (r.bytes || 0), 0);
      const usedMB = (totalBytes / (1024 * 1024)).toFixed(1);
      const usedPercent = Math.min(100, (totalBytes / CLASS_STORAGE_LIMIT_BYTES) * 100);

      return { total, docs, videos, links, others, totalBytes, usedMB, usedPercent };
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

    // Helper kiểm tra và chọn file từ máy
    const handleBeforeUpload = useCallback(
      (file: RcFile) => {
        const isLt50M = file.size / 1024 / 1024 <= 50;
        if (!isLt50M) {
          toast.error("Dung lượng file vượt quá giới hạn 50 MB! Vui lòng chọn file nhỏ hơn.");
          return Upload.LIST_IGNORE;
        }

        const fileName = file.name || "";
        const ext = fileName.substring(fileName.lastIndexOf(".")).toLowerCase();
        const allowedExts = [
          ".pdf",
          ".docx",
          ".doc",
          ".pptx",
          ".ppt",
          ".xlsx",
          ".xls",
          ".png",
          ".jpg",
          ".jpeg",
          ".webp",
          ".gif",
        ];
        if (!allowedExts.includes(ext)) {
          toast.error(
            "Định dạng file không được hỗ trợ. Vui lòng chọn file PDF, Word, PowerPoint, Excel hoặc ảnh."
          );
          return Upload.LIST_IGNORE;
        }

        setSelectedFile(file);

        // Tự động điền tiêu đề nếu ô tiêu đề đang trống
        const currentTitle = form.getFieldValue("title");
        if (!currentTitle || !currentTitle.trim()) {
          const rawName = fileName.substring(0, fileName.lastIndexOf(".")) || fileName;
          form.setFieldsValue({ title: rawName });
        }

        // Gợi ý loại tài nguyên phù hợp
        if ([".pdf", ".docx", ".doc", ".pptx", ".ppt", ".xlsx", ".xls"].includes(ext)) {
          form.setFieldsValue({ type: "Document" });
        } else if ([".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext)) {
          form.setFieldsValue({ type: "Other" });
        }

        return false; // Chặn antd tự động upload
      },
      [form]
    );

    // Xử lý gửi Form: Upload file lên Cloudinary
    const handleFileUploadSubmit = async (values: any) => {
      if (!classId || !selectedFile) {
        toast.error("Vui lòng chọn file tài liệu cần tải lên!");
        return;
      }
      setSubmitting(true);
      setUploadProgress(0);
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("title", values.title.trim());
        if (values.description?.trim()) {
          formData.append("description", values.description.trim());
        }
        formData.append("type", values.type || "Document");

        const res = await classApi.uploadResource(
          classId,
          formData,
          (percent) => {
            setUploadProgress(percent);
          },
          controller.signal
        );

        toast.success("Tải tài liệu lên lớp học thành công!");
        if (res.data?.warning) {
          toast.warning(res.data.warning);
        }
        handleCloseModal();
        if (onRefresh) onRefresh();
      } catch (err: any) {
        if (err?.name === "CanceledError" || err?.code === "ERR_CANCELED") {
          toast.info("Đã hủy quá trình tải tài liệu.");
        } else {
          toast.error(getApiErrorMessage(err, "Lỗi khi tải tài liệu lên!"));
        }
      } finally {
        setSubmitting(false);
        abortControllerRef.current = null;
      }
    };

    // Xử lý gửi Form: Thêm liên kết ngoài (Dán URL)
    const handleAddLinkResourceSubmit = async (values: any) => {
      if (!classId) return;
      setSubmitting(true);
      try {
        await classApi.addResource(classId, {
          title: values.title.trim(),
          description: values.description?.trim() || "",
          type: values.type || "Document",
          url: values.url.trim(),
        });

        toast.success("Thêm liên kết tài liệu mới thành công!");
        handleCloseModal();
        if (onRefresh) onRefresh();
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Lỗi khi thêm tài liệu!"));
      } finally {
        setSubmitting(false);
      }
    };

    // Đóng và reset modal
    const handleCloseModal = () => {
      if (submitting && abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setIsAddModalOpen(false);
      form.resetFields();
      setSelectedFile(null);
      setUploadProgress(0);
      setSubmitting(false);
      setUploadMode("file");
    };

    // Xóa tài liệu khỏi lớp học
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
    const getFileTypeIcon = (record: ResourceItem) => {
      const meta = classifyResource(record);
      switch (meta.kind) {
        case "youtube":
        case "video":
          return <VideoCameraOutlined style={{ fontSize: 24, color: "var(--color-error-base)" }} />;
        case "pdf":
          return <FilePdfOutlined style={{ fontSize: 24, color: "var(--color-error-base)" }} />;
        case "docx":
          return <FileWordOutlined style={{ fontSize: 24, color: "var(--color-action-primary-bg, #1677ff)" }} />;
        case "excel":
          return <FileExcelOutlined style={{ fontSize: 24, color: "var(--color-success-base, #10b981)" }} />;
        case "slide":
          return <FilePptOutlined style={{ fontSize: 24, color: "var(--color-warning-base)" }} />;
        case "image":
          return <FileImageOutlined style={{ fontSize: 24, color: "var(--color-action-primary-bg)" }} />;
        case "zip":
          return <FileZipOutlined style={{ fontSize: 24, color: "var(--color-secondary-icon)" }} />;
        case "link":
          return <LinkOutlined style={{ fontSize: 24, color: "var(--color-action-primary-bg)" }} />;
        default:
          return <FileUnknownOutlined style={{ fontSize: 24, color: "var(--color-secondary-icon)" }} />;
      }
    };

    // Helper: File Type Tag
    const getTypeTag = (record: ResourceItem) => {
      const meta = classifyResource(record);
      switch (meta.kind) {
        case "youtube":
        case "video":
          return <Tag color="error">{meta.label}</Tag>;
        case "pdf":
          return <Tag color="red">{meta.label}</Tag>;
        case "docx":
          return <Tag color="geekblue">{meta.label}</Tag>;
        case "excel":
          return <Tag color="green">{meta.label}</Tag>;
        case "slide":
          return <Tag color="orange">{meta.label}</Tag>;
        case "image":
          return <Tag color="cyan">{meta.label}</Tag>;
        case "zip":
          return <Tag color="purple">{meta.label}</Tag>;
        case "link":
          return <Tag color="processing">{meta.label}</Tag>;
        default:
          return <Tag color="default">{meta.label}</Tag>;
      }
    };

    const columns: ColumnsType<ResourceItem> = [
      {
        title: "Tài liệu",
        key: "title",
        render: (_, record) => {
          const isUploaded = Boolean(record.publicId);
          const isValidUrl = isValidHttpUrl(record.url);
          const domain = isValidUrl ? getDomainFromUrl(record.url) : "";

          return (
            <Space size={12} align="start">
              {getFileTypeIcon(record)}
              <div style={{ maxWidth: 360 }}>
                <Link
                  to={`/teacher/classroom-detail/${classId}/resource/${record._id}`}
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--color-action-primary-bg, #1677ff)",
                    display: "block",
                  }}
                  className="hover:underline"
                >
                  {record.title}
                </Link>
                {record.description && (
                  <Paragraph
                    type="secondary"
                    ellipsis={{ rows: 2 }}
                    style={{ margin: "2px 0 4px", fontSize: 12 }}
                  >
                    {record.description}
                  </Paragraph>
                )}

                {/* Storage badge hoặc URL Source */}
                {isUploaded ? (
                  <Space size={6} wrap style={{ marginTop: 2 }}>
                    <Tag
                      color="blue"
                      icon={<CloudUploadOutlined />}
                      style={{ fontSize: 11, borderRadius: 4 }}
                    >
                      Lưu trữ riêng tư {record.bytes ? `(${(record.bytes / 1024 / 1024).toFixed(1)} MB)` : ""}
                    </Tag>
                    {record.originalFilename && (
                      <Text type="secondary" style={{ fontSize: 11 }}>
                        • {record.originalFilename}
                      </Text>
                    )}
                  </Space>
                ) : isValidUrl ? (
                  <Tooltip title={`Mở liên kết gốc: ${record.url}`} placement="topLeft">
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
        key: "type",
        width: 140,
        render: (_, record) => getTypeTag(record),
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
          return (
            <Space size={8}>
              <Tooltip title="Xem tài liệu trực tiếp (PDF, Word, Video YouTube, Link)">
                <Link to={`/teacher/classroom-detail/${classId}/resource/${record._id}`}>
                  <Button
                    type="primary"
                    size="small"
                    icon={<EyeOutlined />}
                    style={{ borderRadius: 6 }}
                  >
                    Xem
                  </Button>
                </Link>
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
          title="Thêm tài liệu học tập mới cho lớp học"
          open={isAddModalOpen}
          onCancel={handleCloseModal}
          footer={null}
          destroyOnClose
          width={580}
        >
          {/* Mode Switcher */}
          <div style={{ marginTop: 8, marginBottom: 20 }}>
            <Radio.Group
              value={uploadMode}
              onChange={(e) => {
                setUploadMode(e.target.value);
                form.resetFields();
                setSelectedFile(null);
                setUploadProgress(0);
              }}
              buttonStyle="solid"
              style={{ width: "100%", display: "flex" }}
              disabled={submitting}
            >
              <Radio.Button value="file" style={{ flex: 1, textAlign: "center" }}>
                <CloudUploadOutlined style={{ marginRight: 6 }} />
                Tải file từ máy (Khuyến nghị)
              </Radio.Button>
              <Radio.Button value="link" style={{ flex: 1, textAlign: "center" }}>
                <LinkOutlined style={{ marginRight: 6 }} />
                Dán liên kết URL
              </Radio.Button>
            </Radio.Group>
          </div>

          {/* Form Content */}
          {uploadMode === "file" && (
            <div style={{ marginBottom: 16 }}>
              {!selectedFile ? (
                <Upload.Dragger
                  name="file"
                  multiple={false}
                  showUploadList={false}
                  beforeUpload={handleBeforeUpload}
                  accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.png,.jpg,.jpeg,.webp,.gif"
                  disabled={submitting}
                  style={{
                    padding: "20px 0",
                    borderRadius: 12,
                    border: "2px dashed var(--color-action-primary-bg, #1677ff)",
                    backgroundColor: "#f8fafc",
                  }}
                >
                  <p className="ant-upload-drag-icon" style={{ marginBottom: 8 }}>
                    <InboxOutlined style={{ fontSize: 40, color: "var(--color-action-primary-bg, #1677ff)" }} />
                  </p>
                  <p className="ant-upload-text" style={{ fontSize: 14, fontWeight: 600, margin: "0 0 4px" }}>
                    Kéo thả file vào đây hoặc bấm để chọn tệp từ máy
                  </p>
                  <p className="ant-upload-hint" style={{ fontSize: 12, color: "var(--color-text-secondary)", margin: 0 }}>
                    Hỗ trợ PDF, Word (.docx), PowerPoint (.pptx), Excel, Ảnh (Tối đa 50 MB)
                  </p>
                </Upload.Dragger>
              ) : (
                <Card
                  size="small"
                  style={{
                    backgroundColor: "#f0fdf4",
                    borderColor: "#86efac",
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Space size={12}>
                      <FileOutlined style={{ fontSize: 26, color: "#16a34a" }} />
                      <div>
                        <Text strong style={{ fontSize: 13, display: "block" }}>
                          {selectedFile.name}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • File đã sẵn sàng tải lên
                        </Text>
                      </div>
                    </Space>
                    {!submitting && (
                      <Button
                        type="text"
                        danger
                        icon={<CloseCircleOutlined />}
                        onClick={() => {
                          setSelectedFile(null);
                          form.setFieldsValue({ title: "" });
                        }}
                        size="small"
                      >
                        Đổi file
                      </Button>
                    )}
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* Progress Bar khi đang upload */}
          {submitting && uploadMode === "file" && (
            <div
              style={{
                marginBottom: 16,
                padding: "12px 16px",
                backgroundColor: "#eff6ff",
                borderRadius: 8,
                border: "1px solid #bfdbfe",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <Text strong style={{ fontSize: 12, color: "#1e40af" }}>
                  Đang tải file lên Cloudinary an toàn...
                </Text>
                <Text style={{ fontSize: 12, color: "#1e40af", fontWeight: 700 }}>{uploadProgress}%</Text>
              </div>
              <Progress percent={uploadProgress} status="active" strokeColor="var(--color-action-primary-bg, #1677ff)" />
            </div>
          )}

          <Form
            form={form}
            layout="vertical"
            onFinish={uploadMode === "file" ? handleFileUploadSubmit : handleAddLinkResourceSubmit}
            validateTrigger="onBlur"
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
                disabled={submitting}
              />
            </Form.Item>

            <Form.Item name="type" label="Loại tài nguyên" initialValue="Document">
              <Select
                disabled={submitting}
                options={[
                  { value: "Document", label: "Văn bản / Tài liệu PDF / Word" },
                  { value: "Video", label: "Video bài giảng" },
                  { value: "Link", label: "Liên kết trang web (Link)" },
                  { value: "Other", label: "Tệp đính kèm khác (Slide, Excel, Ảnh)" },
                ]}
              />
            </Form.Item>

            {uploadMode === "link" && (
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
                <Input placeholder="https://drive.google.com/... hoặc https://youtube.com/..." disabled={submitting} />
              </Form.Item>
            )}

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
                disabled={submitting}
              />
            </Form.Item>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
              <Button onClick={handleCloseModal} disabled={submitting}>
                {submitting ? "Hủy tải lên" : "Hủy"}
              </Button>
              <Form.Item noStyle shouldUpdate>
                {() => {
                  const hasErrors = form.getFieldsError().some(({ errors }) => errors.length > 0);
                  const titleVal = form.getFieldValue("title");
                  const urlVal = form.getFieldValue("url");
                  const isFileIncomplete =
                    uploadMode === "file" && (!selectedFile || !titleVal || !titleVal.trim());
                  const isLinkIncomplete =
                    uploadMode === "link" &&
                    (!titleVal || !urlVal || !titleVal.trim() || !urlVal.trim());

                  return (
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                      disabled={hasErrors || (uploadMode === "file" ? isFileIncomplete : isLinkIncomplete)}
                    >
                      {uploadMode === "file" ? "Tải lên & Lưu" : "Lưu liên kết"}
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

