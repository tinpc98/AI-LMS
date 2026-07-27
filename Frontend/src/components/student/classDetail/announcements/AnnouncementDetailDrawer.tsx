import React from "react";
import { Drawer, Button, Typography, Space, Descriptions, Avatar, Divider, Tag } from "antd";
import {
  NotificationOutlined,
  ClockCircleOutlined,
  UserOutlined,
  GlobalOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import AnnouncementTag from "./AnnouncementTag";
import AnnouncementAttachmentList from "./AnnouncementAttachmentList";
import type { IExtendedAnnouncement } from "../../../../types/studentAnnouncement";

const { Text, Paragraph, Title } = Typography;

interface AnnouncementDetailDrawerProps {
  open: boolean;
  item: IExtendedAnnouncement | null;
  onClose: () => void;
}

export const AnnouncementDetailDrawer: React.FC<AnnouncementDetailDrawerProps> = React.memo(
  ({ open, item, onClose }) => {
    if (!item) return null;

    const formattedCreatedAt = item.createdAt
      ? new Date(item.createdAt).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Vừa đăng";

    const formattedUpdatedAt = item.updatedAt
      ? new Date(item.updatedAt).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null;

    return (
      <Drawer
        open={open}
        onClose={onClose}
        title={
          <Space align="center">
            <NotificationOutlined style={{ color: "#1890ff", fontSize: 20 }} />
            <div>
              <Title level={5} style={{ margin: 0, color: "#1f2937" }}>
                Chi tiết thông báo
              </Title>
              <Space size={6} style={{ marginTop: 2 }}>
                <AnnouncementTag type={item.tagType} />
              </Space>
            </div>
          </Space>
        }
        extra={
          <Button onClick={onClose} style={{ borderRadius: 8 }}>
            Đóng
          </Button>
        }
        width={640}
        destroyOnClose
      >
        <div style={{ padding: "8px 0" }}>
          {/* Author & Header Meta */}
          <div
            style={{
              backgroundColor: "#fafafa",
              border: "1px solid #f0f0f0",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 20,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Space size={10} align="center">
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1890ff" }} />
              <div>
                <Text strong style={{ fontSize: 14, color: "#1f2937", display: "block" }}>
                  {item.authorName || "Giảng viên"}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} /> Đăng ngày: {formattedCreatedAt}
                </Text>
              </div>
            </Space>

            <Tag color="blue" icon={<GlobalOutlined />}>
              Phạm vi: {item.scope || "Lớp học"}
            </Tag>
          </div>

          {/* Title */}
          <Title level={4} style={{ margin: "0 0 16px 0", color: "#1f2937", lineHeight: 1.4 }}>
            {item.isPinned && <PushpinOutlined style={{ color: "#fa541c", marginRight: 6 }} />}
            {item.title}
          </Title>

          {/* Full Paragraph Content */}
          <div style={{ marginBottom: 24 }}>
            <Paragraph
              style={{
                fontSize: 14,
                lineHeight: 1.8,
                color: "#262626",
                whiteSpace: "pre-line",
                backgroundColor: "#ffffff",
                padding: "16px",
                borderRadius: 12,
                border: "1px solid #f0f0f0",
                margin: 0,
              }}
            >
              {item.content}
            </Paragraph>
          </div>

          {/* Attachments List */}
          {item.attachments && item.attachments.length > 0 && (
            <AnnouncementAttachmentList attachments={item.attachments} />
          )}

          <Divider style={{ margin: "20px 0" }} />

          {/* Updated Info */}
          {formattedUpdatedAt && (
            <Text type="secondary" style={{ fontSize: 11, fontStyle: "italic", display: "block" }}>
              Cập nhật lần cuối: {formattedUpdatedAt}
            </Text>
          )}
        </div>
      </Drawer>
    );
  }
);

AnnouncementDetailDrawer.displayName = "AnnouncementDetailDrawer";

export default AnnouncementDetailDrawer;
