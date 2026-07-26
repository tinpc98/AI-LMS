import React, { useState, useEffect, useCallback } from "react";
import { Drawer, Table, Avatar, Tag, Button, Typography, Space, Spin, Empty, Tooltip, Alert } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  FileDoneOutlined,
  UserOutlined,
  EditOutlined,
  AlertOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import examApi from "../../../api/examApi";
import type { IExam, IExamAttempt } from "../../../api/examApi";
import { TeacherGradeEssayModal } from "./TeacherGradeEssayModal";

const { Text, Title, Paragraph } = Typography;

interface TeacherExamAttemptsDrawerProps {
  open: boolean;
  onClose: () => void;
  exam: IExam | null;
}

export const TeacherExamAttemptsDrawer: React.FC<TeacherExamAttemptsDrawerProps> = React.memo(
  ({ open, onClose, exam }) => {
    const [attempts, setAttempts] = useState<IExamAttempt[]>([]);
    const [loading, setLoading] = useState(false);

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
        console.warn("[TeacherExamAttemptsDrawer] Fetch error:", err);
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
        width: 160,
        render: (status) => getStatusTag(status),
      },
      {
        title: "Cảnh báo gian lận",
        dataIndex: "cheatWarnings",
        key: "cheatWarnings",
        width: 150,
        render: (warnings) => {
          const count = warnings || 0;
          if (count === 0) return <Tag color="green">✅ An toàn</Tag>;
          return (
            <Tag color="error" icon={<AlertOutlined />}>
              🚨 {count} lần vi phạm
            </Tag>
          );
        },
      },
      {
        title: "Điểm thi",
        dataIndex: "totalScore",
        key: "totalScore",
        width: 120,
        render: (score, record) => (
          <Text strong style={{ color: record.status === "GRADED" ? "#52c41a" : "#1890ff", fontSize: 16 }}>
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
        <Drawer
          title={
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Space>
                <FileDoneOutlined style={{ color: "#1890ff" }} />
                <span>Danh sách lượt làm bài: {exam?.title}</span>
              </Space>
              <Button type="text" icon={<ReloadOutlined spin={loading} />} onClick={fetchAttempts} title="Làm mới" />
            </div>
          }
          placement="right"
          width={840}
          onClose={onClose}
          open={open}
          styles={{ body: { padding: 16 } }}
        >
          {loading ? (
            <div style={{ textAlign: "center", padding: 40 }}>
              <Spin tip="Đang nạp danh sách bài thi của học sinh..." />
            </div>
          ) : attempts.length > 0 ? (
            <Table
              columns={columns}
              dataSource={attempts}
              rowKey={(record, index) => record._id || `att-${index}`}
              pagination={{ pageSize: 10 }}
            />
          ) : (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Chưa có học sinh nào nộp bài thi này." />
          )}
        </Drawer>

        {/* Modal Chấm tự luận */}
        <TeacherGradeEssayModal
          open={gradeModalOpen}
          onClose={() => setGradeModalOpen(false)}
          attemptId={selectedAttemptId}
          onGraded={fetchAttempts}
        />
      </>
    );
  }
);

TeacherExamAttemptsDrawer.displayName = "TeacherExamAttemptsDrawer";
