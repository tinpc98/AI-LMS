import React from "react";
import { Typography, Button, Space, Badge } from "antd";
import { BellOutlined, CheckOutlined, ReloadOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface NotificationHeaderProps {
  unreadCount: number;
  onMarkAllAsRead: () => void;
  onRefresh: () => void;
  loading?: boolean;
}

export const NotificationHeader: React.FC<NotificationHeaderProps> = React.memo(
  ({ unreadCount, onMarkAllAsRead, onRefresh, loading }) => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <Space size={10} align="center">
            <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#1f2937" }}>
              🔔 Notification Center
            </Title>
            {unreadCount > 0 && (
              <Badge
                count={unreadCount}
                overflowCount={99}
                style={{ backgroundColor: "#1890ff" }}
              />
            )}
          </Space>
          <Text type="secondary" style={{ fontSize: 13, display: "block", marginTop: 4 }}>
            Tất cả thông báo học tập, sự kiện lớp học và cập nhật từ hệ thống của bạn.
          </Text>
        </div>

        <Space size={10}>
          <Button
            type="default"
            icon={<ReloadOutlined spin={loading} />}
            onClick={onRefresh}
            style={{ borderRadius: 8 }}
          >
            Làm mới
          </Button>

          <Button
            type="primary"
            icon={<CheckOutlined />}
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
            style={{ borderRadius: 8 }}
          >
            Đánh dấu tất cả đã đọc
          </Button>
        </Space>
      </div>
    );
  }
);

NotificationHeader.displayName = "NotificationHeader";

export default NotificationHeader;
