import React from "react";
import { Card, Tag, Avatar, Typography, Space, Tooltip, Button } from "antd";
import {
  FilePdfOutlined,
  FileTextOutlined,
  VideoCameraOutlined,
  LinkOutlined,
  FilePptOutlined,
  FileExcelOutlined,
  FileImageOutlined,
  FileZipOutlined,
  FileUnknownOutlined,
  EyeOutlined,
  InfoCircleOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ILearningMaterial } from "../../../../../types/learningMaterial";
import { classifyResource } from "../../../../lesson/utils/resourceUtils";
import { Link } from "react-router-dom";

const { Text, Paragraph } = Typography;

interface MaterialCardProps {
  item: ILearningMaterial;
  classId?: string;
  onPreview?: (item: ILearningMaterial) => void;
  onDownload?: (item: ILearningMaterial) => void;
  onCopyLink?: (url: string) => void;
  onDetail: (item: ILearningMaterial) => void;
}

// Helper to determine file icon, color, and badge label
export function getMaterialTypeMeta(item: Partial<ILearningMaterial>) {
  const meta = classifyResource(item);

  switch (meta.kind) {
    case "pdf":
      return {
        icon: <FilePdfOutlined style={{ fontSize: 28, color: "var(--color-error-base)" }} />,
        color: "red",
        label: meta.label,
      };
    case "video":
    case "youtube":
      return {
        icon: <VideoCameraOutlined style={{ fontSize: 28, color: "var(--color-action-primary-bg)" }} />,
        color: "blue",
        label: meta.label,
      };
    case "link":
      return {
        icon: <LinkOutlined style={{ fontSize: 28, color: "var(--color-info-base)" }} />,
        color: "cyan",
        label: meta.label,
      };
    case "slide":
      return {
        icon: <FilePptOutlined style={{ fontSize: 28, color: "var(--color-warning-base)" }} />,
        color: "orange",
        label: meta.label,
      };
    case "excel":
      return {
        icon: <FileExcelOutlined style={{ fontSize: 28, color: "var(--color-success-base, #10b981)" }} />,
        color: "green",
        label: meta.label,
      };
    case "image":
      return {
        icon: <FileImageOutlined style={{ fontSize: 28, color: "var(--color-accent-base)" }} />,
        color: "magenta",
        label: meta.label,
      };
    case "zip":
      return {
        icon: <FileZipOutlined style={{ fontSize: 28, color: "var(--color-secondary-icon)" }} />,
        color: "purple",
        label: meta.label,
      };
    case "docx":
      return {
        icon: <FileTextOutlined style={{ fontSize: 28, color: "var(--color-action-primary-bg)" }} />,
        color: "geekblue",
        label: meta.label,
      };
    default:
      return {
        icon: <FileUnknownOutlined style={{ fontSize: 28, color: "var(--color-text-description)" }} />,
        color: "default",
        label: meta.label,
      };
  }
}

export const MaterialCard: React.FC<MaterialCardProps> = React.memo(
  ({ item, classId, onPreview, onDetail }) => {
    const meta = getMaterialTypeMeta(item);

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
          border: "1px solid var(--color-border-default)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          transition: "var(--transition-fast)",
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-bg-page)",
              padding: 10,
              borderRadius: 12,
              border: "1px solid var(--color-border-default)",
            }}
          >
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
              color: "var(--color-text-title)",
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
              justifyContent: "space-between",
              alignItems: "center",
              paddingTop: 12,
              borderTop: "1px dashed var(--color-border-default)",
              marginBottom: 14,
            }}
          >
            <Space size={8}>
              <Avatar
                size="small"
                src={uploaderAvatar}
                icon={!uploaderAvatar ? <UserOutlined /> : undefined}
                style={{ backgroundColor: "var(--color-action-primary-bg)" }}
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            {classId ? (
              <Link
                to={`/student/classdetail/${classId}/resource/${item._id}`}
                className="ant-btn ant-btn-primary ant-btn-sm ant-btn-background-ghost inline-flex items-center justify-center gap-1.5"
                style={{
                  flex: 1,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  height: 32,
                  textDecoration: "none",
                }}
              >
                <EyeOutlined />
                <span>Xem tài liệu</span>
              </Link>
            ) : (
              <Button
                type="primary"
                ghost
                size="small"
                icon={<EyeOutlined />}
                onClick={() => onPreview && onPreview(item)}
                style={{
                  flex: 1,
                  borderRadius: 8,
                  fontSize: 13,
                  fontWeight: 500,
                  height: 32,
                }}
              >
                Xem tài liệu
              </Button>
            )}

            <Tooltip title="Chi tiết tài liệu">
              <Button
                type="text"
                size="small"
                icon={<InfoCircleOutlined style={{ fontSize: 16 }} />}
                onClick={() => onDetail(item)}
                style={{
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--color-text-secondary)",
                }}
              />
            </Tooltip>
          </div>
        </div>
      </Card>
    );
  }
);

MaterialCard.displayName = "MaterialCard";

export default MaterialCard;
