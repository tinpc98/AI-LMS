import React from "react";
import { Tag } from "antd";
import {
  VideoCameraOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  StopOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { StudentLiveSessionStatus } from "../../../../types/studentLive";

interface SessionStatusTagProps {
  status: StudentLiveSessionStatus;
}

export const SessionStatusTag: React.FC<SessionStatusTagProps> = React.memo(({ status }) => {
  switch (status) {
    case "Live":
      return (
        <Tag
          color="error"
          icon={<VideoCameraOutlined className="animate-pulse" />}
          style={{ borderRadius: 8, fontWeight: 700 }}
        >
          🔴 ĐANG DIỄN RA
        </Tag>
      );
    case "Upcoming":
      return (
        <Tag
          color="processing"
          icon={<ClockCircleOutlined />}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Sắp diễn ra
        </Tag>
      );
    case "Completed":
      return (
        <Tag
          color="success"
          icon={<CheckCircleOutlined />}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Đã kết thúc
        </Tag>
      );
    case "Cancelled":
      return (
        <Tag color="warning" icon={<StopOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>
          Đã hủy buổi học
        </Tag>
      );
    case "Missed":
      return (
        <Tag
          color="red"
          icon={<CloseCircleOutlined />}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Đã bỏ lỡ
        </Tag>
      );
    default:
      return <Tag color="default">{status}</Tag>;
  }
});

SessionStatusTag.displayName = "SessionStatusTag";

export default SessionStatusTag;
