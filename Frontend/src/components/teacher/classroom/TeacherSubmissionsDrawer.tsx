import React, { useState, useEffect, useCallback } from "react";
import { Drawer, Table, Avatar, Tag, Button, Typography, Space, Spin, Empty, Tooltip } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FileDoneOutlined,
  UserOutlined,
  EditOutlined,
  PaperClipOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
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
                src={studentObj?.avatar || undefined}
                icon={!studentObj?.avatar ? <UserOutlined /> : undefined}
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
        width: 180,
        render: (_, record) => (
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
          </div>
        ),
      },
      {
        title: "Thao tác",
        key: "action",
        width: 120,
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
          width={820}
          onClose={onClose}
          open={open}
          styles={{ body: { padding: 16 } }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spin tip="Đang nạp danh sách bài nộp của học sinh..." />
            </div>
          ) : submissions.length > 0 ? (
            <Table
              columns={columns}
              dataSource={submissions}
              rowKey={(record, index) => record._id || `sub-${index}`}
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có học sinh nào nộp bài tập này." />
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
