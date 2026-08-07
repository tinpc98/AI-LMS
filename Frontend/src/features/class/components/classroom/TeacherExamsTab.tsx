import React, { useState, useMemo, useCallback, useEffect } from "react";
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
  Alert,
  Dropdown,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import type { MenuProps } from "antd";
import {
  FileDoneOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  DeleteOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ReloadOutlined,
  RobotOutlined,
  MoreOutlined,
  EyeOutlined,
  RocketOutlined,
  StopOutlined,
  CopyOutlined,
} from "@ant-design/icons";

import examApi from "../../../../api/examApi";
import examSetApi from "../../../../api/examSetApi";
import type { IExam } from "../../../../api/examApi";
import { toast } from "../../../../utils/toast";
import { TeacherExamAttemptsModal } from "./TeacherExamAttemptsModal";
import { CreateExamWizardModal } from "./CreateExamWizardModal";
import { getApiErrorMessage } from "../../../../shared/utils/apiError";

const { Title, Text, Paragraph } = Typography;

interface TeacherExamsTabProps {
  classId: string;
  className?: string;
  onRefresh?: () => void;
  loading?: boolean;
}

export const TeacherExamsTab: React.FC<TeacherExamsTabProps> = React.memo(
  ({ classId, className = "Lớp học", onRefresh, loading: externalLoading = false }) => {
    const [exams, setExams] = useState<IExam[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Toolbar states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    // Drawer states
    const [selectedExam, setSelectedExam] = useState<IExam | null>(null);
    const [isAttemptsDrawerOpen, setIsAttemptsDrawerOpen] = useState(false);
    const [isCreateWizardOpen, setIsCreateWizardOpen] = useState(false);

    // Fetch exams for this class
    const fetchExams = useCallback(async () => {
      if (!classId) return;
      setLoading(true);
      setError(null);
      try {
        const list = await examApi.getExamsByClass(classId);
        setExams(list || []);
      } catch (err: unknown) {
        console.error("[TeacherExamsTab] Fetch error:", err);
        setError(getApiErrorMessage(err, "Không thể tải danh sách bài kiểm tra của lớp!"));
      } finally {
        setLoading(false);
      }
    }, [classId]);

    useEffect(() => {
      fetchExams();
    }, [fetchExams]);

    // Statistics calculation
    const stats = useMemo(() => {
      const total = exams.length;
      const publishedCount = exams.filter((e) => e.status === "PUBLISHED").length;
      const completedCount = exams.filter((e) => e.status === "COMPLETED").length;
      const aiCount = exams.filter((e) => e.isAIGenerated).length;

      return { total, publishedCount, completedCount, aiCount };
    }, [exams]);

    // Filter & Sort exams
    const filteredExams = useMemo(() => {
      let result = [...exams];

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        result = result.filter(
          (e) =>
            e.title.toLowerCase().includes(q) || (e.aiPromptUsed || "").toLowerCase().includes(q)
        );
      }

      // Status filter
      if (statusFilter !== "all") {
        result = result.filter(
          (e) => (e.status || "").toUpperCase() === statusFilter.toUpperCase()
        );
      }

      // Sort
      result.sort((a, b) => {
        if (sortBy === "duration") return b.duration - a.duration;
        if (sortBy === "title") return a.title.localeCompare(b.title);
        // Default: newest
        return (
          new Date(b.createdAt || b.startTime).getTime() -
          new Date(a.createdAt || a.startTime).getTime()
        );
      });

      return result;
    }, [exams, searchQuery, statusFilter, sortBy]);

    // Handle delete exam
    const handleDeleteExam = async (id: string) => {
      if (!id) return;
      try {
        await examApi.deleteExam(id);
        toast.success("Xóa bài kiểm tra thành công!");
        fetchExams();
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Lỗi khi xóa bài kiểm tra!"));
      }
    };

    // Handle Duplicate Exam Set
    const handleDuplicateExamSet = async (examId: string) => {
      if (!examId) return;
      try {
        await examSetApi.duplicateExamSet(examId);
        toast.success("Nhân bản bộ đề thi thành công!");
        fetchExams();
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Lỗi khi nhân bản bộ đề thi!"));
      }
    };

    // Handle Publish / Unpublish status change
    const handleToggleStatus = async (exam: IExam) => {
      const newStatus = exam.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED";
      try {
        await examApi.updateExam(exam._id, { status: newStatus });
        toast.success(
          `Đã chuyển trạng thái bài thi thành ${newStatus === "PUBLISHED" ? "Đang diễn ra" : "Bản nháp"}`
        );
        fetchExams();
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Lỗi cập nhật trạng thái bài thi!"));
      }
    };

    const getStatusTag = (status?: string) => {
      switch (status) {
        case "COMPLETED":
          return <Tag color="blue">🔵 Đã kết thúc</Tag>;
        case "PUBLISHED":
          return <Tag color="success">🟢 Đang diễn ra</Tag>;
        case "DRAFT":
          return <Tag color="warning">🟡 Bản nháp</Tag>;
        default:
          return <Tag color="green">{status || "PUBLISHED"}</Tag>;
      }
    };

    const columns: ColumnsType<IExam> = [
      {
        title: "Tên bài kiểm tra",
        key: "title",
        render: (_, record) => (
          <div>
            <Space align="center" size={8}>
              <Text strong style={{ fontSize: 15 }}>
                {record.title}
              </Text>
              {record.isAIGenerated && <Tag color="purple">🤖 AI Generated</Tag>}
            </Space>
            {record.aiPromptUsed && (
              <Paragraph
                type="secondary"
                ellipsis={{ rows: 1 }}
                style={{ margin: "4px 0 0", fontSize: 12 }}
              >
                Prompt: {record.aiPromptUsed}
              </Paragraph>
            )}
          </div>
        ),
      },
      {
        title: "Thời lượng & Ngày thi",
        key: "scheduleInfo",
        width: 220,
        render: (_, record) => (
          <div>
            <Space size={6}>
              <ClockCircleOutlined style={{ color: "var(--color-action-primary-bg)" }} />
              <Text strong style={{ fontSize: 13 }}>
                {record.duration} phút
              </Text>
            </Space>
            <div style={{ fontSize: 12, color: "var(--color-text-description)", marginTop: 2 }}>
              Bắt đầu: {new Date(record.startTime).toLocaleString("vi-VN")}
            </div>
          </div>
        ),
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 150,
        render: (status) => getStatusTag(status),
      },
      {
        title: "Điểm tối đa",
        dataIndex: "maxScore",
        key: "maxScore",
        width: 120,
        render: (score) => (
          <Text strong style={{ color: "var(--color-success-base)" }}>
            {score || 10} điểm
          </Text>
        ),
      },
      {
        title: "Thao tác",
        key: "action",
        width: 210,
        align: "right",
        render: (_, record) => {
          const menuItems: MenuProps["items"] = [
            {
              key: "review",
              icon: <EyeOutlined />,
              label: "Bài làm & Chấm điểm",
              onClick: () => {
                setSelectedExam(record);
                setIsAttemptsDrawerOpen(true);
              },
            },
            {
              key: "duplicate",
              icon: <CopyOutlined />,
              label: "Nhân bản bộ đề",
              onClick: () => handleDuplicateExamSet(record._id),
            },
            {
              key: "toggleStatus",
              icon: record.status === "PUBLISHED" ? <StopOutlined /> : <RocketOutlined />,
              label: record.status === "PUBLISHED" ? "Chuyển thành Bản nháp" : "Xuất bản ngay",
              onClick: () => handleToggleStatus(record),
            },
          ];

          return (
            <Space size={8}>
              <Button
                type="primary"
                size="small"
                icon={<FileDoneOutlined />}
                onClick={() => {
                  setSelectedExam(record);
                  setIsAttemptsDrawerOpen(true);
                }}
                style={{ borderRadius: 6 }}
              >
                Bài làm & Chấm bài
              </Button>

              <Dropdown menu={{ items: menuItems }} trigger={["click"]}>
                <Button type="text" size="small" icon={<MoreOutlined />} />
              </Dropdown>

              <Popconfirm
                title="Xóa đề thi này?"
                description="Hành động này sẽ xóa đề thi và toàn bộ lượt thi liên quan."
                onConfirm={() => handleDeleteExam(record._id)}
                okText="Xóa"
                cancelText="Hủy"
                okButtonProps={{ danger: true }}
              >
                <Tooltip title="Xóa đề thi">
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
                <FileDoneOutlined style={{ fontSize: 28, color: "var(--color-surface)" }} />
                <Title level={4} style={{ color: "var(--color-surface)", margin: 0, fontWeight: 700 }}>
                  Quản lý Bài kiểm tra Lớp: {className}
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
                Quản lý các bài thi trắc nghiệm & tự luận, xem lượt thi của sinh viên, cảnh báo gian
                lận và chấm bài.
              </Text>
            </div>

            <Space size={12}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateWizardOpen(true)}
                style={{
                  backgroundColor: "var(--color-success-base)",
                  borderColor: "var(--color-success-base)",
                  fontWeight: 700,
                  borderRadius: 8,
                }}
              >
                Tạo bài kiểm tra
              </Button>

              <Button
                type="default"
                icon={<ReloadOutlined spin={loading} />}
                onClick={fetchExams}
                style={{
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderColor: "rgba(255,255,255,0.4)",
                  color: "var(--color-surface)",
                  fontWeight: 600,
                }}
              >
                Làm mới
              </Button>
            </Space>
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
                      Tổng số bài thi
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
                      🟢 Đang diễn ra
                    </Text>
                  }
                  value={stats.publishedCount}
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
                      🔵 Đã kết thúc
                    </Text>
                  }
                  value={stats.completedCount}
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
                      🤖 Đề thi AI
                    </Text>
                  }
                  value={stats.aiCount}
                  prefix={<RobotOutlined style={{ color: "var(--color-warning-bg)", marginRight: 6 }} />}
                  styles={{ content: { color: "var(--color-surface)", fontWeight: 700, fontSize: 20 } }}
                />
              </div>
            </Col>
          </Row>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert
            message="Lỗi nạp bài kiểm tra"
            description={error}
            type="error"
            showIcon
            action={
              <Button
                size="small"
                type="primary"
                danger
                icon={<ReloadOutlined />}
                onClick={fetchExams}
              >
                Thử lại
              </Button>
            }
            style={{ borderRadius: 8 }}
          />
        )}

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
                  placeholder="Tìm tên bài thi..."
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
                    { value: "all", label: "Tất cả trạng thái" },
                    { value: "PUBLISHED", label: "🟢 Đang diễn ra" },
                    { value: "COMPLETED", label: "🔵 Đã kết thúc" },
                    { value: "DRAFT", label: "🟡 Bản nháp" },
                  ]}
                />

                <Select
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  style={{ width: 140 }}
                  options={[
                    { value: "newest", label: "Mới nhất" },
                    { value: "duration", label: "Thời lượng thi" },
                    { value: "title", label: "Tên A -> Z" },
                  ]}
                />
              </Space>

              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => setIsCreateWizardOpen(true)}
                style={{ fontWeight: 600, borderRadius: 8 }}
              >
                Tạo bài kiểm tra
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
          ) : filteredExams.length > 0 ? (
            <Table
              columns={columns}
              dataSource={filteredExams}
              rowKey={(record, index) => record._id || `ex-${index}`}
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <div style={{ padding: 40, textAlign: "center" }}>
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <Text type="secondary">
                    {searchQuery || statusFilter !== "all"
                      ? "Không tìm thấy bài kiểm tra nào phù hợp."
                      : "Lớp học chưa có bài kiểm tra nào."}
                  </Text>
                }
              >
                {!searchQuery && statusFilter === "all" && (
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => setIsCreateWizardOpen(true)}
                    style={{ borderRadius: 6 }}
                  >
                    Tạo bài kiểm tra đầu tiên
                  </Button>
                )}
              </Empty>
            </div>
          )}
        </Card>

        {/* 3. Attempts Drawer */}
        <TeacherExamAttemptsModal
          open={isAttemptsDrawerOpen}
          onClose={() => setIsAttemptsDrawerOpen(false)}
          exam={selectedExam}
        />

        {/* 4. Create Exam Wizard Drawer */}
        <CreateExamWizardModal
          open={isCreateWizardOpen}
          onClose={() => setIsCreateWizardOpen(false)}
          classId={classId}
          className={className}
          onSaved={fetchExams}
        />
      </div>
    );
  }
);

TeacherExamsTab.displayName = "TeacherExamsTab";
