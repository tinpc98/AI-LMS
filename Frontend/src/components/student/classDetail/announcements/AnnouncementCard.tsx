import React from "react";
import { Card, Avatar, Typography, Space, Badge, Tooltip, Alert, Button } from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  PaperClipOutlined,
  ArrowRightOutlined,
  PushpinOutlined,
} from "@ant-design/icons";
import AnnouncementTag from "./AnnouncementTag";
import AnnouncementAttachmentList from "./AnnouncementAttachmentList";
import type { IExtendedAnnouncement } from "../../../types/studentAnnouncement";

const { Text, Paragraph, Title } = Typography;

interface AnnouncementCardProps {
  item: IExtendedAnnouncement;
  onDetail: (item: IExtendedAnnouncement) => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = React.memo(({ item, onDetail }) => {
  const formattedDate = item.createdAt
    ? new Date(item.createdAt).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Vừa đăng";

  const isUnread = !item.isRead;

  return (
    <Card
      hoverable
      onClick={() => onDetail(item)}
      style={{
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
        border: item.isPinned ? "2px solid #ffbb96" : "1px solid #f0f0f0",
        backgroundColor: item.isPinned ? "#fff7e6" : "#ffffff",
        marginBottom: 16,
        transition: "all 0.3s ease",
      }}
      styles={{ body: { padding: 20 } }}
    >
      {/* Header: Teacher Avatar, Author Name, Time & Unread Badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <Space size={10} align="center">
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: "#1890ff" }} />
          <div>
            <Text strong style={{ fontSize: 14, color: "#1f2937", display: "block" }}>
              {item.authorName || "Giảng viên"}
            </Text>
            <Text type="secondary" style={{ fontSize: 11 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} /> {formattedDate}
            </Text>
          </div>
        </Space>

        <Space size={8} align="center">
          <AnnouncementTag type={item.tagType} />
          {isUnread && (
            <Badge status="processing" text={<span style={{ fontSize: 11, color: "#1890ff", fontWeight: 700 }}>Chưa đọc</span>} />
          )}
        </Space>
      </div>

      {/* Important Alert Notice if Marked as Important */}
      {item.isImportant && !item.isPinned && (
        <Alert
          message="Thông báo quan trọng từ giảng viên"
          type="warning"
          showIcon
          style={{ borderRadius: 8, marginBottom: 12, padding: "6px 12px" }}
        />
      )}

      {/* Title */}
      <Title level={5} style={{ margin: "0 0 8px 0", color: "#1f2937", lineHeight: 1.4 }}>
        {item.isPinned && <PushpinOutlined style={{ color: "#fa541c", marginRight: 6 }} />}
        {item.title}
      </Title>

      {/* Short Snippet Paragraph */}
      <Paragraph
        type="secondary"
        style={{
          fontSize: 13,
          lineHeight: 1.6,
          margin: "0 0 12px 0",
          display: "-webkit-box",
          WebkitLineClamp: 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {item.content}
      </Paragraph>

      {/* Attachments Preview if any */}
      {item.attachments && item.attachments.length > 0 && (
        <AnnouncementAttachmentList attachments={item.attachments} />
      )}

      {/* Footer Read More link */}
      <div style={{ marginTop: 12, textAlign: "right" }}>
        <Button type="link" size="small" icon={<ArrowRightOutlined />} style={{ padding: 0, fontWeight: 600 }}>
          Xem chi tiết thông báo
        </Button>
      </div>
    </Card>
  );
});

AnnouncementCard.displayName = "AnnouncementCard";

export default AnnouncementCard;
