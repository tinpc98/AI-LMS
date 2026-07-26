import React from "react";
import { Card, Typography, Space, Button, Tag, Popconfirm } from "antd";
import { PaperClipOutlined, DownloadOutlined, DeleteOutlined, CheckCircleOutlined } from "@ant-design/icons";
import type { ISubmission } from "../../../interface/assignmentInterface";

const { Text } = Typography;

interface AssignmentSubmissionCardProps {
  submission: ISubmission;
  canCancel?: boolean;
  onCancelSubmission?: (assignmentId: string) => void;
}

export const AssignmentSubmissionCard: React.FC<AssignmentSubmissionCardProps> = React.memo(
  ({ submission, canCancel = true, onCancelSubmission }) => {
    const formattedDate = submission.createdAt
      ? new Date(submission.createdAt).toLocaleString("vi-VN")
      : "Vừa nộp";

    return (
      <Card
        title={
          <Space align="center">
            <CheckCircleOutlined style={{ color: "#52c41a", fontSize: 18 }} />
            <span style={{ fontSize: 14, fontWeight: 700 }}>Thông tin bài làm đã nộp</span>
          </Space>
        }
        size="small"
        style={{ borderRadius: 12, backgroundColor: "#f6ffed", border: "1px solid #b7eb8f", marginBottom: 16 }}
      >
        <div style={{ marginBottom: 12 }}>
          <Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            Thời gian nộp bài: <strong>{formattedDate}</strong>
          </Text>
          {submission.status === "late" && (
            <Tag color="error" style={{ borderRadius: 6, marginTop: 4 }}>
              Nộp trễ hạn
            </Tag>
          )}
        </div>

        {/* Submission Attachments */}
        {submission.attachments && submission.attachments.length > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {submission.attachments.map((att, idx) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justify: "space-between",
                  alignItems: "center",
                  backgroundColor: "#fff",
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #d9d9d9",
                }}
              >
                <Space size={6} ellipsis>
                  <PaperClipOutlined style={{ color: "#1890ff" }} />
                  <Text style={{ fontSize: 13 }} ellipsis style={{ maxWidth: 200 }}>
                    {att.name || `Tài liệu đính kèm ${idx + 1}`}
                  </Text>
                </Space>
                {att.url && (
                  <Button
                    type="link"
                    size="small"
                    icon={<DownloadOutlined />}
                    href={att.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Tải về
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Không có file đính kèm bài nộp.
          </Text>
        )}

        {/* Cancel Submission Button */}
        {canCancel && onCancelSubmission && submission.status !== "graded" && (
          <div style={{ marginTop: 12, textAlign: "right" }}>
            <Popconfirm
              title="Hủy nộp bài tập"
              description="Bạn có chắc chắn muốn hủy bài làm đã nộp này không?"
              okText="Đồng ý hủy"
              cancelText="Quay lại"
              onConfirm={() => onCancelSubmission(submission.assignmentId)}
            >
              <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                Hủy bài nộp
              </Button>
            </Popconfirm>
          </div>
        )}
      </Card>
    );
  }
);

AssignmentSubmissionCard.displayName = "AssignmentSubmissionCard";

export default AssignmentSubmissionCard;
