import React from "react";
import { Card, List, Tag, Typography, Empty, Space } from "antd";
import { NotificationOutlined, ClockCircleOutlined } from "@ant-design/icons";

const { Title, Text, Paragraph } = Typography;

interface AnnouncementItem {
  _id: string;
  title: string;
  content: string;
  scope?: "System" | "Course" | "Class";
  createdAt?: string;
  createdBy?: {
    fullName?: string;
  };
}

interface TeacherAnnouncementsWidgetProps {
  announcements?: AnnouncementItem[];
  loading?: boolean;
}

export const TeacherAnnouncementsWidget: React.FC<TeacherAnnouncementsWidgetProps> = React.memo(
  ({ announcements = [], loading = false }) => {
    const getScopeTag = (scope?: string) => {
      switch (scope) {
        case "System":
          return <Tag color="volcano">Hệ thống</Tag>;
        case "Course":
          return <Tag color="geekblue">Khóa học</Tag>;
        case "Class":
          return <Tag color="green">Lớp học</Tag>;
        default:
          return <Tag color="blue">{scope || "Chung"}</Tag>;
      }
    };

    return (
      <Card
        loading={loading}
        title={
          <Space>
            <NotificationOutlined style={{ color: "#722ed1" }} />
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Thông báo mới nhất
            </Title>
          </Space>
        }
        style={{ borderRadius: 12, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        styles={{ body: { padding: "12px 20px" } }}
      >
        {announcements.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={announcements.slice(0, 5)}
            renderItem={(item) => (
              <List.Item style={{ padding: "12px 0" }}>
                <List.Item.Meta
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <Text strong style={{ fontSize: 14 }}>
                        {item.title}
                      </Text>
                      {getScopeTag(item.scope)}
                    </div>
                  }
                  description={
                    <div>
                      <Paragraph
                        ellipsis={{ rows: 2 }}
                        style={{ margin: "4px 0 6px", fontSize: 13, color: "#595959" }}
                      >
                        {item.content}
                      </Paragraph>
                      <Space size={12} style={{ fontSize: 12, color: "#8c8c8c" }}>
                        {item.createdBy?.fullName && <span>Bởi: {item.createdBy.fullName}</span>}
                        {item.createdAt && (
                          <Space size={4}>
                            <ClockCircleOutlined />
                            <span>{new Date(item.createdAt).toLocaleDateString("vi-VN")}</span>
                          </Space>
                        )}
                      </Space>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<Text type="secondary">Chưa có thông báo nào mới.</Text>}
          />
        )}
      </Card>
    );
  }
);

TeacherAnnouncementsWidget.displayName = "TeacherAnnouncementsWidget";
