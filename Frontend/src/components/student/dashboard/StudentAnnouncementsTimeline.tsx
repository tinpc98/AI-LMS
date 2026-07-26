import React from "react";
import { Card, Timeline, Typography, Tag, Avatar, Space } from "antd";
import { BellOutlined, UserOutlined, PushpinOutlined } from "@ant-design/icons";
import EmptyState from "../../common/EmptyState";

const { Text, Paragraph } = Typography;

export interface IStudentAnnouncementItem {
  id: string;
  title: string;
  content: string;
  authorName?: string;
  authorAvatar?: string;
  createdAt: string;
  isPinned?: boolean;
  isRead?: boolean;
  category?: string;
}

interface StudentAnnouncementsTimelineProps {
  announcements: IStudentAnnouncementItem[];
}

export const StudentAnnouncementsTimeline: React.FC<StudentAnnouncementsTimelineProps> = React.memo(
  ({ announcements }) => {
    return (
      <Card
        title={
          <Space align="center">
            <BellOutlined style={{ color: "#722ed1", fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Thông báo mới nhất</span>
          </Space>
        }
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          marginBottom: 24,
        }}
        styles={{ body: { padding: 20 } }}
      >
        {announcements.length === 0 ? (
          <EmptyState
            description="Chưa có thông báo mới nào từ giảng viên hoặc nhà trường."
            style={{ padding: "32px 16px", border: "none" }}
          />
        ) : (
          <Timeline
            mode="left"
            items={announcements.map((item) => {
              const formattedTime = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Gần đây";

              return {
                color: item.isPinned ? "gold" : item.isRead ? "gray" : "blue",
                dot: item.isPinned ? <PushpinOutlined style={{ color: "#faad14", fontSize: 16 }} /> : undefined,
                children: (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                      <Space size={8}>
                        <Avatar
                          size={22}
                          src={item.authorAvatar || undefined}
                          icon={!item.authorAvatar ? <UserOutlined /> : undefined}
                        />
                        <Text strong style={{ fontSize: 13, color: "#262626" }}>
                          {item.authorName || "Giảng viên"}
                        </Text>
                      </Space>

                      <Space size={6}>
                        {item.isPinned && (
                          <Tag color="gold" style={{ borderRadius: 8, fontSize: 11 }}>
                            Ghim
                          </Tag>
                        )}
                        {!item.isRead ? (
                          <Tag color="blue" style={{ borderRadius: 8, fontSize: 11 }}>
                            Chưa đọc
                          </Tag>
                        ) : (
                          <Tag style={{ borderRadius: 8, fontSize: 11 }}>Đã đọc</Tag>
                        )}
                      </Space>
                    </div>

                    <Text strong style={{ fontSize: 14, display: "block", marginTop: 4, color: "#1f2937" }}>
                      {item.title}
                    </Text>

                    <Paragraph
                      type="secondary"
                      ellipsis={{ rows: 2 }}
                      style={{ fontSize: 12, margin: "4px 0 0 0", color: "#595959" }}
                    >
                      {item.content}
                    </Paragraph>

                    <Text type="secondary" style={{ fontSize: 11, display: "block", marginTop: 4 }}>
                      {formattedTime}
                    </Text>
                  </div>
                ),
              };
            })}
          />
        )}
      </Card>
    );
  }
);

StudentAnnouncementsTimeline.displayName = "StudentAnnouncementsTimeline";

export default StudentAnnouncementsTimeline;
