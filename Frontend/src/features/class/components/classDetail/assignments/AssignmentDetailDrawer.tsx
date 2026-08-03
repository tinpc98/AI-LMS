import React from "react";
import { Drawer, Button, Typography, Space, Descriptions, Divider } from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  DownloadOutlined,
  PaperClipOutlined,
  UserOutlined,
} from "@ant-design/icons";
import AssignmentStatusTag from "./AssignmentStatusTag";
import AssignmentSubmissionCard from "./AssignmentSubmissionCard";
import AssignmentFeedbackCard from "./AssignmentFeedbackCard";
import type { IExtendedAssignment } from "../../../../../types/studentAssignment";

const { Text, Paragraph, Title } = Typography;

interface AssignmentDetailDrawerProps {
  open: boolean;
  item: IExtendedAssignment | null;
  onClose: () => void;
  onSubmit: (item: IExtendedAssignment) => void;
  onCancelSubmission: (assignmentId: string) => void;
}

export const AssignmentDetailDrawer: React.FC<AssignmentDetailDrawerProps> = React.memo(
  ({ open, item, onClose, onSubmit, onCancelSubmission }) => {
    if (!item) return null;

    const formattedDeadline = item.deadline
      ? new Date(item.deadline).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Không giới hạn";

    const formattedCreated = item.createdAt
      ? new Date(item.createdAt).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "Gần đây";

    const teacherName =
      typeof item.teacherId === "object" && (item.teacherId as any)?.fullName
        ? (item.teacherId as any).fullName
        : "Giảng viên";

    const hasSubmitted =
      item.status === "Submitted" || item.status === "Late" || item.status === "Graded";
    const isGraded = item.status === "Graded";

    return (
      <Drawer
        open={open}
        onClose={onClose}
        title={
          <Space align="center">
            <FileTextOutlined style={{ color: "var(--color-action-primary-bg)", fontSize: 20 }} />
            <div>
              <Title level={5} style={{ margin: 0, color: "var(--color-text-title)" }}>
                {item.title}
              </Title>
              <Space size={6} style={{ marginTop: 2 }}>
                <AssignmentStatusTag status={item.status} />
              </Space>
            </div>
          </Space>
        }
        extra={
          <Space>
            <Button onClick={onClose} style={{ borderRadius: 8 }}>
              Đóng
            </Button>
            {!isGraded && (
              <Button
                type="primary"
                icon={<UploadOutlined />}
                onClick={() => {
                  onClose();
                  onSubmit(item);
                }}
                style={{ borderRadius: 8 }}
              >
                {hasSubmitted ? "Cập nhật bài nộp" : "Nộp bài ngay"}
              </Button>
            )}
          </Space>
        }
        width={680}
        destroyOnClose
      >
        <div style={{ padding: "8px 0" }}>
          {/* Assignment Meta Descriptions */}
          <Descriptions
            bordered
            column={1}
            size="small"
            styles={{ label: { width: "30%", fontWeight: 600, backgroundColor: "var(--color-bg-page)" } }}
            style={{ marginBottom: 20 }}
          >
            <Descriptions.Item label="Tiêu đề bài tập">
              <Text strong style={{ color: "var(--color-text-title)" }}>
                {item.title}
              </Text>
            </Descriptions.Item>

            <Descriptions.Item label="Trạng thái">
              <AssignmentStatusTag status={item.status} />
            </Descriptions.Item>

            <Descriptions.Item label="Hạn nộp bài (Deadline)">
              <Space size={6}>
                <ClockCircleOutlined style={{ color: item.isOverdue ? "var(--color-error-text)" : "var(--color-action-primary-bg)" }} />
                <Text strong style={{ color: item.isOverdue ? "var(--color-error-text)" : "var(--color-text-title)" }}>
                  {formattedDeadline}
                </Text>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Giáo viên ra đề">
              <Space size={6}>
                <UserOutlined style={{ color: "var(--color-action-primary-bg)" }} />
                <span>{teacherName}</span>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Ngày giao bài">{formattedCreated}</Descriptions.Item>
          </Descriptions>

          {/* Description & Requirements */}
          <div style={{ marginBottom: 20 }}>
            <Text
              strong
              style={{ fontSize: 14, color: "var(--color-text-title)", display: "block", marginBottom: 6 }}
            >
              Yêu cầu bài tập:
            </Text>
            <Paragraph
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                margin: 0,
                backgroundColor: "var(--color-bg-page)",
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid var(--color-border-default)",
              }}
            >
              {item.description || "Không có yêu cầu chi tiết thêm cho bài tập này."}
            </Paragraph>
          </div>

          {/* Attached Files from Teacher */}
          {item.attachments && item.attachments.length > 0 && (
            <div style={{ marginBottom: 24 }}>
              <Text
                strong
                style={{ fontSize: 14, color: "var(--color-text-title)", display: "block", marginBottom: 8 }}
              >
                <PaperClipOutlined style={{ marginRight: 6 }} /> Tài liệu / Đề bài đính kèm (
                {item.attachments.length}):
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {item.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      backgroundColor: "var(--color-surface)",
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "1px solid var(--color-border-default)",
                    }}
                  >
                    <Space size={8}>
                      <PaperClipOutlined style={{ color: "var(--color-action-primary-bg)" }} />
                      <Text ellipsis style={{ fontSize: 13, maxWidth: 350 }}>
                        {att.name || `File đính kèm ${idx + 1}`}
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
            </div>
          )}

          <Divider style={{ margin: "20px 0" }} />

          {/* Submission Info Card if student submitted */}
          {item.submission && (
            <AssignmentSubmissionCard
              submission={item.submission}
              canCancel={!isGraded}
              onCancelSubmission={onCancelSubmission}
            />
          )}

          {/* Teacher Feedback Card if graded */}
          {item.submission && isGraded && <AssignmentFeedbackCard submission={item.submission} />}
        </div>
      </Drawer>
    );
  }
);

AssignmentDetailDrawer.displayName = "AssignmentDetailDrawer";

export default AssignmentDetailDrawer;
