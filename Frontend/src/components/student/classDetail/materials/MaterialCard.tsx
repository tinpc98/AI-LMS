import React from "react";
import { Card, Tag, Avatar, Typography, Space, Tooltip, Button } from "antd";
import {
  FilePdfOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  LinkOutlined,
  FilePptOutlined,
  FileImageOutlined,
  FileZipOutlined,
  FileUnknownOutlined,
  EyeOutlined,
  DownloadOutlined,
  CopyOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ILearningMaterial } from "../../../types/learningMaterial";

const { Text, Paragraph } = Typography;

interface MaterialCardProps {
  item: ILearningMaterial;
  onPreview: (item: ILearningMaterial) => void;
  onDownload: (item: ILearningMaterial) => void;
  onCopyLink: (url: string) => void;
  onDetail: (item: ILearningMaterial) => void;
}

// Helper to determine file icon, color, and badge label
export function getMaterialTypeMeta(type: string = "", url: string = "") {
  const typeLower = (type || "").toLowerCase();
  const urlLower = (url || "").toLowerCase();

  if (typeLower.includes("pdf") || urlLower.endsWith(".pdf")) {
    return {
      icon: <FilePdfOutlined style={{ fontSize: 28, color: "#ff4d4f" }} />,
      color: "red",
      label: "PDF Document",
    };
  }
  if (typeLower.includes("video") || urlLower.includes("youtube") || urlLower.endsWith(".mp4")) {
    return {
      icon: <VideoCameraOutlined style={{ fontSize: 28, color: "#1890ff" }} />,
      color: "blue",
      label: "Video",
    };
  }
  if (typeLower.includes("link") || urlLower.startsWith("http")) {
    return {
      icon: <LinkOutlined style={{ fontSize: 28, color: "#13c2c2" }} />,
      color: "cyan",
      label: "Web Link",
    };
  }
  if (typeLower.includes("slide") || typeLower.includes("powerpoint") || urlLower.endsWith(".ppt") || urlLower.endsWith(".pptx")) {
    return {
      icon: <FilePptOutlined style={{ fontSize: 28, color: "#fa8c16" }} />,
      color: "orange",
      label: "Slide / PPT",
    };
  }
  if (typeLower.includes("image") || urlLower.match(/\.(png|jpe?g|gif|webp)$/)) {
    return {
      icon: <FileImageOutlined style={{ fontSize: 28, color: "#eb2f96" }} />,
      color: "magenta",
      label: "Hình ảnh",
    };
  }
  if (typeLower.includes("zip") || urlLower.endsWith(".zip") || urlLower.endsWith(".rar")) {
    return {
      icon: <FileZipOutlined style={{ fontSize: 28, color: "#722ed1" }} />,
      color: "purple",
      label: "Nén ZIP",
    };
  }
  if (typeLower.includes("document") || urlLower.endsWith(".doc") || urlLower.endsWith(".docx")) {
    return {
      icon: <FileTextOutlined style={{ fontSize: 28, color: "#2f54eb" }} />,
      color: "geekblue",
      label: "Văn bản Word",
    };
  }
  return {
    icon: <FileUnknownOutlined style={{ fontSize: 28, color: "#8c8c8c" }} />,
    color: "default",
    label: type || "Tài liệu",
  };
}

export const MaterialCard: React.FC<MaterialCardProps> = React.memo(
  ({ item, onPreview, onDownload, onCopyLink, onDetail }) => {
    const meta = getMaterialTypeMeta(item.type, item.url);

    const uploaderName =
      typeof item.uploadedBy === "object" && item.uploadedBy?.fullName
        ? item.uploadedBy.fullName
        : "Giáo viên";

    const uploaderAvatar =
      typeof item.uploadedBy === "object" ? item.uploadedBy?.avatar : undefined;

    const formattedDate = item.uploadedAt
      ? new Date(item.uploadedAt).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })
      : "Vừa xong";

    return (
      <Card
        hoverable
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          border: "1px solid #f0f0f0",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justify: "space-between",
          transition: "all 0.3s ease",
        }}
        styles={{
          body: {
            padding: 20,
            display: "flex",
            flexDirection: "column",
            flex: 1,
          },
        }}
      >
        {/* Header Icon + Type Tag */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{ backgroundColor: "#fafafa", padding: 10, borderRadius: 12, border: "1px solid #f0f0f0" }}>
            {meta.icon}
          </div>
          <Tag color={meta.color} style={{ borderRadius: 8, fontWeight: 600, margin: 0 }}>
            {meta.label}
          </Tag>
        </div>

        {/* Title */}
        <Tooltip title={item.title}>
          <Text
            strong
            style={{
              fontSize: 15,
              color: "#1f2937",
              lineHeight: 1.4,
              marginBottom: 6,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.title}
          </Text>
        </Tooltip>

        {/* Short Description */}
        <Paragraph
          type="secondary"
          style={{
            fontSize: 12,
            margin: "0 0 12px 0",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            minHeight: 36,
          }}
        >
          {item.description || "Không có mô tả bổ sung cho tài liệu này."}
        </Paragraph>

        <div style={{ marginTop: "auto" }}>
          {/* Uploader & Date */}
          <div
            style={{
              display: "flex",
              justify: "space-between",
              alignItems: "center",
              paddingTop: 12,
              borderTop: "1px dashed #f0f0f0",
              marginBottom: 14,
            }}
          >
            <Space size={8}>
              <Avatar
                size="small"
                src={uploaderAvatar}
                icon={!uploaderAvatar ? <UserOutlined /> : undefined}
                style={{ backgroundColor: "#1890ff" }}
              />
              <Text type="secondary" style={{ fontSize: 12, maxWidth: 100 }} ellipsis>
                {uploaderName}
              </Text>
            </Space>
            <Text type="secondary" style={{ fontSize: 11 }}>
              {formattedDate}
            </Text>
          </div>

          {/* Action Buttons Toolbar */}
          <Space size={6} wrap style={{ width: "100%", justifyContent: "space-between" }}>
            <Button
              type="primary"
              ghost
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onPreview(item)}
              style={{ borderRadius: 6, fontSize: 12 }}
            >
              Xem trước
            </Button>

            <Tooltip title="Tải tài liệu về máy">
              <Button
                type="default"
                size="small"
                icon={<DownloadOutlined />}
                onClick={() => onDownload(item)}
                style={{ borderRadius: 6, fontSize: 12 }}
              >
                Tải về
              </Button>
            </Tooltip>

            <Tooltip title="Sao chép đường dẫn">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => onCopyLink(item.url)}
              />
            </Tooltip>

            <Tooltip title="Chi tiết tài liệu">
              <Button
                type="text"
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={() => onDetail(item)}
              />
            </Tooltip>
          </Space>
        </div>
      </Card>
    );
  }
);

MaterialCard.displayName = "MaterialCard";

export default MaterialCard;
