import React from "react";
import { Tag } from "antd";
import {
  PushpinOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
  FormOutlined,
  NotificationOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import type { AnnouncementTagType } from "../../../../types/studentAnnouncement";

interface AnnouncementTagProps {
  type?: AnnouncementTagType;
}

export const AnnouncementTag: React.FC<AnnouncementTagProps> = React.memo(({ type = "General" }) => {
  switch (type) {
    case "Pinned":
      return (
        <Tag color="volcano" icon={<PushpinOutlined />} style={{ borderRadius: 8, fontWeight: 700 }}>
          📌 Thông báo ghim
        </Tag>
      );
    case "Important":
      return (
        <Tag color="red" icon={<ThunderboltOutlined />} style={{ borderRadius: 8, fontWeight: 700 }}>
          ⚡ Quan trọng
        </Tag>
      );
    case "Assignment":
      return (
        <Tag color="blue" icon={<FileTextOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>
          Bài tập mới
        </Tag>
      );
    case "Exam":
      return (
        <Tag color="purple" icon={<FormOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>
          Kỳ thi / Kiểm tra
        </Tag>
      );
    case "System":
      return (
        <Tag color="default" icon={<SettingOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>
          Hệ thống
        </Tag>
      );
    case "General":
    default:
      return (
        <Tag color="cyan" icon={<NotificationOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>
          Thông báo chung
        </Tag>
      );
  }
});

AnnouncementTag.displayName = "AnnouncementTag";

export default AnnouncementTag;
