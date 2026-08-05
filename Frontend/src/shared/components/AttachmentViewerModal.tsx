import React from "react";
import { Modal, Button, Space, Tooltip, Empty } from "antd";
import {
  DownloadOutlined,
  CloseOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileImageOutlined,
  FileUnknownOutlined,
} from "@ant-design/icons";
import { PDFViewer } from "../../features/lesson/components/PDFViewer";
import { DocxViewer } from "../../features/lesson/components/DocxViewer";

export type FileCategory = "pdf" | "docx" | "image" | "unsupported";

export interface AttachmentFile {
  name: string;
  url: string;
  publicId?: string;
  format?: string | null;
}

export const getFileExtension = (filenameOrUrl?: string): string => {
  if (!filenameOrUrl) return "";
  const clean = filenameOrUrl.split("?")[0].split("#")[0];
  const parts = clean.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
};

export const getFileCategory = (filenameOrUrl?: string, format?: string | null): FileCategory => {
  const ext = format ? format.toLowerCase() : getFileExtension(filenameOrUrl);
  if (ext === "pdf") return "pdf";
  if (["docx", "doc"].includes(ext)) return "docx";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) return "image";
  return "unsupported";
};

export const isViewableFile = (filenameOrUrl?: string, format?: string | null): boolean => {
  const cat = getFileCategory(filenameOrUrl, format);
  return cat !== "unsupported";
};

interface AttachmentViewerModalProps {
  open: boolean;
  onClose: () => void;
  file: AttachmentFile | null;
}

export const AttachmentViewerModal: React.FC<AttachmentViewerModalProps> = ({
  open,
  onClose,
  file,
}) => {
  if (!file) return null;

  const category = getFileCategory(file.name || file.url, file.format);

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = file.url;
    link.download = file.name || "download";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderIcon = () => {
    switch (category) {
      case "pdf":
        return <FilePdfOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />;
      case "docx":
        return <FileWordOutlined style={{ color: "#1677ff", fontSize: 18 }} />;
      case "image":
        return <FileImageOutlined style={{ color: "#52c41a", fontSize: 18 }} />;
      default:
        return <FileUnknownOutlined style={{ color: "#8c8c8c", fontSize: 18 }} />;
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ maxWidth: "1200px", top: 20 }}
      styles={{
        body: {
          padding: 0,
          minHeight: "75vh",
          maxHeight: "85vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        },
      }}
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingRight: 32 }}>
          <Space size={8} style={{ maxWidth: "70%" }}>
            {renderIcon()}
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--color-text-title)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                display: "inline-block",
                maxWidth: "450px",
              }}
              title={file.name}
            >
              {file.name || "Xem tài liệu"}
            </span>
          </Space>
          <Space size={8}>
            <Tooltip title="Tải tệp về máy">
              <Button
                type="primary"
                size="small"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                style={{ borderRadius: 6 }}
              >
                Tải về
              </Button>
            </Tooltip>
          </Space>
        </div>
      }
      destroyOnClose
    >
      <div style={{ flex: 1, minHeight: "70vh", maxHeight: "80vh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {category === "pdf" && (
          <PDFViewer url={file.url} title={file.name} onDownload={handleDownload} />
        )}

        {category === "docx" && (
          <DocxViewer url={file.url} title={file.name} onDownload={handleDownload} />
        )}

        {category === "image" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(0, 0, 0, 0.85)",
              padding: 24,
              overflow: "auto",
              minHeight: "65vh",
            }}
          >
            <img
              src={file.url}
              alt={file.name}
              style={{
                maxWidth: "100%",
                maxHeight: "75vh",
                objectFit: "contain",
                borderRadius: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              }}
            />
          </div>
        )}

        {category === "unsupported" && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: 48,
              textAlign: "center",
            }}
          >
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div style={{ marginTop: 12 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "var(--color-text-title)", marginBottom: 4 }}>
                    Định dạng tệp này ({getFileExtension(file.name).toUpperCase() || "Không rõ"}) không hỗ trợ xem trực tiếp trên trình duyệt.
                  </p>
                  <p style={{ fontSize: 12, color: "var(--color-text-description)" }}>
                    Vui lòng tải tệp về máy tính để mở bằng ứng dụng tương ứng.
                  </p>
                </div>
              }
            >
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                style={{ marginTop: 16, borderRadius: 8 }}
              >
                Tải tệp về máy ({file.name})
              </Button>
            </Empty>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default AttachmentViewerModal;
