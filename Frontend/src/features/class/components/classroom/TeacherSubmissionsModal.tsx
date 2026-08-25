import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Modal, Table, Avatar, Tag, Typography, Space, Spin } from "antd";
import type { ColumnsType } from "antd/es/table";
import { UserOutlined } from "@ant-design/icons";
import assignmentApi from "../../../../api/assignmentApi";
import type { IAssignment, IAssignmentAttempt } from "../../../../interface/assignmentInterface";
import { AttemptDetailView } from "../../../assignment/components/AttemptDetailView";

const { Text } = Typography;

interface TeacherSubmissionsModalProps {
  open: boolean;
  onClose: () => void;
  assignment: IAssignment | null;
}

export const TeacherSubmissionsModal: React.FC<TeacherSubmissionsModalProps> = React.memo(({ open, onClose, assignment }) => {
  const [attempts, setAttempts] = useState<IAssignmentAttempt[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedAttempt, setSelectedAttempt] = useState<IAssignmentAttempt | null>(null);

  const fetchAttempts = useCallback(async () => {
    if (!assignment?._id) return;
    setLoading(true);
    try {
      const list = await assignmentApi.getAttemptsForTeacher(assignment._id);
      setAttempts(list || []);
    } catch (err) {
      console.warn("[TeacherSubmissionsDrawer] Fetch error:", err);
      setAttempts([]);
    } finally {
      setLoading(false);
    }
  }, [assignment]);

  useEffect(() => {
    if (open && assignment) {
      fetchAttempts();
    }
  }, [open, assignment, fetchAttempts]);

  const columns: ColumnsType<IAssignmentAttempt> = [
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
            <Avatar icon={<UserOutlined />} style={{ backgroundColor: "var(--color-action-primary-bg)" }} />
            <div>
              <Text strong style={{ fontSize: 14, display: "block" }}>{studentObj?.fullName || "Học sinh"}</Text>
              <Text style={{ fontSize: 12, fontFamily: "monospace", color: "var(--color-text-description)" }}>STU-{code}</Text>
            </div>
          </Space>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status) => {
        switch (status) {
          case "IN_PROGRESS": return <Tag color="processing">Đang làm</Tag>;
          case "SUBMITTED": return <Tag color="warning">Chờ chấm</Tag>;
          case "GRADED": return <Tag color="success">Đã chấm</Tag>;
          default: return <Tag color="default">{status}</Tag>;
        }
      },
    },
    {
      title: "Lần nộp",
      dataIndex: "attemptNumber",
      key: "attemptNumber",
      render: (attemptNumber) => <Tag color="blue">Lần {attemptNumber}</Tag>,
    },
    {
      title: "Điểm",
      dataIndex: "score",
      key: "score",
      render: (score) => <Text strong>{score !== null && score !== undefined ? score : "-"}</Text>,
    },
    {
      title: "Thời gian nộp",
      dataIndex: "submittedAt",
      key: "submittedAt",
      render: (submittedAt) => <Text>{submittedAt ? new Date(submittedAt).toLocaleString("vi-VN") : "-"}</Text>,
    },
    {
      title: "Thao tác",
      key: "action",
      render: (_, record) => (
        <a onClick={() => setSelectedAttempt(record)}>Xem chi tiết</a>
      ),
    },
  ];

  return (
    <>
      <Modal
        title={`Danh sách bài nộp: ${assignment?.title}`}
        open={open}
        onCancel={onClose}
        footer={null}
        width={1000}
      >
        <Table
          loading={loading}
          columns={columns}
          dataSource={attempts}
          rowKey="_id"
          pagination={{ pageSize: 10 }}
        />
      </Modal>

      {/* Attempt Details / Grading */}
      <Modal
        title="Chi tiết bài nộp"
        open={!!selectedAttempt}
        onCancel={() => {
          setSelectedAttempt(null);
          fetchAttempts();
        }}
        footer={null}
        width={900}
        destroyOnClose
      >
        {selectedAttempt && (
          <AttemptDetailView 
            attempt={selectedAttempt} 
            isTeacher={true} 
            onGradeSuccess={(updatedAttempt) => setSelectedAttempt(updatedAttempt)}
          />
        )}
      </Modal>
    </>
  );
});
