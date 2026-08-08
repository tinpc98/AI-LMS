import React, { useState, useRef, useEffect } from "react";
import { Card, Avatar, Typography, Space, Button, Tag } from "antd";
import {
  UserOutlined,
  ClockCircleOutlined,
  PushpinOutlined,
  GlobalOutlined,
  DownOutlined,
  UpOutlined,
  PaperClipOutlined,
} from "@ant-design/icons";
import type { IExtendedAnnouncement } from "../../../../../types/studentAnnouncement";

const { Text, Title } = Typography;

interface AnnouncementCardProps {
  item: IExtendedAnnouncement;
  onDetail: (item: IExtendedAnnouncement) => void;
  onMarkAsRead: (id: string) => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = React.memo(
  ({ item, onDetail, onMarkAsRead }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isTextTruncated, setIsTextTruncated] = useState(false);
    const textRef = useRef<HTMLDivElement>(null);

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
    const hasAttachments = item.attachments && item.attachments.length > 0;

    // Check if text is naturally truncated
    useEffect(() => {
      if (textRef.current) {
        if (textRef.current.scrollHeight > textRef.current.clientHeight) {
          setIsTextTruncated(true);
        }
      }
    }, [item.content]);

    const handleCardClick = () => {
      if (isUnread) {
        onMarkAsRead(item._id);
      }
    };

    return (
      <Card
        hoverable
        onClick={handleCardClick}
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          border: item.isPinned
            ? "2px solid var(--color-warning-border, #ffe58f)"
            : "1px solid var(--color-border-default)",
          borderLeft: isUnread
            ? "4px solid var(--color-action-primary-bg)"
            : item.isPinned
            ? "2px solid var(--color-warning-border, #ffe58f)"
            : "1px solid var(--color-border-default)",
          backgroundColor: item.isPinned
            ? "var(--color-warning-bg)"
            : isUnread
            ? "var(--color-bg-page)"
            : "var(--color-surface)",
          marginBottom: 16,
          transition: "var(--transition-fast)",
          opacity: isUnread ? 1 : 0.85,
        }}
        styles={{ body: { padding: "16px 20px" } }}
      >
        {/* Header: Teacher Avatar, Author Name, Time & Scope Badge */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <Space size={10} align="center" style={{ opacity: 0.7 }}>
            <Avatar size={28} icon={<UserOutlined />} style={{ backgroundColor: "var(--color-action-primary-bg)" }} />
            <div>
              <Text strong style={{ fontSize: 13, color: "var(--color-text-title)", display: "block" }}>
                {item.authorName || "Giảng viên"}
              </Text>
              <Text type="secondary" style={{ fontSize: 11 }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} /> {formattedDate}
              </Text>
            </div>
          </Space>

          <Tag color="blue" icon={<GlobalOutlined />} style={{ margin: 0, borderRadius: 12 }}>
            {item.scope === "System" ? "Toàn hệ thống" : "Lớp học"}
          </Tag>
        </div>

        {/* Title */}
        <Title
          level={5}
          style={{
            margin: "0 0 8px 0",
            color: "var(--color-text-title)",
            lineHeight: 1.4,
            fontWeight: isUnread ? 800 : 600,
          }}
        >
          {item.isPinned && <PushpinOutlined style={{ color: "var(--color-warning-base)", marginRight: 6 }} />}
          {item.title}
        </Title>

        {/* Content Paragraph */}
        <div
          ref={textRef}
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--color-text-title)",
            margin: "0 0 12px 0",
            display: isExpanded ? "block" : "-webkit-box",
            WebkitLineClamp: isExpanded ? undefined : 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            whiteSpace: "pre-wrap",
          }}
        >
          {item.content}
        </div>

        {/* Expand/Collapse Text Button */}
        {isTextTruncated && (
          <Button
            type="link"
            size="small"
            style={{ padding: 0, marginTop: -4, marginBottom: 12, fontSize: 13 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
              if (isUnread) onMarkAsRead(item._id);
            }}
          >
            {isExpanded ? (
              <>
                Thu gọn <UpOutlined />
              </>
            ) : (
              <>
                Xem thêm <DownOutlined />
              </>
            )}
          </Button>
        )}

        {/* Attachments (only preview limited amount or just a button to view) */}
        {hasAttachments && (
          <div style={{ marginTop: 8, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
            <Button
              size="small"
              icon={<PaperClipOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onDetail(item);
                if (isUnread) onMarkAsRead(item._id);
              }}
            >
              Xem đính kèm ({item.attachments!.length})
            </Button>
            <Text type="secondary" style={{ fontSize: 12 }}>
              Nhấn để xem chi tiết đính kèm
            </Text>
          </div>
        )}
      </Card>
    );
  }
);

AnnouncementCard.displayName = "AnnouncementCard";

export default AnnouncementCard;
