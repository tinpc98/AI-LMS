import React from "react";
import { Badge, Space } from "antd";
import { FireOutlined } from "@ant-design/icons";
import type { NotificationPriority } from "../../../types/studentNotification";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { tokens } from "../../../shared/theme/tokens";

interface NotificationStatusBadgeProps {
  isRead: boolean;
  priority?: NotificationPriority;
}

export const NotificationStatusBadge: React.FC<NotificationStatusBadgeProps> = React.memo(
  ({ isRead, priority }) => {
    return (
      <Space size={tokens.space[1]} align="center">
        {priority === "high" && (
          <StatusBadge
            tone="danger"
            label="Important"
            icon={<FireOutlined />}
          />
        )}

        {!isRead && (
          <Badge
            status="processing"
            text={
              <span
                style={{
                  fontSize: 11,
                  color: tokens.color.action.primaryBg,
                  fontWeight: 700,
                }}
              >
                Mới
              </span>
            }
          />
        )}
      </Space>
    );
  }
);

NotificationStatusBadge.displayName = "NotificationStatusBadge";

export default NotificationStatusBadge;
