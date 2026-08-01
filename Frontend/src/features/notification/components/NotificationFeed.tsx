import React from "react";
import { Typography, Divider } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import NotificationCard from "./NotificationCard";
import type { INotificationItem } from "../../../types/studentNotification";

const { Text } = Typography;

interface NotificationFeedGroup {
  groupTitle: string;
  items: INotificationItem[];
}

interface NotificationFeedProps {
  groups: NotificationFeedGroup[];
  onDetail: (item: INotificationItem) => void;
  onNavigate?: (targetRoute?: string) => void;
}

export const NotificationFeed: React.FC<NotificationFeedProps> = React.memo(
  ({ groups, onDetail, onNavigate }) => {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {groups.map((group) => (
          <div key={group.groupTitle}>
            {/* Group Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <ClockCircleOutlined style={{ color: "#1890ff", fontSize: 14 }} />
              <Text
                strong
                style={{
                  fontSize: 13,
                  color: "#8c8c8c",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {group.groupTitle} ({group.items.length})
              </Text>
              <Divider style={{ margin: 0, flex: 1 }} />
            </div>

            {/* Notification Cards List */}
            <div>
              {group.items.map((item) => (
                <NotificationCard
                  key={item._id}
                  item={item}
                  onDetail={onDetail}
                  onNavigate={onNavigate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }
);

NotificationFeed.displayName = "NotificationFeed";

export default NotificationFeed;
