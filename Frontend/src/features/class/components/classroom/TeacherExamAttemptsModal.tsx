import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Modal,
  Table,
  Avatar,
  Tag,
  Button,
  Typography,
  Space,
  Spin,
  Empty,
  Card,
  Row,
  Col,
  Statistic,
  Input,
  Select,
  Tooltip,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FileDoneOutlined,
  UserOutlined,
  EditOutlined,
  AlertOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
} from "@ant-design/icons";
import examApi from "../../../../api/examApi";
import type { IExam, IExamAttempt } from "../../../../api/examApi";
import { TeacherGradeModal } from "./TeacherGradeModal";

const { Text, Title } = Typography;

interface TeacherExamAttemptsModalProps {
  open: boolean;
  onClose: () => void;
  exam: IExam | null;
}

const mapCheatType = (type: string) => {
  switch (type) {
    case "TAB_SWITCH":
      return "Rời khỏi màn hình bài thi";
    case "FULLSCREEN_EXIT":
      return "Thoát chế độ toàn màn hình";
    case "COPY_PASTE":
      return "Sao chép/Dán nội dung";
    case "MULTIPLE_FACES":
      return "Phát hiện nhiều khuôn mặt";
    default:
      return type;
  }
};

export const TeacherExamAttemptsModal: React.FC<TeacherExamAttemptsModalProps> = React.memo(
  ({ open, onClose, exam }) => {
    const [attempts, setAttempts] = useState<IExamAttempt[]>([]);
    const [loading, setLoading] = useState(false);

    // Toolbar states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    // Selected attempt for grading modal
    const [selectedAttemptId, setSelectedAttemptId] = useState<string | null>(null);
    const [gradeModalOpen, setGradeModalOpen] = useState(false);

    const fetchAttempts = useCallback(async () => {
      if (!exam?._id) return;
      setLoading(true);
      try {
        const { attempts: list } = await examApi.getAttemptsByExam(exam._id);
        setAttempts(list || []);
      } catch (err) {
        console.warn("[TeacherExamAttemptsModal] Fetch error:", err);
        setAttempts([]);
      } finally {
        setLoading(false);
      }
    }, [exam]);

    useEffect(() => {
      if (open && exam) {
        fetchAttempts();
      }
    }, [open, exam, fetchAttempts]);

    // Statistics calculation
    const stats = useMemo(() => {
      const total = attempts.length;
      const gradedCount = attempts.filter((a) => a.status === "GRADED").length;
      const pendingCount = attempts.filter(
        (a) => a.status === "PARTIALLY_GRADED" || a.status === "SUBMITTED"
      ).length;
      const cheatCount = attempts.filter((a) => (a.cheatWarnings || 0) > 0).length;

      const scores = attempts.map((a) => Number(a.totalScore || 0));
      const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
      const avgScore =
        scores.length > 0
          ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1))
          : 0;

      return { total, gradedCount, pendingCount, cheatCount, maxScore, avgScore };
    }, [attempts]);

    // Filter & Sort attempts
    const filteredAttempts = useMemo(() => {
      let result = [...attempts];

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        result = result.filter((a) => {
          const studentObj = typeof a.studentId === "object" ? a.studentId : null;
          const name = (studentObj?.fullName || "").toLowerCase();
          const email = (studentObj?.email || "").toLowerCase();
          const sId = (studentObj?._id || a.studentId || "").toString().toLowerCase();
          return name.includes(q) || email.includes(q) || sId.includes(q);
        });
      }

      // Filter by status
      if (statusFilter !== "all") {
        result = result.filter(
          (a) => (a.status || "").toUpperCase() === statusFilter.toUpperCase()
        );
      }

      // Sort
      result.sort((a, b) => {
        if (sortBy === "score-high")
          return (Number(b.totalScore) || 0) - (Number(a.totalScore) || 0);
        if (sortBy === "score-low")
          return (Number(a.totalScore) || 0) - (Number(b.totalScore) || 0);
        if (sortBy === "cheats")
          return (Number(b.cheatWarnings) || 0) - (Number(a.cheatWarnings) || 0);
        // Default: newest
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      return result;
    }, [attempts, searchQuery, statusFilter, sortBy]);

    const getStatusTag = (status?: string) => {
      switch (status) {
        case "GRADED":
          return <Tag color="success">🔵 Đã chốt điểm</Tag>;
        case "PARTIALLY_GRADED":
          return <Tag color="warning">🟡 Chờ chấm tự luận</Tag>;
        case "SUBMITTED":
          return <Tag color="processing">🟢 Đã nộp bài</Tag>;
        case "IN_PROGRESS":
          return <Tag color="default">⏳ Đang làm bài</Tag>;
        default:
          return <Tag color="blue">{status || "Hoàn thành"}</Tag>;
      }
    };

    const columns: ColumnsType<IExamAttempt> = [
      {
        title: "#",
        key: "index",
        width: 50,
        render: (_, __, index) => index + 1,
      },
      {
        title: "Học sinh",
        key: "student",
        render: (_, record) => {
          const studentObj = typeof record.studentId === "object" ? record.studentId : null;
          const sId = (studentObj?._id || record.studentId || "").toString();
          const code = sId ? sId.slice(-6).toUpperCase() : "N/A";

          return (
            <Space size={12}>
              <Avatar
                src={studentObj?.avatar || undefined}
                icon={!studentObj?.avatar ? <UserOutlined /> : undefined}
                style={{ backgroundColor: "var(--color-action-primary-bg)" }}
              />
              <div>
                <Text strong style={{ fontSize: 14, display: "block" }}>
                  {studentObj?.fullName || "Học sinh"}
                </Text>
                <Text style={{ fontSize: 12, fontFamily: "monospace", color: "var(--color-text-description)" }}>
                  STU-{code}
                </Text>
              </div>
            </Space>
          );
        },
      },
      {
        title: "Trạng thái",
        dataIndex: "status",
        key: "status",
        width: 160,
        render: (status) => getStatusTag(status),
      },
      {
        title: "Cảnh báo gian lận",
        dataIndex: "cheatWarnings",
        key: "cheatWarnings",
        width: 150,
        render: (warnings, record) => {
          const count = warnings || 0;
          if (count === 0) return <Tag color="green">✅ An toàn</Tag>;
          
          const cheatLogs = record.cheatLogs || [];
          const tooltipContent = cheatLogs.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {cheatLogs.map((log, idx) => (
                <Text key={idx} style={{ color: "#fff", fontSize: 12 }}>
                  - {mapCheatType(log.cheatType)} ({new Date(log.timestamp).toLocaleTimeString()})
                </Text>
              ))}
            </div>
          ) : (
            "Có vi phạm gian lận"
          );

          return (
            <Tooltip title={tooltipContent} color="var(--color-error-base)">
              <Tag color="error" icon={<AlertOutlined />}>
                🚨 {count} lần vi phạm
              </Tag>
            </Tooltip>
          );
        },
      },
      {
        title: "Điểm thi",
        dataIndex: "totalScore",
        key: "totalScore",
        width: 120,
        render: (score, record) => (
          <Text
            strong
            style={{ color: record.status === "GRADED" ? "var(--color-success-base)" : "var(--color-action-primary-bg)", fontSize: 16 }}
          >
            {score !== undefined && score !== null ? score : 0} / 10
          </Text>
        ),
      },
      {
        title: "Thao tác",
        key: "action",
        width: 140,
        align: "right",
        render: (_, record) => (
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedAttemptId(record._id);
              setGradeModalOpen(true);
            }}
            style={{ borderRadius: 6 }}
          >
            Xem & Chấm bài
          </Button>
        ),
      },
    ];

    return (
      <>
        <Modal
          open={open}
          onCancel={onClose}
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingRight: 24 }}>
              <Space align="center">
                <FileDoneOutlined style={{ color: "var(--color-action-primary-bg)", fontSize: 20 }} />
                <div>
                  <Title level={5} style={{ margin: 0, color: "var(--color-text-title)" }}>
                    Danh sách bài thi & Kết quả
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {exam?.title}
                  </Text>
                </div>
              </Space>
              <Button
                type="text"
                icon={<ReloadOutlined spin={loading} />}
                onClick={fetchAttempts}
                title="Làm mới"
              />
            </div>
          }
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <Button onClick={onClose} style={{ borderRadius: 8 }}>
                Đóng
              </Button>
            </div>
          }
          width={1100}
          centered
          destroyOnClose
          styles={{ body: { maxHeight: "75vh", overflowY: "auto", paddingRight: 8, paddingTop: 16 } }}
        >
          <div style={{ padding: "8px 0" }}>
            {/* 1. Quick Statistics Header */}
            <Card
              size="small"
              style={{ marginBottom: 16, backgroundColor: "var(--color-bg-page)", borderRadius: 12 }}
            >
              <Row gutter={[12, 12]}>
                <Col xs={12} sm={8} md={4}>
                  <Statistic
                    title={<Text style={{ fontSize: 11 }}>Tổng lượt thi</Text>}
                    value={stats.total}
                    styles={{ content: { fontSize: 18, fontWeight: 700 } }}
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Statistic
                    title={<Text style={{ fontSize: 11 }}>🔵 Đã chốt điểm</Text>}
                    value={stats.gradedCount}
                    styles={{ content: { fontSize: 18, fontWeight: 700, color: "var(--color-action-primary-bg)" } }}
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Statistic
                    title={<Text style={{ fontSize: 11 }}>🟡 Chờ chấm tự luận</Text>}
                    value={stats.pendingCount}
                    styles={{ content: { fontSize: 18, fontWeight: 700, color: "var(--color-warning-base)" } }}
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Statistic
                    title={<Text style={{ fontSize: 11 }}>🚨 Cảnh báo gian lận</Text>}
                    value={stats.cheatCount}
                    styles={{ content: { fontSize: 18, fontWeight: 700, color: "var(--color-error-base)" } }}
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Statistic
                    title={<Text style={{ fontSize: 11 }}>⭐ Điểm trung bình</Text>}
                    value={stats.avgScore}
                    suffix="/10"
                    styles={{ content: { fontSize: 18, fontWeight: 700, color: "var(--color-success-base)" } }}
                  />
                </Col>
                <Col xs={12} sm={8} md={4}>
                  <Statistic
                    title={<Text style={{ fontSize: 11 }}>🏆 Điểm cao nhất</Text>}
                    value={stats.maxScore}
                    suffix="/10"
                    styles={{ content: { fontSize: 18, fontWeight: 700, color: "var(--color-secondary-icon)" } }}
                  />
                </Col>
              </Row>
            </Card>

            {/* 2. Toolbar */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                marginBottom: 16,
              }}
            >
              <Space size={12} wrap>
                <Input
                  placeholder="Tìm sinh viên theo tên/email/mã..."
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
                    { value: "GRADED", label: "🔵 Đã chốt điểm" },
                    { value: "PARTIALLY_GRADED", label: "🟡 Chờ chấm tự luận" },
                    { value: "SUBMITTED", label: "🟢 Đã nộp bài" },
                  ]}
                />

                <Select
                  value={sortBy}
                  onChange={(val) => setSortBy(val)}
                  style={{ width: 160 }}
                  options={[
                    { value: "newest", label: "Mới nộp nhất" },
                    { value: "score-high", label: "Điểm cao -> thấp" },
                    { value: "score-low", label: "Điểm thấp -> cao" },
                    { value: "cheats", label: "Nhiều vi phạm gian lận nhất" },
                  ]}
                />
              </Space>
            </div>

            {/* 3. Attempts Table */}
            {loading ? (
              <div style={{ textAlign: "center", padding: 40 }}>
                <Spin tip="Đang nạp danh sách bài thi của học sinh..." />
              </div>
            ) : filteredAttempts.length > 0 ? (
              <Table
                columns={columns}
                dataSource={filteredAttempts}
                rowKey={(record, index) => record._id || `att-${index}`}
                pagination={{ pageSize: 10 }}
              />
            ) : (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  searchQuery || statusFilter !== "all"
                    ? "Không tìm thấy lượt làm bài phù hợp bộ lọc."
                    : "Chưa có học sinh nào nộp bài thi này."
                }
              />
            )}
          </div>
        </Modal>

        {/* Modal Chấm tự luận */}
        <TeacherGradeModal
          open={gradeModalOpen}
          onClose={() => setGradeModalOpen(false)}
          attemptId={selectedAttemptId}
          onGraded={fetchAttempts}
        />
      </>
    );
  }
);

TeacherExamAttemptsModal.displayName = "TeacherExamAttemptsModal";

export default TeacherExamAttemptsModal;
