import React from "react";
import { Tag } from "antd";
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  SyncOutlined,
  CheckCircleOutlined,
  LockOutlined,
} from "@ant-design/icons";
import type { StudentExamStatus } from "../../../types/studentExam";

interface ExamStatusTagProps {
  status: StudentExamStatus;
}

export const ExamStatusTag: React.FC<ExamStatusTagProps> = React.memo(({ status }) => {
  switch (status) {
    case "Available":
      return (
        <Tag color="processing" icon={<PlayCircleOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>
          Đang mở thi
        </Tag>
      );
    case "In Progress":
      return (
        <Tag color="warning" icon={<SyncOutlined spin />} style={{ borderRadius: 8, fontWeight: 600 }}>
          Đang làm dở dang
        </Tag>
      );
    case "Completed":
      return (
        <Tag color="purple" icon={<CheckCircleOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>
          Đã hoàn thành
        </Tag>
      );
    case "Expired":
      return (
        <Tag color="default" icon={<LockOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>
          Đã đóng / Khóa
        </Tag>
      );
    case "Upcoming":
    default:
      return (
        <Tag color="cyan" icon={<ClockCircleOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>
          Sắp diễn ra
        </Tag>
      );
  }
});

ExamStatusTag.displayName = "ExamStatusTag";

export default ExamStatusTag;
