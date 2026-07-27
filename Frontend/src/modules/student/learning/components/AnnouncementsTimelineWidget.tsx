import React from "react";
import { Card, Typography, Timeline, Space } from "antd";
import { NotificationOutlined } from "@ant-design/icons";
import type { AnnouncementSummaryItem } from "../types/learningDashboard.types";

const { Text } = Typography;

interface AnnouncementsTimelineWidgetProps {
  announcements: AnnouncementSummaryItem[];
}

export const AnnouncementsTimelineWidget: React.FC<AnnouncementsTimelineWidgetProps> = React.memo(
  ({ announcements }) => {
    return (
      <Card
        title={
          <span style={{ fontSize: 15, fontWeight: 700 }}>
            <NotificationOutlined style={{ color: "#13c2c2", marginRight: 6 }} /> Thông báo mới nhất ({announcements.length})
          </span>
        }
        style={{ borderRadius: 16, border: "1px solid #f0f0f0", marginBottom: 24 }}
        styles={{ body: { padding: 16 } }}
      >
        {announcements.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 13, fontStyle: "italic" }}>
            Không có thông báo mới.
          </Text>
        ) : (
          <Timeline
            items={announcements.slice(0, 4).map((item) => ({
              dot: <NotificationOutlined style={{ color: "#13c2c2", fontSize: 14 }} />,
              children: (
                <div>
                  <Text strong style={{ fontSize: 13, color: "#1f2937", display: "block" }}>
                    {item.title}
                  </Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>
                    {item.authorName} • {new Date(item.createdAt).toLocaleDateString("vi-VN")}
                  </Text>
                </div>
              ),
            }))}
          />
        )}
      </Card>
    );
  }
);

AnnouncementsTimelineWidget.displayName = "AnnouncementsTimelineWidget";

export default AnnouncementsTimelineWidget;
