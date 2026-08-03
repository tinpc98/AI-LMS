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
            style={{ backgroundColor: "var(--color-action-primary-bg)", color: "var(--color-surface)", flexShrink: 0 }}
          />
        );
      case "exam":
        return (
          <Avatar
            size={size}
            icon={<FormOutlined />}
            style={{ backgroundColor: "var(--color-secondary-icon)", color: "var(--color-surface)", flexShrink: 0 }}
          />
        );
      case "grade":
        return (
          <Avatar
            size={size}
            icon={<BarChartOutlined />}
            style={{ backgroundColor: "var(--color-success-base)", color: "var(--color-surface)", flexShrink: 0 }}
          />
        );
      case "attendance":
        return (
          <Avatar
            size={size}
            icon={<CalendarOutlined />}
            style={{ backgroundColor: "var(--color-warning-base)", color: "var(--color-surface)", flexShrink: 0 }}
          />
        );
      case "announcement":
        return (
          <Avatar
            size={size}
            icon={<NotificationOutlined />}
            style={{ backgroundColor: "var(--color-info-base)", color: "var(--color-surface)", flexShrink: 0 }}
          />
        );
      case "live":
        return (
          <Avatar
            size={size}
            icon={<VideoCameraOutlined />}
            style={{ backgroundColor: "var(--color-error-base)", color: "var(--color-surface)", flexShrink: 0 }}
          />
        );
      case "system":
      default:
        return (
          <Avatar
            size={size}
            icon={<SettingOutlined />}
            style={{ backgroundColor: "var(--color-text-description)", color: "var(--color-surface)", flexShrink: 0 }}
          />
        );
    }
  }
);

NotificationIcon.displayName = "NotificationIcon";

export default NotificationIcon;
