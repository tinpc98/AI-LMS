import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Drawer, Table, Avatar, Tag, Button, Typography, Space, Spin, Empty, Card, Row, Col, Statistic, Progress, Input, Select } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FileDoneOutlined,
  UserOutlined,
  EditOutlined,
  PaperClipOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  FilterOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import assignmentApi from "../../../api/assignmentApi";
import type { IAssignment, ISubmission } from "../../../interface/assignmentInterface";
import { GradeSubmissionModal } from "./GradeSubmissionModal";

const { Text, Title, Paragraph } = Typography;

interface TeacherSubmissionsDrawerProps {
  open: boolean;
  onClose: () => void;
  assignment: IAssignment | null;
}

export const TeacherSubmissionsDrawer: React.FC<TeacherSubmissionsDrawerProps> = React.memo(
  ({ open, onClose, assignment }) => {
    const [submissions, setSubmissions] = useState<ISubmission[]>([]);
    const [loading, setLoading] = useState(false);

    // Toolbar states
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [sortBy, setSortBy] = useState("newest");

    // Selected submission for grading modal
    const [selectedSubmission, setSelectedSubmission] = useState<ISubmission | null>(null);
    const [gradeModalOpen, setGradeModalOpen] = useState(false);

    const fetchSubmissions = useCallback(async () => {
      if (!assignment?._id) return;
      setLoading(true);
      try {
        const list = await assignmentApi.getSubmissionsByAssignment(assignment._id);
        setSubmissions(list || []);
      } catch (err) {
        console.warn("[TeacherSubmissionsDrawer] Fetch error:", err);
        setSubmissions([]);
      } finally {
        setLoading(false);
      }
    }, [assignment]);

    useEffect(() => {
      if (open && assignment) {
        fetchSubmissions();
      }
    }, [open, assignment, fetchSubmissions]);

    // Statistics calculation
    const stats = useMemo(() => {
      const total = submissions.length;
      const gradedList = submissions.filter((s) => s.grade !== null && s.grade !== undefined);
      const gradedCount = gradedList.length;
      const ungradedCount = total - gradedCount;
      const lateCount = submissions.filter((s) => s.status === "late").length;
      const submittedCount = submissions.filter((s) => s.status === "submitted").length;

      const scores = gradedList.map((s) => Number(s.grade));
      const maxScore = scores.length > 0 ? Math.max(...scores) : 0;
      const minScore = scores.length > 0 ? Math.min(...scores) : 0;
      const avgScore = scores.length > 0 ? parseFloat((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)) : 0;

      return { total, gradedCount, ungradedCount, lateCount, submittedCount, maxScore, minScore, avgScore };
    }, [submissions]);

    // Filter & Sort submissions
    const filteredSubmissions = useMemo(() => {
      let result = [...submissions];

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        result = result.filter((s) => {
          const studentObj = typeof s.studentId === "object" ? s.studentId : null;
          const name = (studentObj?.fullName || "").toLowerCase();
          const email = (studentObj?.email || "").toLowerCase();
          const sId = (studentObj?._id || s.studentId || "").toString().toLowerCase();
          return name.includes(q) || email.includes(q) || sId.includes(q);
        });
      }

      // Filter by status
      if (statusFilter === "graded") {
        result = result.filter((s) => s.grade !== null && s.grade !== undefined);
      } else if (statusFilter === "ungraded") {
        result = result.filter((s) => s.grade === null || s.grade === undefined);
      } else if (statusFilter === "late") {
        result = result.filter((s) => s.status === "late");
      }

      // Sort
      result.sort((a, b) => {
        if (sortBy === "grade-high") return (Number(b.grade) || 0) - (Number(a.grade) || 0);
        if (sortBy === "grade-low") return (Number(a.grade) || 0) - (Number(b.grade) || 0);
        if (sortBy === "name-asc") {
          const nameA = typeof a.studentId === "object" ? a.studentId?.fullName || "" : "";
          const nameB = typeof b.studentId === "object" ? b.studentId?.fullName || "" : "";
          return nameA.localeCompare(nameB);
        }
        // Default: newest
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      });

      return result;
    }, [submissions, searchQuery, statusFilter, sortBy]);

    const getStatusTag = (status?: string) => {
      switch (status) {
        case "graded":
          return <Tag color="success">🔵 Đã chấm điểm</Tag>;
        case "late":
          return <Tag color="warning">🟡 Nộp trễ hạn</Tag>;
        case "submitted":
          return <Tag color="processing">🟢 Đúng hạn</Tag>;
        default:
          return <Tag color="blue">{status || "Đã nộp"}</Tag>;
      }
    };

    const columns: ColumnsType<ISubmission> = [
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
                src={(studentObj as any)?.avatar || undefined}
                icon={!(studentObj as any)?.avatar ? <UserOutlined /> : undefined}
                style={{ backgroundColor: "#1890ff" }}
              />
              <div>
                <Text strong style={{ fontSize: 14, display: "block" }}>
                  {studentObj?.fullName || "Học sinh"}
                </Text>
                <Text style={{ fontSize: 12, fontFamily: "monospace", color: "#8c8c8c" }}>
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
        width: 140,
        render: (status) => getStatusTag(status),
      },
      {
        title: "Bài làm & Đính kèm",
        key: "content",
        render: (_, record) => (
          <div>
            {record.content && (
              <Paragraph ellipsis={{ rows: 2 }} style={{ fontSize: 13, marginBottom: 4 }}>
                {record.content}
              </Paragraph>
            )}
            {record.attachments && record.attachments.length > 0 && (
              <Space size={6} wrap style={{ marginTop: 2 }}>
                {record.attachments.map((att: any, i: number) => (
                  <a key={att.publicId || i} href={att.url} target="_blank" rel="noreferrer" style={{ fontSize: 12 }}>
                    <PaperClipOutlined /> {att.name || "File đính kèm"}
                  </a>
                ))}
              </Space>
            )}
          </div>
        ),
      },
      {
        title: "Điểm & Lời phê",
        key: "gradeInfo",
        width: 200,
        render: (_, record) => {
          const graderObj = typeof (record as any).gradedBy === "object" ? (record as any).gradedBy : null;
          const graderName = graderObj?.fullName;

          return (
            <div>
              {record.grade !== null && record.grade !== undefined ? (
                <Text strong style={{ color: "#52c41a", fontSize: 16 }}>
                  {record.grade} / 100
                </Text>
              ) : (
                <Text type="secondary" style={{ fontStyle: "italic", fontSize: 12 }}>
                  Chưa chấm điểm
                </Text>
              )}
              {record.feedback && (
                <Paragraph type="secondary" ellipsis={{ rows: 2 }} style={{ fontSize: 12, marginTop: 4, margin: 0 }}>
                  💬 {record.feedback}
                </Paragraph>
              )}
              {graderName && (
                <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 2 }}>
                  Chấm bởi: {graderName}
                </Text>
              )}
            </div>
          );
        },
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
              setSelectedSubmission(record);
              setGradeModalOpen(true);
            }}
            style={{ borderRadius: 6 }}
          >
            Chấm điểm
          </Button>
        ),
      },
    ];

    return (
      <>
        <Drawer
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Space>
                <FileDoneOutlined style={{ color: "#1890ff" }} />
                <span>Danh sách bài nộp: {assignment?.title}</span>
              </Space>
              <Button type="text" icon={<ReloadOutlined spin={loading} />} onClick={fetchSubmissions} title="Làm mới" />
            </div>
          }
          placement="right"
          width={900}
          onClose={onClose}
          open={open}
          styles={{ body: { padding: 20 } }}
        >
          {/* 1. Quick Statistics Cards Header */}
          <Card size="small" style={{ marginBottom: 16, backgroundColor: "#f8f9fa", borderRadius: 12 }}>
            <Row gutter={[12, 12]}>
              <Col xs={12} sm={6} md={3}>
                <Statistic title={<Text style={{ fontSize: 11 }}>Tổng bài nộp</Text>} value={stats.total} styles={{ content: { fontSize: 18, fontWeight: 700 } }} />
              </Col>
              <Col xs={12} sm={6} md={3}>
                <Statistic title={<Text style={{ fontSize: 11 }}>🔵 Đã chấm</Text>} value={stats.gradedCount} styles={{ content: { fontSize: 18, fontWeight: 700, color: "#1890ff" } }} />
              </Col>
              <Col xs={12} sm={6} md={3}>
                <Statistic title={<Text style={{ fontSize: 11 }}>🟡 Chưa chấm</Text>} value={stats.ungradedCount} styles={{ content: { fontSize: 18, fontWeight: 700, color: "#faad14" } }} />
              </Col>
              <Col xs={12} sm={6} md={3}>
                <Statistic title={<Text style={{ fontSize: 11 }}>🔴 Nộp trễ</Text>} value={stats.lateCount} styles={{ content: { fontSize: 18, fontWeight: 700, color: "#ff4d4f" } }} />
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Statistic title={<Text style={{ fontSize: 11 }}>⭐ Điểm trung bình</Text>} value={stats.avgScore} suffix="/100" styles={{ content: { fontSize: 18, fontWeight: 700, color: "#52c41a" } }} />
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Statistic title={<Text style={{ fontSize: 11 }}>🏆 Điểm cao nhất</Text>} value={stats.maxScore} suffix="/100" styles={{ content: { fontSize: 18, fontWeight: 700, color: "#722ed1" } }} />
              </Col>
              <Col xs={12} sm={6} md={4}>
                <Statistic title={<Text style={{ fontSize: 11 }}>📉 Điểm thấp nhất</Text>} value={stats.minScore} suffix="/100" styles={{ content: { fontSize: 18, fontWeight: 700, color: "#fa8c16" } }} />
              </Col>
            </Row>
          </Card>

          {/* 2. Toolbar: Search, Filter, Sort */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
            <Space size={12} wrap>
              <Input
                placeholder="Tìm sinh viên theo tên/email/mã..."
                prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: 240, borderRadius: 8 }}
                allowClear
              />

              <Select
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                style={{ width: 150 }}
                suffixIcon={<FilterOutlined />}
                options={[
                  { value: "all", label: "Tất cả bài nộp" },
                  { value: "graded", label: "🔵 Đã chấm điểm" },
                  { value: "ungraded", label: "🟡 Chưa chấm điểm" },
                  { value: "late", label: "🔴 Nộp trễ hạn" },
                ]}
              />

              <Select
                value={sortBy}
                onChange={(val) => setSortBy(val)}
                style={{ width: 150 }}
                options={[
                  { value: "newest", label: "Mới nộp nhất" },
                  { value: "grade-high", label: "Điểm cao -> thấp" },
                  { value: "grade-low", label: "Điểm thấp -> cao" },
                  { value: "name-asc", label: "Tên A -> Z" },
                ]}
              />
            </Space>
          </div>

          {/* 3. Submissions Table */}
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spin tip="Đang nạp danh sách bài nộp của học sinh..." />
            </div>
          ) : filteredSubmissions.length > 0 ? (
            <Table
              columns={columns}
              dataSource={filteredSubmissions}
              rowKey={(record, index) => record._id || `sub-${index}`}
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={searchQuery || statusFilter !== "all" ? "Không tìm thấy bài nộp nào phù hợp với bộ lọc." : "Chưa có học sinh nào nộp bài tập này."}
            />
          )}
        </Drawer>

        {/* Modal Chấm điểm */}
        <GradeSubmissionModal
          open={gradeModalOpen}
          onClose={() => setGradeModalOpen(false)}
          submission={selectedSubmission}
          onGraded={fetchSubmissions}
        />
      </>
    );
  }
);

TeacherSubmissionsDrawer.displayName = "TeacherSubmissionsDrawer";
