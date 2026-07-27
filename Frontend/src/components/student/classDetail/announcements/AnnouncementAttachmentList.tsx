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

export const AnnouncementAttachmentList: React.FC<AnnouncementAttachmentListProps> = React.memo(({ attachments }) => {
  if (!attachments || attachments.length === 0) return null;

  const getFileIcon = (name: string, url: string) => {
    const filename = (name || url).toLowerCase();
    if (filename.endsWith(".pdf")) return <FilePdfOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />;
    if (filename.endsWith(".doc") || filename.endsWith(".docx")) return <FileWordOutlined style={{ color: "#1890ff", fontSize: 18 }} />;
    if (filename.endsWith(".xls") || filename.endsWith(".xlsx")) return <FileExcelOutlined style={{ color: "#52c41a", fontSize: 18 }} />;
    if (filename.endsWith(".ppt") || filename.endsWith(".pptx")) return <FilePptOutlined style={{ color: "#fa8c16", fontSize: 18 }} />;
    if (filename.match(/\.(png|jpe?g|gif|webp)$/)) return <FileImageOutlined style={{ color: "#722ed1", fontSize: 18 }} />;
    if (filename.match(/\.(mp4|webm|mkv)$/)) return <VideoCameraOutlined style={{ color: "#eb2f96", fontSize: 18 }} />;
    if (filename.endsWith(".zip") || filename.endsWith(".rar")) return <FileZipOutlined style={{ color: "#8c8c8c", fontSize: 18 }} />;
    if (url.startsWith("http")) return <LinkOutlined style={{ color: "#13c2c2", fontSize: 18 }} />;
    return <PaperClipOutlined style={{ color: "#1890ff", fontSize: 18 }} />;
  };

  return (
    <Card
      size="small"
      style={{
        borderRadius: 12,
        backgroundColor: "#fafafa",
        border: "1px solid #f0f0f0",
        marginTop: 12,
      }}
      styles={{ body: { padding: "10px 14px" } }}
    >
      <Text strong style={{ fontSize: 12, color: "#8c8c8c", display: "block", marginBottom: 8 }}>
        <PaperClipOutlined style={{ marginRight: 4 }} /> File đính kèm & Liên kết ({attachments.length}):
      </Text>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {attachments.map((att, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              backgroundColor: "#fff",
              padding: "6px 12px",
              borderRadius: 8,
              border: "1px solid #e8e8e8",
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
});

AnnouncementAttachmentList.displayName = "AnnouncementAttachmentList";

export default AnnouncementAttachmentList;
