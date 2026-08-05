import React, { useState } from "react";
import { Modal, Button, Typography, Space, Descriptions, Divider } from "antd";
import {
  FileTextOutlined,
  ClockCircleOutlined,
  UploadOutlined,
  DownloadOutlined,
  PaperClipOutlined,
  UserOutlined,
  EyeOutlined,
  TrophyOutlined,
  CheckCircleOutlined,
  CommentOutlined
} from "@ant-design/icons";
import AssignmentStatusTag from "./AssignmentStatusTag";
import type { IExtendedAssignment } from "../../../../../types/studentAssignment";
import {
  AttachmentViewerModal,
  isViewableFile,
  type AttachmentFile,
} from "../../../../../shared/components/AttachmentViewerModal";
import { SubmissionDetailView } from "../../../../assignment/components/SubmissionDetailView";

const { Text, Paragraph, Title } = Typography;

interface AssignmentDetailModalProps {
  open: boolean;
  item: IExtendedAssignment | null;
  onClose: () => void;
  onSubmit: (item: IExtendedAssignment) => void;
}

export const AssignmentDetailModal: React.FC<AssignmentDetailModalProps> = React.memo(
  ({ open, item, onClose, onSubmit }) => {
    const [viewerFile, setViewerFile] = useState<AttachmentFile | null>(null);

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
        : typeof item.teacherId === "object" && (item.teacherId as any)?.username
        ? (item.teacherId as any).username
        : "Giảng viên";

    const graderName = 
      typeof item.submission?.gradedBy === "object" && (item.submission.gradedBy as any)?.fullName
        ? (item.submission.gradedBy as any).fullName
        : teacherName;

    const gradedAtFormatted = item.submission?.gradedAt
      ? new Date(item.submission.gradedAt).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : (item.submission?.updatedAt ? new Date(item.submission.updatedAt).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }) : "Gần đây");

    const isDraft = item.submission?.status === "draft";
    const hasSubmitted = item.status === "Submitted" || item.status === "Late" || item.status === "Graded";
    const isGraded = item.status === "Graded" && item.submission?.grade !== null && item.submission?.grade !== undefined;
    const maxScore = item.maxScore || 10;

    let footerButtons = [];
    footerButtons.push(
      <Button key="close" onClick={onClose} style={{ borderRadius: 8 }}>
        Đóng
      </Button>
    );

    if (!isGraded && !item.isOverdue) {
      if (hasSubmitted) {
        footerButtons.push(
          <Button
            key="submit"
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => {
              onClose();
              onSubmit(item);
            }}
            style={{ borderRadius: 8 }}
          >
            Cập nhật bài nộp
          </Button>
        );
      } else if (isDraft) {
        footerButtons.push(
          <Button
            key="submit"
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => {
              onClose();
              onSubmit(item);
            }}
            style={{ borderRadius: 8 }}
          >
            Tiếp tục làm bài
          </Button>
        );
      } else {
        footerButtons.push(
          <Button
            key="submit"
            type="primary"
            icon={<UploadOutlined />}
            onClick={() => {
              onClose();
              onSubmit(item);
            }}
            style={{ borderRadius: 8 }}
          >
            Nộp bài
          </Button>
        );
      }
    }

    return (
      <>
        <Modal
          open={open}
          onCancel={onClose}
          title={
            <Space align="center">
              <FileTextOutlined style={{ color: "var(--color-action-primary-bg)", fontSize: 20 }} />
              <div>
                <Title level={5} style={{ margin: 0, color: "var(--color-text-title)" }}>
                  {item.title}
                </Title>
              </div>
            </Space>
          }
          width={850}
          centered
          destroyOnClose
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16 }}>
              {item.isOverdue && !isGraded && !hasSubmitted && (
                <Text type="danger" style={{ alignSelf: "center", marginRight: "auto" }}>
                  Đã quá hạn nộp bài
                </Text>
              )}
              {footerButtons}
            </div>
          }
          styles={{ body: { maxHeight: "75vh", overflowY: "auto", paddingRight: 8, paddingTop: 16 } }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* 1. Thông tin bài tập */}
            <Descriptions
              bordered
              column={1}
              size="small"
              styles={{ label: { width: "30%", fontWeight: 600, backgroundColor: "var(--color-bg-page)" } }}
            >
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

            {/* 2. Yêu cầu bài tập & Tài liệu đính kèm */}
            <div>
              <Text strong style={{ fontSize: 14, color: "var(--color-text-title)", display: "block", marginBottom: 8 }}>
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

              {item.attachments && item.attachments.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <Text strong style={{ fontSize: 14, color: "var(--color-text-title)", display: "block", marginBottom: 8 }}>
                    <PaperClipOutlined style={{ marginRight: 6 }} /> Tài liệu / Đề bài đính kèm ({item.attachments.length}):
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
                        <Space size={8} style={{ minWidth: 0, flex: 1, marginRight: 8 }}>
                          <PaperClipOutlined style={{ color: "var(--color-action-primary-bg)" }} />
                          <span
                            style={{
                              fontSize: 13,
                              color: isViewableFile(att.name || att.url, att.format) ? "#1677ff" : "var(--color-text-title)",
                              cursor: isViewableFile(att.name || att.url, att.format) ? "pointer" : "default",
                              fontWeight: isViewableFile(att.name || att.url, att.format) ? 500 : 400,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                            onClick={() => {
                              if (isViewableFile(att.name || att.url, att.format)) {
                                setViewerFile(att);
                              }
                            }}
                            title={att.name}
                          >
                            {att.name || `File đính kèm ${idx + 1}`}
                          </span>
                        </Space>
                        <Space size={4}>
                          {isViewableFile(att.name || att.url, att.format) && (
                            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => setViewerFile(att)} style={{ color: "#1677ff" }}>
                              Xem
                            </Button>
                          )}
                          {att.url && (
                            <Button type="link" size="small" icon={<DownloadOutlined />} href={att.url} target="_blank" rel="noopener noreferrer">
                              Tải về
                            </Button>
                          )}
                        </Space>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Bài làm của tôi */}
            {(hasSubmitted || isDraft) && item.submission && (
              <div>
                <Divider style={{ margin: "8px 0" }}>Bài làm của bạn</Divider>
                <SubmissionDetailView submission={item.submission as any} />
              </div>
            )}

            {/* 4. Kết quả chấm */}
            {isGraded && item.submission && (
              <div
                style={{
                  borderRadius: 12,
                  backgroundColor: "var(--color-secondary-bg)",
                  border: "1px solid var(--color-secondary-border)",
                  padding: 16,
                  marginTop: 8
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: item.submission.feedback ? 16 : 0 }}>
                  <Space align="center">
                    <TrophyOutlined style={{ color: "var(--color-secondary-icon)", fontSize: 20 }} />
                    <span style={{ fontSize: 16, fontWeight: 700 }}>Kết quả đánh giá</span>
                  </Space>
                  <div style={{ textAlign: "right" }}>
                    <Title level={3} style={{ margin: 0, color: "var(--color-secondary-icon)", fontWeight: 700 }}>
                      {item.submission.grade}{" "}
                      <span style={{ fontSize: 14, color: "var(--color-text-description)", fontWeight: 400 }}>/ {maxScore}</span>
                    </Title>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Chấm bởi {graderName} lúc {gradedAtFormatted}
                    </Text>
                  </div>
                </div>

                {item.submission.feedback && (
                  <div>
                    <Text strong style={{ fontSize: 13, color: "var(--color-text-title)", display: "block", marginBottom: 8 }}>
                      <CommentOutlined style={{ marginRight: 6, color: "var(--color-action-primary-bg)" }} /> Nhận xét của giảng viên:
                    </Text>
                    <Paragraph
                      type="secondary"
                      style={{
                        fontSize: 14,
                        margin: 0,
                        backgroundColor: "var(--color-surface)",
                        padding: "12px 16px",
                        borderRadius: 8,
                      }}
                    >
                      {item.submission.feedback}
                    </Paragraph>
                  </div>
                )}
              </div>
            )}
          </div>
        </Modal>

        <AttachmentViewerModal
          open={Boolean(viewerFile)}
          onClose={() => setViewerFile(null)}
          file={viewerFile}
        />
      </>
    );
  }
);

AssignmentDetailModal.displayName = "AssignmentDetailModal";

export default AssignmentDetailModal;
