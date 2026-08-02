import React from "react";
import { Card, Typography, Tag } from "antd";
import { BellOutlined, PushpinOutlined } from "@ant-design/icons";
import type { AnnouncementSummaryItem } from "../types/learningDashboard.types";
import EmptyState from "../../../shared/components/EmptyState";

const { Text } = Typography;

interface AnnouncementsTimelineWidgetProps {
  announcements: AnnouncementSummaryItem[];
}

export const AnnouncementsTimelineWidget: React.FC<AnnouncementsTimelineWidgetProps> = React.memo(
  ({ announcements }) => {
    const displayed = announcements.slice(0, 4);

    return (
      <Card
      style={{
        borderRadius: 20,
        border: "1px solid #f0f0f0",
        boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
      }}
      styles={{ body: { padding: "8px 20px 20px" } }}
      >
        {announcements.length === 0 ? (
        <EmptyState
          image={
            <BellOutlined
              style={{ fontSize: 28, display: "block", color: "#d1d5db" }}
            />
          }
          description="Không có thông báo mới."
          style={{ padding: "28px 0", border: "none", backgroundColor: "transparent" }}
        />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {displayed.map((item, idx) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  gap: 12,
                  alignItems: "flex-start",
                  padding: "12px 0",
                  borderBottom:
                    idx < displayed.length - 1 ? "1px solid #f5f5f5" : "none",
                }}
              >
                {/* Dot */}
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: item.isRead ? "#f5f5f5" : "#e6fffb",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: 1,
                  }}
                >
                  <BellOutlined
                    style={{
                      fontSize: 14,
                      color: item.isRead ? "#8c8c8c" : "#13c2c2",
                    }}
                  />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 6,
                      marginBottom: 3,
                    }}
                  >
                    <Text
                      strong
                      style={{
                        fontSize: 13,
                        color: item.isRead ? "#4b5563" : "#1f2937",
                        lineHeight: 1.35,
                        flex: 1,
                      }}
                    >
                      {item.title}
                    </Text>
                    {item.isPinned && (
                      <Tag
                        color="gold"
                        icon={<PushpinOutlined />}
                        style={{ borderRadius: 6, fontSize: 10, flexShrink: 0, lineHeight: "18px" }}
                      >
                        Ghim
                      </Tag>
                    )}
                    {!item.isRead && (
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          backgroundColor: "#13c2c2",
                          flexShrink: 0,
                          marginTop: 4,
                        }}
                      />
                    )}
                  </div>
                  <Text style={{ fontSize: 11, color: "#9ca3af" }}>
                    {item.authorName}
                    <span style={{ margin: "0 4px" }}>•</span>
                    {new Date(item.createdAt).toLocaleDateString("vi-VN", {
                      day: "numeric",
                      month: "numeric",
                    })}
                  </Text>
                </div>
              </div>
            ))}

            {announcements.length > 4 && (
              <Text
                style={{
                  fontSize: 12,
                  color: "#13c2c2",
                  textAlign: "center",
                  display: "block",
                  paddingTop: 8,
                }}
              >
                + {announcements.length - 4} thông báo khác
              </Text>
            )}
          </div>
        )}
      </Card>
    );
  }
);

AnnouncementsTimelineWidget.displayName = "AnnouncementsTimelineWidget";

export default AnnouncementsTimelineWidget;
