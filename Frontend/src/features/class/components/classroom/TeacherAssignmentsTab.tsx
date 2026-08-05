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
  Space,
  Typography,
  Popconfirm,
  Empty,
  Skeleton,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FormOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  DeleteOutlined,
  EditOutlined,
  FileDoneOutlined,
  ClockCircleOutlined,
  PaperClipOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

import assignmentApi from "../../../../api/assignmentApi";
import { toast } from "../../../../utils/toast";
import type { IAssignment } from "../../../../interface/assignmentInterface";
import { TeacherSubmissionsModal } from "./TeacherSubmissionsModal";
import CreateAssignmentModal from "../../../assignment/components/CreateAssignmentModal";
import {
  AttachmentViewerModal,
  isViewableFile,
  type AttachmentFile,
} from "../../../../shared/components/AttachmentViewerModal";
import { getApiErrorMessage } from "../../../../shared/utils/apiError";

const { Title, Text, Paragraph } = Typography;

interface TeacherAssignmentsTabProps {
  classId: string;
  className?: string;
  assignments?: IAssignment[];
  onRefresh?: () => void;
  loading?: boolean;
}

export const TeacherAssignmentsTab: React.FC<TeacherAssignmentsTabProps> = React.memo(
  ({ classId, className = "Lớp học", assignments = [], onRefresh, loading = false }) => {
    // Toolbar states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    // Modal & Drawer states
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingAssignment, setEditingAssignment] = useState<IAssignment | null>(null);
    const [viewerFile, setViewerFile] = useState<AttachmentFile | null>(null);
    const [selectedAssignment, setSelectedAssignment] = useState<IAssignment | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Statistics calculation
    const stats = useMemo(() => {
      const total = assignments.length;
      const now = new Date();

      const openCount = assignments.filter((a) => new Date(a.deadline) >= now).length;
      const closedCount = assignments.filter((a) => new Date(a.deadline) < now).length;
      const aiGeneratedCount = assignments.filter((a) => (a as any).isAIGenerated).length;

      return { total, openCount, closedCount, aiGeneratedCount };
    }, [assignments]);

    // Filter & Sort assignments
    const filteredAssignments = useMemo(() => {
      let result = [...assignments];

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        result = result.filter(
          (a) =>
            a.title.toLowerCase().includes(q) || (a.description || "").toLowerCase().includes(q)
        );
      }

      // Status filter
      const now = new Date();
      if (statusFilter === "open") {
        result = result.filter((a) => new Date(a.deadline) >= now);
      } else if (statusFilter === "closed") {
        result = result.filter((a) => new Date(a.deadline) < now);
      }

      // Sort
      result.sort((a, b) => {
        if (sortBy === "deadline-asc")
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        if (sortBy === "deadline-desc")
          return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
        // Default: newest
        return (
          new Date(b.createdAt || b.deadline).getTime() -
          new Date(a.createdAt || a.deadline).getTime()
        );
      });

      return result;
    }, [assignments, searchQuery, statusFilter, sortBy]);

    // Handle delete assignment
    const handleDeleteAssignment = async (id: string) => {
      if (!id) return;
      try {
        await assignmentApi.deleteAssignment(id);
        toast.success("Xóa bài tập thành công!");
        if (onRefresh) onRefresh();
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Lỗi khi xóa bài tập!"));
      }
    };

    const columns: ColumnsType<IAssignment> = [
      {
        title: "Tên bài tập",
        key: "title",
        render: (_, record) => (
          <div>
            <Space align="center" size={8}>
              <Text strong style={{ fontSize: 15 }}>
                {record.title}
              </Text>
              {(record as any).isAIGenerated && <Tag color="purple">🤖 AI Created</Tag>}
            </Space>
            {record.description && (
              <Paragraph
                type="secondary"
                ellipsis={{ rows: 2 }}
                style={{ margin: "4px 0 0", fontSize: 13 }}
              >
                {record.description}
              </Paragraph>
            )}
            {record.attachments && record.attachments.length > 0 && (
              <Space size={8} wrap style={{ marginTop: 6 }}>
                {record.attachments.map((att: any, idx: number) => (
                  <span
                    key={att.publicId || idx}
                    style={{
                      fontSize: 12,
                      color: isViewableFile(att.name || att.url, att.format) ? "#1677ff" : "var(--color-text-title)",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      textDecoration: "underline",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isViewableFile(att.name || att.url, att.format)) {
                        setViewerFile(att);
                      } else {
                        window.open(att.url, "_blank");
                      }
                    }}
                    title={att.name}
                  >
                    <PaperClipOutlined /> {att.name || `Tệp ${idx + 1}`}
                  </span>
                ))}
              </Space>
            )}
          </div>
        ),
      },
      {
        title: "Hình thức nộp",
        key: "submissionMode",
        width: 150,
        render: (_, record) => {
          const mode = record.submissionMode || "file";
          if (mode === "link") {
            return <Tag color="cyan">🔗 Dán link</Tag>;
          }
          if (mode === "direct") {
            const qCount = record.questions?.length || 0;
            return <Tag color="orange">✍️ Trực tiếp ({qCount} câu)</Tag>;
          }
          if (mode === "any") {
            return <Tag color="green">🎯 Tự chọn</Tag>;
          }
          return <Tag color="blue">📁 Tệp đính kèm</Tag>;
        },
      },
      {
        title: "Hạn nộp bài",
        dataIndex: "deadline",
        key: "deadline",
        width: 180,
        render: (deadline) => {
          const isExpired = new Date(deadline) < new Date();
          return (
            <div>
              <Space size={6}>
                <ClockCircleOutlined style={{ color: isExpired ? "var(--color-error-base)" : "var(--color-success-base)" }} />
                <Text style={{ fontSize: 13 }}>{new Date(deadline).toLocaleString("vi-VN")}</Text>
              </Space>
              <div style={{ marginTop: 2 }}>
                {isExpired ? (
                  <Tag color="error">🔴 Đã đóng / Hết hạn</Tag>
                ) : (
                  <Tag color="success">🟢 Đang mở nộp</Tag>
                )}
              </div>
            </div>
          );
        },
      },
      {
        title: "Thao tác",
        key: "action",
        width: 250,
        align: "right",
        render: (_, record) => (
          <Space size={8}>
            <Button
              type="primary"
              size="small"
              icon={<FileDoneOutlined />}
              onClick={() => {
                setSelectedAssignment(record);
                setIsDrawerOpen(true);
              }}
              style={{ borderRadius: 6 }}
            >
              Bài nộp
            </Button>

            <Tooltip title="Chỉnh sửa bài tập">
              <Button
                type="default"
                size="small"
                icon={<EditOutlined />}
                onClick={() => {
                  setEditingAssignment(record);
                  setIsCreateModalOpen(true);
                }}
                style={{ borderRadius: 6 }}
              />
            </Tooltip>

            <Popconfirm
              title="Xóa bài tập này?"
              description="Hành động này sẽ xóa hoàn toàn bài tập và toàn bộ bài nộp liên quan."
              onConfirm={() => handleDeleteAssignment(record._id)}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Xóa bài tập">
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
            background: "linear-gradient(135deg, var(--color-sidebar-bg) 0%, var(--color-sidebar-hover) 100%)",
            color: "var(--color-surface)",
            boxShadow: "0 8px 24px rgba(0, 33, 64, 0.25)",
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
                <FormOutlined style={{ fontSize: 28, color: "var(--color-surface)" }} />
                <Title level={4} style={{ color: "var(--color-surface)", margin: 0, fontWeight: 700 }}>
                  Quản lý Bài tập Lớp: {className}
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
                Giao bài tập, quản lý thời gian nộp bài và thực hiện chấm điểm, nhận xét cho học
                sinh trong lớp.
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
            <Col xs={12} sm={8} md={6}>
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
                      Tổng số bài tập
                    </Text>
                  }
                  value={stats.total}
                  styles={{ content: { color: "var(--color-surface)", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={6}>
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
                      🟢 Đang mở nộp
                    </Text>
                  }
                  value={stats.openCount}
                  prefix={<CheckCircleOutlined style={{ color: "var(--color-border-default)", marginRight: 6 }} />}
                  styles={{ content: { color: "var(--color-surface)", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={6}>
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
                      🔴 Đã hết hạn
                    </Text>
                  }
                  value={stats.closedCount}
                  prefix={
                    <ExclamationCircleOutlined style={{ color: "var(--color-warning-base)", marginRight: 6 }} />
                  }
                  styles={{ content: { color: "var(--color-surface)", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>

            <Col xs={12} sm={8} md={6}>
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
                      🤖 Bài tập AI
                    </Text>
                  }
                  value={stats.aiGeneratedCount}
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
                  placeholder="Tìm kiếm bài tập..."
                  prefix={<SearchOutlined style={{ color: "var(--color-text-disabled)" }} />}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: 240, borderRadius: 8 }}
                  allowClear
                />

                <Select
                  value={statusFilter}
                  onChange={(val) => setStatusFilter(val)}
                  style={{ width: 160 }}
                  suffixIcon={<FilterOutlined />}
                  options={[
                    { value: "all", label: "Tất cả bài tập" },
                    { value: "open", label: "🟢 Đang mở nộp" },
                    { value: "closed", label: "🔴 Đã hết hạn" },
                  ]}
                />

                <Select
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  style={{ width: 150 }}
                  options={[
                    { value: "newest", label: "Mới nhất" },
                    { value: "deadline-asc", label: "Hạn nộp gần nhất" },
                    { value: "deadline-desc", label: "Hạn nộp xa nhất" },
                  ]}
                />
              </Space>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateModalOpen(true)}
                style={{ fontWeight: 600, borderRadius: 8 }}
              >
                Tạo bài tập mới
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
          ) : filteredAssignments.length > 0 ? (
            <Table
              columns={columns}
              dataSource={filteredAssignments}
              rowKey={(record, index) => record._id || `asg-${index}`}
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text type="secondary">
                    {searchQuery || statusFilter !== "all"
                      ? "Không tìm thấy bài tập nào phù hợp với bộ lọc."
                      : "Lớp học chưa có bài tập nào được giao."}
                  </Text>
                }
              >
                {!searchQuery && statusFilter === "all" && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsCreateModalOpen(true)}
                    style={{ borderRadius: 6 }}
                  >
                    Tạo bài tập đầu tiên
                  </Button>
                )}
              </Empty>
            </div>
          )}
        </Card>

        {/* 3. Submissions Modal & Create Assignment Modal */}
        <TeacherSubmissionsModal
          open={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          assignment={selectedAssignment}
        />

        <CreateAssignmentModal
          isOpen={isCreateModalOpen}
          initialAssignment={editingAssignment}
          hasGradedSubmissions={editingAssignment?.hasGradedSubmissions}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingAssignment(null);
          }}
          classId={classId}
          onCreated={() => {
            setIsCreateModalOpen(false);
            setEditingAssignment(null);
            if (onRefresh) onRefresh();
          }}
        />

        {/* Modal Xem trước file đính kèm */}
        <AttachmentViewerModal
          open={Boolean(viewerFile)}
          onClose={() => setViewerFile(null)}
          file={viewerFile}
        />
      </div>
    );
  }
);

TeacherAssignmentsTab.displayName = "TeacherAssignmentsTab";
