import React from "react";
import { Avatar } from "antd";
import {
  FileTextOutlined,
  FormOutlined,
  BarChartOutlined,
  CalendarOutlined,
  NotificationOutlined,
  VideoCameraOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { NotificationCategory } from "../../../types/studentNotification";

interface NotificationIconProps {
  category: NotificationCategory;
  size?: number;
}

export const NotificationIcon: React.FC<NotificationIconProps> = React.memo(
  ({ category, size = 40 }) => {
    switch (category) {
      case "assignment":
        return (
          <Avatar
            size={size}
            icon={<FileTextOutlined />}
            style={{ backgroundColor: "#1890ff", color: "#fff", flexShrink: 0 }}
          />
        );
      case "exam":
        return (
          <Avatar
            size={size}
            icon={<FormOutlined />}
            style={{ backgroundColor: "#722ed1", color: "#fff", flexShrink: 0 }}
          />
        );
      case "grade":
        return (
          <Avatar
            size={size}
            icon={<BarChartOutlined />}
            style={{ backgroundColor: "#52c41a", color: "#fff", flexShrink: 0 }}
          />
        );
      case "attendance":
        return (
          <Avatar
            size={size}
            icon={<CalendarOutlined />}
            style={{ backgroundColor: "#fa8c16", color: "#fff", flexShrink: 0 }}
          />
        );
      case "announcement":
        return (
          <Avatar
            size={size}
            icon={<NotificationOutlined />}
            style={{ backgroundColor: "#13c2c2", color: "#fff", flexShrink: 0 }}
          />
        );
      case "live":
        return (
          <Avatar
            size={size}
            icon={<VideoCameraOutlined />}
            style={{ backgroundColor: "#ff4d4f", color: "#fff", flexShrink: 0 }}
          />
        );
      case "system":
      default:
        return (
          <Avatar
            size={size}
            icon={<SettingOutlined />}
            style={{ backgroundColor: "#8c8c8c", color: "#fff", flexShrink: 0 }}
          />
        );
    }
  }
);

NotificationIcon.displayName = "NotificationIcon";

export default NotificationIcon;
