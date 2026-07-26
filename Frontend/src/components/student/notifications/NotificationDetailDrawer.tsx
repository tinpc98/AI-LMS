import React from "react";
import { Drawer, Button, Typography, Space, Descriptions, Tag, Divider, Avatar } from "antd";
import {
  BellOutlined,
  ClockCircleOutlined,
  UserOutlined,
  BookOutlined,
  ArrowRightOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import NotificationIcon from "./NotificationIcon";
import NotificationStatusBadge from "./NotificationStatusBadge";
import type { INotificationItem } from "../../../types/studentNotification";

const { Text, Paragraph, Title } = Typography;

interface NotificationDetailDrawerProps {
  open: boolean;
  item: INotificationItem | null;
  onClose: () => void;
  onNavigate?: (targetRoute?: string) => void;
}

export const NotificationDetailDrawer: React.FC<NotificationDetailDrawerProps> = React.memo(
  ({ open, item, onClose, onNavigate }) => {
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

    return (
      <Drawer
        open={open}
        onClose={onClose}
        title={
          <Space align="center">
            <NotificationIcon category={item.category} size={32} />
            <div>
              <Title level={5} style={{ margin: 0, color: "#1f2937" }}>
                Chi tiết thông báo
              </Title>
              <NotificationStatusBadge isRead={item.isRead} priority={item.priority} />
            </div>
          </Space>
        }
        extra={
          <Space>
            <Button onClick={onClose} style={{ borderRadius: 8 }}>
              Đóng
            </Button>
            {item.targetRoute && (
              <Button
                type="primary"
                icon={<ArrowRightOutlined />}
                onClick={() => {
                  onClose();
                  if (onNavigate) onNavigate(item.targetRoute);
                }}
                style={{ borderRadius: 8 }}
              >
                Đi tới màn hình
              </Button>
            )}
          </Space>
        }
        width={600}
        destroyOnClose
      >
        <div style={{ padding: "8px 0" }}>
          {/* Header Card */}
          <div
            style={{
              backgroundColor: "#fafafa",
              border: "1px solid #f0f0f0",
              borderRadius: 12,
              padding: "16px 20px",
              marginBottom: 20,
              display: "flex",
              justify: "space-between",
              alignItems: "center",
            }}
          >
            <Space size={10} align="center">
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1890ff" }} />
              <div>
                <Text strong style={{ fontSize: 14, color: "#1f2937", display: "block" }}>
                  {item.senderName || "Hệ thống EduPortal"}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  <ClockCircleOutlined style={{ marginRight: 4 }} /> {formattedCreatedAt}
                </Text>
              </div>
            </Space>

            {item.className && (
              <Tag color="blue" icon={<BookOutlined />}>
                {item.className}
              </Tag>
            )}
          </div>

          {/* Title */}
          <Title level={4} style={{ margin: "0 0 16px 0", color: "#1f2937", lineHeight: 1.4 }}>
            {item.title}
          </Title>

          {/* Full Description */}
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
              {item.description}
            </Paragraph>
          </div>

          {/* Attachments if any */}
          {item.attachments && item.attachments.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <Text strong style={{ fontSize: 13, color: "#8c8c8c", display: "block", marginBottom: 8 }}>
                <PaperClipOutlined style={{ marginRight: 4 }} /> File đính kèm ({item.attachments.length}):
              </Text>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {item.attachments.map((att, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: "flex",
                      justify: "space-between",
                      alignItems: "center",
                      backgroundColor: "#fafafa",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: "1px solid #e8e8e8",
                    }}
                  >
                    <Text style={{ fontSize: 13 }}>{att.name}</Text>
                    <Button type="link" size="small" href={att.url} target="_blank">
                      Tải về
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Descriptions Breakdown */}
          <Descriptions
            bordered
            column={1}
            size="small"
            styles={{ label: { width: "35%", fontWeight: 600, backgroundColor: "#fafafa" } }}
          >
            <Descriptions.Item label="Thể loại">{item.category.toUpperCase()}</Descriptions.Item>
            <Descriptions.Item label="Độ ưu tiên">
              {item.priority === "high" ? "Cao (Important)" : "Bình thường"}
            </Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              {item.isRead ? "Đã đọc" : "Chưa đọc"}
            </Descriptions.Item>
          </Descriptions>
        </div>
      </Drawer>
    );
  }
);

NotificationDetailDrawer.displayName = "NotificationDetailDrawer";

export default NotificationDetailDrawer;
