import React from "react";
import { Badge, Tag, Space } from "antd";
import { FireOutlined } from "@ant-design/icons";
import type { NotificationPriority } from "../../../types/studentNotification";

interface NotificationStatusBadgeProps {
  isRead: boolean;
  priority?: NotificationPriority;
}

export const NotificationStatusBadge: React.FC<NotificationStatusBadgeProps> = React.memo(
  ({ isRead, priority }) => {
    return (
      <Space size={6} align="center">
        {priority === "high" && (
          <Tag color="volcano" icon={<FireOutlined />} style={{ borderRadius: 6, fontWeight: 700, margin: 0 }}>
            🔥 Important
          </Tag>
        )}

        {!isRead && (
          <Badge status="processing" text={<span style={{ fontSize: 11, color: "#1890ff", fontWeight: 700 }}>Mới</span>} />
        )}
      </Space>
    );
  }
);

NotificationStatusBadge.displayName = "NotificationStatusBadge";

export default NotificationStatusBadge;
