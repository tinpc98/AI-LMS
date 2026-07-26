import React from "react";
import { Card, Typography, Space, Button, Tag } from "antd";
import { ClockCircleOutlined, BookOutlined, ArrowRightOutlined, InfoCircleOutlined } from "@ant-design/icons";
import NotificationIcon from "./NotificationIcon";
import NotificationStatusBadge from "./NotificationStatusBadge";
import type { INotificationItem } from "../../../types/studentNotification";

const { Text, Paragraph, Title } = Typography;

interface NotificationCardProps {
  item: INotificationItem;
  onDetail: (item: INotificationItem) => void;
  onNavigate?: (targetRoute?: string) => void;
}

export const NotificationCard: React.FC<NotificationCardProps> = React.memo(
  ({ item, onDetail, onNavigate }) => {
    const formattedDate = item.createdAt
      ? new Date(item.createdAt).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Vừa xong";

    const isUnread = !item.isRead;

    return (
      <Card
        hoverable
        onClick={() => onDetail(item)}
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          border: isUnread ? "1px solid #91caff" : "1px solid #f0f0f0",
          backgroundColor: isUnread ? "#e6f7ff" : "#ffffff",
          marginBottom: 14,
          transition: "all 0.3s ease",
        }}
        styles={{ body: { padding: "16px 20px" } }}
      >
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          {/* Category Icon */}
          <NotificationIcon category={item.category} size={44} />

          {/* Main Body */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header: Class name, status badge, date */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6, flexWrap: "wrap", gap: 6 }}>
              <Space size={8} align="center">
                {item.className && (
                  <Tag color="blue" icon={<BookOutlined />} style={{ borderRadius: 6, fontWeight: 600 }}>
                    {item.className}
                  </Tag>
                )}
                <NotificationStatusBadge isRead={item.isRead} priority={item.priority} />
              </Space>

              <Text type="secondary" style={{ fontSize: 11 }}>
                <ClockCircleOutlined style={{ marginRight: 4 }} /> {formattedDate}
              </Text>
            </div>

            {/* Title */}
            <Title level={5} style={{ margin: "0 0 6px 0", color: "#1f2937", lineHeight: 1.4 }}>
              {item.title}
            </Title>

            {/* Description */}
            <Paragraph
              type="secondary"
              style={{
                fontSize: 13,
                lineHeight: 1.6,
                margin: 0,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {item.description}
            </Paragraph>

            {/* Bottom Actions */}
            <div style={{ marginTop: 12, display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <Button
                type="text"
                size="small"
                icon={<InfoCircleOutlined />}
                onClick={(e) => {
                  e.stopPropagation();
                  onDetail(item);
                }}
                style={{ fontSize: 12 }}
              >
                Xem chi tiết
              </Button>

              {item.targetRoute && (
                <Button
                  type="primary"
                  size="small"
                  icon={<ArrowRightOutlined />}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onNavigate) onNavigate(item.targetRoute);
                  }}
                  style={{ borderRadius: 6, fontSize: 12 }}
                >
                  Đi tới màn hình
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  }
);

NotificationCard.displayName = "NotificationCard";

export default NotificationCard;
