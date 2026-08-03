import React from "react";
import { Card, Timeline, Typography, Tag, Skeleton, Empty } from "antd";
import {
  UserAddOutlined,
  UserSwitchOutlined,
  BookOutlined,
  RobotOutlined,
  VideoCameraOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import type { NotificationRecord } from "../../notification/notifications.mock";

const { Title, Text } = Typography;

interface RecentActivitiesProps {
  activities: NotificationRecord[];
  loading?: boolean;
}

const getActivityIcon = (type: NotificationRecord["type"]) => {
  switch (type) {
    case "student_registered":
      return <UserAddOutlined style={{ color: "var(--color-action-primary-bg)", fontSize: "16px" }} />;
    case "teacher_assigned":
      return <UserSwitchOutlined style={{ color: "var(--color-warning-base)", fontSize: "16px" }} />;
    case "course_created":
      return <BookOutlined style={{ color: "var(--color-success-base)", fontSize: "16px" }} />;
    case "ai_generated":
      return <RobotOutlined style={{ color: "var(--color-accent-base)", fontSize: "16px" }} />;
    case "live_started":
      return <VideoCameraOutlined style={{ color: "var(--color-error-base)", fontSize: "16px" }} />;
    default:
      return <BellOutlined style={{ color: "var(--color-secondary-icon)", fontSize: "16px" }} />;
  }
};

export const RecentActivities: React.FC<RecentActivitiesProps> = ({ activities, loading }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      style={{ height: "100%" }}
    >
      <Card
        variant="borderless"
        style={{
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          border: "1px solid var(--color-border-default)",
          height: "100%",
        }}
        styles={{ body: { padding: "24px" } }}
      >
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Hoạt động gần đây ⚡
            </Title>
            <Text type="secondary" style={{ fontSize: "13px" }}>
              Nhật ký sự kiện thời gian thực của hệ thống
            </Text>
          </div>
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 6 }} />
        ) : activities.length === 0 ? (
          <Empty description="Chưa có hoạt động mới" />
        ) : (
          <Timeline
            style={{ marginTop: 12 }}
            items={activities.map((item) => ({
              dot: (
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    backgroundColor: "var(--color-bg-page)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                  }}
                >
                  {getActivityIcon(item.type)}
                </div>
              ),
              children: (
                <div
                  style={{
                    marginBottom: 16,
                    cursor: item.targetUrl ? "pointer" : "default",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    transition: "background-color var(--duration-fast) var(--ease-out)",
                  }}
                  onClick={() => item.targetUrl && navigate(item.targetUrl)}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontWeight: 600, color: "var(--color-text-title)" }}>{item.title}</Text>
                    <Tag style={{ fontSize: "11px", borderRadius: "4px", margin: 0 }}>
                      {item.timestamp}
                    </Tag>
                  </div>
                  <Text
                    type="secondary"
                    style={{ fontSize: "13px", display: "block", marginTop: 4 }}
                  >
                    {item.description}
                  </Text>
                </div>
              ),
            }))}
          />
        )}
      </Card>
    </motion.div>
  );
};
