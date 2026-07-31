import React from "react";
import { Tag } from "antd";
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  CloseCircleOutlined,
  StarOutlined,
} from "@ant-design/icons";
import type { GradeStatus } from "../../../../types/studentGrade";

interface GradeStatusTagProps {
  status: GradeStatus;
}

export const GradeStatusTag: React.FC<GradeStatusTagProps> = React.memo(({ status }) => {
  switch (status) {
    case "Graded":
      return (
        <Tag
          color="success"
          icon={<CheckCircleOutlined />}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Đã chấm điểm
        </Tag>
      );
    case "Pending":
      return (
        <Tag
          color="warning"
          icon={<ClockCircleOutlined />}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Chờ chấm điểm
        </Tag>
      );
    case "Not Submitted":
      return (
        <Tag
          color="orange"
          icon={<ExclamationCircleOutlined />}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Chưa nộp bài
        </Tag>
      );
    case "Missing":
      return (
        <Tag
          color="error"
          icon={<CloseCircleOutlined />}
          style={{ borderRadius: 8, fontWeight: 600 }}
        >
          Bỏ lỡ deadline
        </Tag>
      );
    case "Excused":
      return (
        <Tag color="purple" icon={<StarOutlined />} style={{ borderRadius: 8, fontWeight: 600 }}>
          Miễn chấm
        </Tag>
      );
    default:
      return <Tag color="default">{status}</Tag>;
  }
});

GradeStatusTag.displayName = "GradeStatusTag";

export default GradeStatusTag;
