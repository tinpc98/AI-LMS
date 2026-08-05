import React, { useState } from "react";
import { Typography, Tag, Space, Button } from "antd";
import {
  LinkOutlined,
  PaperClipOutlined,
  EyeOutlined,
  DownloadOutlined,
} from "@ant-design/icons";
import { SafeHTML } from "../../../shared/components/SafeHTML";
import { AttachmentViewerModal, isViewableFile, type AttachmentFile } from "../../../shared/components/AttachmentViewerModal";

const { Text, Paragraph } = Typography;

export interface ISubmissionAttachment extends AttachmentFile {
  format?: string | null;
}

export interface ISubmissionAnswer {
  questionId?: string;
  content: string;
}

export interface ISubmissionDetail {
  submissionType?: string;
  linkUrl?: string | null;
  content?: string;
  answers?: ISubmissionAnswer[];
  attachments?: ISubmissionAttachment[];
  grade?: number | null;
  maxScore?: number;
  feedback?: string;
  aiFeedback?: string;
  status?: string;
}

interface SubmissionDetailViewProps {
  submission: ISubmissionDetail;
}

export const SubmissionDetailView: React.FC<SubmissionDetailViewProps> = ({ submission }) => {
  const [viewerFile, setViewerFile] = useState<ISubmissionAttachment | null>(null);
  const type = submission.submissionType || "file";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* 1. Điểm số & Lời phê */}
      {(submission.grade !== null && submission.grade !== undefined) && (
        <div
          style={{
            backgroundColor: "var(--color-success-bg, #f6ffed)",
            border: "1px solid var(--color-success-border, #b7eb8f)",
            borderRadius: 8,
            padding: "12px 16px",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text strong style={{ fontSize: 16, color: "var(--color-success-text, #389e0d)" }}>
              Điểm: {submission.grade} / {submission.maxScore || 10}
            </Text>
            <Tag color="success" style={{ margin: 0 }}>Đã chấm</Tag>
          </div>
          {submission.feedback && (
            <div>
              <Text strong style={{ fontSize: 13, display: "block", marginBottom: 4 }}>
                Lời phê của giáo viên:
              </Text>
              <Paragraph style={{ margin: 0, fontSize: 14 }}>{submission.feedback}</Paragraph>
            </div>
          )}
        </div>
      )}

      {/* 2. Dán liên kết (Link Mode) */}
      {type === "link" && submission.linkUrl && (
        <div>
          <Text strong style={{ fontSize: 14, display: "block", marginBottom: 8 }}>
            🔗 Liên kết bài làm:
          </Text>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              backgroundColor: "var(--color-surface)",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid var(--color-border-default)",
            }}
          >
            <LinkOutlined style={{ color: "#1677ff", fontSize: 18 }} />
            <a
              href={submission.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 14,
                color: "#1677ff",
                wordBreak: "break-all",
                textDecoration: "underline",
              }}
            >
              {submission.linkUrl}
            </a>
          </div>
        </div>
      )}

      {/* 3. Trực tiếp theo câu hỏi (Direct Mode) */}
      {type === "direct" && submission.answers && submission.answers.length > 0 && (
        <div>
          <Text strong style={{ fontSize: 14, display: "block", marginBottom: 8 }}>
            ✍️ Bài làm trực tiếp ({submission.answers.length} câu):
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {submission.answers.map((ans, idx) => (
              <div
                key={ans.questionId || idx}
                style={{
                  backgroundColor: "var(--color-surface)",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--color-border-default)",
                }}
              >
                <Text strong style={{ fontSize: 14, color: "#1677ff", display: "block", marginBottom: 8 }}>
                  Câu {idx + 1}:
                </Text>
                <div style={{ fontSize: 14 }}>
                  <SafeHTML html={ans.content} fallbackText="(Chưa có nội dung trả lời)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Nội dung văn bản tự do */}
      {submission.content && type !== "direct" && (
        <div>
          <Text strong style={{ fontSize: 14, display: "block", marginBottom: 8 }}>
            Ghi chú / Nội dung bài làm:
          </Text>
          <div
            style={{
              backgroundColor: "var(--color-surface)",
              padding: "12px 16px",
              borderRadius: 8,
              border: "1px solid var(--color-border-default)",
              fontSize: 14,
            }}
          >
            <SafeHTML html={submission.content} />
          </div>
        </div>
      )}

      {/* 5. Tệp đính kèm */}
      {submission.attachments && submission.attachments.length > 0 && (
        <div>
          <Text strong style={{ fontSize: 14, display: "block", marginBottom: 8 }}>
            Tệp đính kèm ({submission.attachments.length}):
          </Text>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {submission.attachments.map((att: ISubmissionAttachment, idx: number) => (
              <div
                key={idx}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  backgroundColor: "var(--color-surface)",
                  padding: "10px 16px",
                  borderRadius: 8,
                  border: "1px solid var(--color-border-default)",
                }}
              >
                <Space size={8} style={{ minWidth: 0, flex: 1, marginRight: 12 }}>
                  <PaperClipOutlined style={{ color: "var(--color-action-primary-bg)", fontSize: 16 }} />
                  <span
                    style={{
                      fontSize: 14,
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
                    {att.name || `Tài liệu đính kèm ${idx + 1}`}
                  </span>
                </Space>

                <Space size={8}>
                  {isViewableFile(att.name || att.url, att.format) && (
                    <Button
                      type="text"
                      size="small"
                      icon={<EyeOutlined />}
                      onClick={() => setViewerFile(att)}
                      style={{ color: "#1677ff" }}
                    >
                      Xem
                    </Button>
                  )}
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
                </Space>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal xem trước tệp bài nộp */}
      <AttachmentViewerModal
        open={Boolean(viewerFile)}
        onClose={() => setViewerFile(null)}
        file={viewerFile}
      />
    </div>
  );
};
