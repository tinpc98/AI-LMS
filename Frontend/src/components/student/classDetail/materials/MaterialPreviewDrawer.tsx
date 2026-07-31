import React from "react";
import { Drawer, Button, Typography, Space, Alert, Tag } from "antd";
import { DownloadOutlined, EyeOutlined, ExportOutlined } from "@ant-design/icons";
import type { ILearningMaterial } from "../../../../types/learningMaterial";
import { getMaterialTypeMeta } from "./MaterialCard";

const { Text, Title } = Typography;

interface MaterialPreviewDrawerProps {
  open: boolean;
  item: ILearningMaterial | null;
  onClose: () => void;
  onDownload: (item: ILearningMaterial) => void;
}

export const MaterialPreviewDrawer: React.FC<MaterialPreviewDrawerProps> = React.memo(
  ({ open, item, onClose, onDownload }) => {
    if (!item) return null;

    const meta = getMaterialTypeMeta(item.type, item.url);
    const urlLower = (item.url || "").toLowerCase();
    const typeLower = (item.type || "").toLowerCase();

    // Determine preview mode
    const isPdf = typeLower.includes("pdf") || urlLower.endsWith(".pdf");
    const isImage = typeLower.includes("image") || urlLower.match(/\.(png|jpe?g|gif|webp)$/);
    const isVideo =
      typeLower.includes("video") || urlLower.endsWith(".mp4") || urlLower.endsWith(".webm");
    const isLink = typeLower.includes("link") || urlLower.startsWith("http");

    const canPreview = isPdf || isImage || isVideo || isLink;

    return (
      <Drawer
        open={open}
        onClose={onClose}
        title={
          <Space align="center">
            <EyeOutlined style={{ color: "#1890ff", fontSize: 20 }} />
            <div>
              <Title level={5} style={{ margin: 0, color: "#1f2937" }}>
                {item.title}
              </Title>
              <Tag color={meta.color} style={{ borderRadius: 6, marginTop: 2 }}>
                {meta.label}
              </Tag>
            </div>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => onDownload(item)}
            style={{ borderRadius: 8 }}
          >
            Tải về
          </Button>
        }
        width={720}
        destroyOnClose
      >
        <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
          {!canPreview ? (
            <div style={{ padding: "40px 20px", textAlign: "center" }}>
              <Alert
                message="Không hỗ trợ xem trước trực tiếp"
                description="Loại tài liệu này (Word/Excel/ZIP/Khác) không hỗ trợ hiển thị xem trước trong trình duyệt. Vui lòng bấm Tải về để xem nội dung đầy đủ."
                type="info"
                showIcon
                style={{ borderRadius: 12, marginBottom: 24 }}
              />
              <Button
                type="primary"
                size="large"
                icon={<DownloadOutlined />}
                onClick={() => onDownload(item)}
                style={{ borderRadius: 8 }}
              >
                Tải file về máy ngay
              </Button>
            </div>
          ) : isImage ? (
            <div style={{ textAlign: "center", overflowY: "auto", flex: 1, padding: 16 }}>
              <img
                src={item.url}
                alt={item.title}
                style={{
                  maxWidth: "100%",
                  height: "auto",
                  borderRadius: 8,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
              />
            </div>
          ) : isVideo ? (
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#000",
                borderRadius: 12,
                overflow: "hidden",
              }}
            >
              <video controls style={{ width: "100%", maxHeight: "100%" }}>
                <source src={item.url} />
                Trình duyệt của bạn không hỗ trợ phát thẻ video.
              </video>
            </div>
          ) : (
            // PDF or Web Link iframe embed
            <div style={{ flex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
              <div
                style={{
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Nếu khung xem trước không hiển thị, bạn có thể mở trong tab mới:
                </Text>
                <Button
                  type="link"
                  icon={<ExportOutlined />}
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                >
                  Mở tab mới
                </Button>
              </div>
              <iframe
                src={item.url}
                title={item.title}
                style={{
                  width: "100%",
                  flex: 1,
                  border: "1px solid #f0f0f0",
                  borderRadius: 8,
                  minHeight: 500,
                }}
              />
            </div>
          )}
        </div>
      </Drawer>
    );
  }
);

MaterialPreviewDrawer.displayName = "MaterialPreviewDrawer";

export default MaterialPreviewDrawer;
