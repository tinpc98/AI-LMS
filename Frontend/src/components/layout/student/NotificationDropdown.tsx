import React from "react";
import { Popover, List, Typography, Badge, Button, Skeleton, Space, Avatar } from "antd";
import {
  BellOutlined,
  VideoCameraOutlined,
  InfoCircleOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import type { INotificationItem } from "../../../types/studentNotification";

const { Text } = Typography;

interface NotificationDropdownProps {
  notifications: INotificationItem[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  loading,
  markAsRead,
  markAllAsRead,
}) => {
  const navigate = useNavigate();

  const handleNotificationClick = (notif: INotificationItem) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }
    if (notif.targetRoute) {
      navigate(notif.targetRoute);
    }
  };

  const content = (
    <div style={{ width: 360, maxHeight: 500, overflowY: "auto", overflowX: "hidden" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #f0f0f0",
          position: "sticky",
          top: 0,
          background: "#fff",
          zIndex: 2,
        }}
      >
        <Text strong>Thông báo</Text>
        <Button
          type="link"
          size="small"
          onClick={markAllAsRead}
          disabled={unreadCount === 0 || loading}
          icon={<CheckOutlined />}
        >
          Đánh dấu đã đọc
        </Button>
      </div>

      {loading && notifications.length === 0 ? (
        <div style={{ padding: 16 }}>
          <Skeleton avatar title={false} paragraph={{ rows: 2 }} active />
          <Skeleton avatar title={false} paragraph={{ rows: 2 }} active />
        </div>
      ) : notifications.length === 0 ? (
        <div style={{ padding: 32, textAlign: "center" }}>
          <Text type="secondary">Chưa có thông báo nào</Text>
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={notifications.slice(0, 10)} // Hiển thị tối đa 10
          renderItem={(item) => (
            <List.Item
              onClick={() => handleNotificationClick(item)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                background: item.isRead ? "#fff" : "#e6f7ff",
                borderBottom: "1px solid #f0f0f0",
                transition: "background 0.3s",
              }}
              className="notification-item"
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={
                      item.category === "live" ? <VideoCameraOutlined /> : <InfoCircleOutlined />
                    }
                    style={{ backgroundColor: item.category === "live" ? "#52c41a" : "#1890ff" }}
                  />
                }
                title={
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <Text strong style={{ fontSize: 14 }}>
                      {item.title}
                    </Text>
                    {!item.isRead && <Badge dot color="blue" />}
                  </div>
                }
                description={
                  <Space direction="vertical" size={2} style={{ width: "100%" }}>
                    <Text style={{ fontSize: 13, color: "#595959" }}>
                      {item.description || item.title}
                    </Text>

                    {item.className && (
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Lớp: <Text strong>{item.className}</Text>
                      </Text>
                    )}

                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {formatDistanceToNow(new Date(item.createdAt), {
                        addSuffix: true,
                        locale: vi,
                      })}
                    </Text>

                    {item.category === "live" && item.targetRoute && (
                      <Button
                        type="primary"
                        size="small"
                        style={{ marginTop: 8 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleNotificationClick(item);
                        }}
                      >
                        Tham gia ngay
                      </Button>
                    )}
                  </Space>
                }
              />
            </List.Item>
          )}
        />
      )}

      <div
        style={{
          textAlign: "center",
          padding: "12px",
          borderTop: "1px solid #f0f0f0",
          position: "sticky",
          bottom: 0,
          background: "#fff",
          zIndex: 2,
        }}
      >
        <Button type="link" onClick={() => navigate("/student/notification")}>
          Xem tất cả thông báo
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      content={content}
      trigger="click"
      placement="bottomRight"
      overlayInnerStyle={{ padding: 0 }}
      arrow={false}
    >
      <Badge count={unreadCount} size="small" overflowCount={99}>
        <Button
          type="text"
          shape="circle"
          icon={<BellOutlined style={{ fontSize: 18, color: "#595959" }} />}
        />
      </Badge>
    </Popover>
  );
};
