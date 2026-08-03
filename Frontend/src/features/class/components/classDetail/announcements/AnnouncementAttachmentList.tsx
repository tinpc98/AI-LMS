import React from "react";
import { Typography, Space, Button, Card } from "antd";
import {
  PaperClipOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FilePptOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  FileZipOutlined,
  LinkOutlined,
  DownloadOutlined,
} from "@ant-design/icons";

const { Text } = Typography;

interface AttachmentItem {
  name: string;
  url: string;
  publicId?: string;
}

interface AnnouncementAttachmentListProps {
  attachments?: AttachmentItem[];
}

export const AnnouncementAttachmentList: React.FC<AnnouncementAttachmentListProps> = React.memo(
  ({ attachments }) => {
    if (!attachments || attachments.length === 0) return null;

    const getFileIcon = (name: string, url: string) => {
      const filename = (name || url).toLowerCase();
      if (filename.endsWith(".pdf"))
        return <FilePdfOutlined style={{ color: "var(--color-error-base)", fontSize: 18 }} />;
      if (filename.endsWith(".doc") || filename.endsWith(".docx"))
        return <FileWordOutlined style={{ color: "var(--color-action-primary-bg)", fontSize: 18 }} />;
      if (filename.endsWith(".xls") || filename.endsWith(".xlsx"))
        return <FileExcelOutlined style={{ color: "var(--color-success-base)", fontSize: 18 }} />;
      if (filename.endsWith(".ppt") || filename.endsWith(".pptx"))
        return <FilePptOutlined style={{ color: "var(--color-warning-base)", fontSize: 18 }} />;
      if (filename.match(/\.(png|jpe?g|gif|webp)$/))
        return <FileImageOutlined style={{ color: "var(--color-secondary-icon)", fontSize: 18 }} />;
      if (filename.match(/\.(mp4|webm|mkv)$/))
        return <VideoCameraOutlined style={{ color: "var(--color-accent-base)", fontSize: 18 }} />;
      if (filename.endsWith(".zip") || filename.endsWith(".rar"))
        return <FileZipOutlined style={{ color: "var(--color-text-description)", fontSize: 18 }} />;
      if (url.startsWith("http"))
        return <LinkOutlined style={{ color: "var(--color-info-base)", fontSize: 18 }} />;
      return <PaperClipOutlined style={{ color: "var(--color-action-primary-bg)", fontSize: 18 }} />;
    };

    return (
      <Card
        size="small"
        style={{
          borderRadius: 12,
          backgroundColor: "var(--color-bg-page)",
          border: "1px solid var(--color-border-divider)",
          marginTop: 12,
        }}
        styles={{ body: { padding: "10px 14px" } }}
      >
        <Text strong style={{ fontSize: 12, color: "var(--color-text-description)", display: "block", marginBottom: 8 }}>
          <PaperClipOutlined style={{ marginRight: 4 }} /> File đính kèm & Liên kết (
          {attachments.length}):
        </Text>

        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {attachments.map((att, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "var(--color-surface)",
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid var(--color-border-default)",
              }}
            >
              <Space size={8}>
                {getFileIcon(att.name, att.url)}
                <Text ellipsis style={{ fontSize: 13, maxWidth: 300 }}>
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
                  Tải về / Mở
                </Button>
              )}
            </div>
          ))}
        </div>
      </Card>
    );
  }
);

AnnouncementAttachmentList.displayName = "AnnouncementAttachmentList";

export default AnnouncementAttachmentList;
