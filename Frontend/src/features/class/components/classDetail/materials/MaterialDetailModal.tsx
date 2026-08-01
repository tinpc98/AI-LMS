import React from "react";
import { Modal, Descriptions, Tag, Button, Typography, Space } from "antd";
import {
  InfoCircleOutlined,
  DownloadOutlined,
  CopyOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { ILearningMaterial } from "../../../../../types/learningMaterial";
import { getMaterialTypeMeta } from "./MaterialCard";

const { Text, Paragraph } = Typography;

interface MaterialDetailModalProps {
  open: boolean;
  item: ILearningMaterial | null;
  onClose: () => void;
  onDownload: (item: ILearningMaterial) => void;
  onCopyLink: (url: string) => void;
}

export const MaterialDetailModal: React.FC<MaterialDetailModalProps> = React.memo(
  ({ open, item, onClose, onDownload, onCopyLink }) => {
    if (!item) return null;

    const meta = getMaterialTypeMeta(item.type, item.url);

    const uploaderName =
      typeof item.uploadedBy === "object" && item.uploadedBy?.fullName
        ? item.uploadedBy.fullName
        : "Giáo viên";

    const formattedDate = item.uploadedAt
      ? new Date(item.uploadedAt).toLocaleString("vi-VN")
      : "Vừa xong";

    return (
      <Modal
        open={open}
        onCancel={onClose}
        title={
          <Space align="center">
            <InfoCircleOutlined style={{ color: "#1890ff", fontSize: 20 }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Chi tiết tài liệu học tập</span>
          </Space>
        }
        footer={[
          <Button key="close" onClick={onClose} style={{ borderRadius: 8 }}>
            Đóng
          </Button>,
          <Button
            key="copy"
            icon={<CopyOutlined />}
            onClick={() => onCopyLink(item.url)}
            style={{ borderRadius: 8 }}
          >
            Sao chép link
          </Button>,
          <Button
            key="download"
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => onDownload(item)}
            style={{ borderRadius: 8 }}
          >
            Tải về ngay
          </Button>,
        ]}
        width={600}
        centered
      >
        <div style={{ padding: "12px 0" }}>
          <Descriptions
            bordered
            column={1}
            size="small"
            styles={{ label: { width: "30%", fontWeight: 600 } }}
          >
            <Descriptions.Item label="Tên tài liệu">
              <Text strong style={{ color: "#1f2937" }}>
                {item.title}
              </Text>
            </Descriptions.Item>

            <Descriptions.Item label="Loại tài liệu">
              <Tag color={meta.color} style={{ borderRadius: 6, fontWeight: 600 }}>
                {meta.label}
              </Tag>
            </Descriptions.Item>

            <Descriptions.Item label="Người đăng">
              <Space size={6}>
                <UserOutlined style={{ color: "#1890ff" }} />
                <span>{uploaderName}</span>
              </Space>
            </Descriptions.Item>

            <Descriptions.Item label="Thời gian tải lên">{formattedDate}</Descriptions.Item>

            <Descriptions.Item label="Mô tả">
              <Paragraph type="secondary" style={{ margin: 0 }}>
                {item.description || "Không có mô tả bổ sung cho tài liệu này."}
              </Paragraph>
            </Descriptions.Item>

            <Descriptions.Item label="Đường dẫn (URL)">
              <Text copyable ellipsis style={{ maxWidth: 350, fontSize: 12 }}>
                {item.url}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </div>
      </Modal>
    );
  }
);

MaterialDetailModal.displayName = "MaterialDetailModal";

export default MaterialDetailModal;
