import React from "react";
import { Tag } from "antd";
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  TrophyOutlined,
  CloseCircleOutlined,
} from "@ant-design/icons";
import type { StudentAssignmentStatus } from "../../../../../types/studentAssignment";

interface AssignmentStatusTagProps {
  status: StudentAssignmentStatus;
}

export const AssignmentStatusTag: React.FC<AssignmentStatusTagProps> = React.memo(({ status }) => {
  switch (status) {
    case "Submitted":
      return (
        <Tag
          color="success"
          icon={<CheckCircleOutlined />}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Đã nộp bài
        </Tag>
      );
    case "Graded":
      return (
        <Tag color="purple" icon={<TrophyOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>
          Đã chấm điểm
        </Tag>
      );
    case "Late":
      return (
        <Tag
          color="error"
          icon={<ExclamationCircleOutlined />}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Nộp trễ hạn
        </Tag>
      );
    case "Missing":
      return (
        <Tag
          color="default"
          icon={<CloseCircleOutlined />}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Quá hạn chưa nộp
        </Tag>
      );
    case "Pending":
    default:
      return (
        <Tag
          color="warning"
          icon={<ClockCircleOutlined />}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Chưa nộp bài
        </Tag>
      );
  }
});

AssignmentStatusTag.displayName = "AssignmentStatusTag";

export default AssignmentStatusTag;
