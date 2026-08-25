import React from "react";
import { Tag } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import type { AttendanceStatus } from "../../../../../interface/attendanceInterface";

interface AttendanceStatusTagProps {
  status: AttendanceStatus;
}

export const AttendanceStatusTag: React.FC<AttendanceStatusTagProps> = React.memo(({ status }) => {
  switch (status) {
    case "PRESENT":
      return (
        <Tag
          color="success"
          icon={<CheckCircleOutlined />}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Có mặt
        </Tag>
      );
    case "LATE":
      return (
        <Tag
          color="warning"
          icon={<ClockCircleOutlined />}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Đi muộn
        </Tag>
      );
    case "ABSENT":
      return (
        <Tag
          color="error"
          icon={<CloseCircleOutlined />}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Vắng mặt
        </Tag>
      );
    case "EXCUSED":
      return (
        <Tag
          color="processing"
          icon={<InfoCircleOutlined />}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Nghỉ có phép
        </Tag>
      );
    default:
      return <Tag color="default">{status}</Tag>;
  }
});

AttendanceStatusTag.displayName = "AttendanceStatusTag";

export default AttendanceStatusTag;
