import React from "react";
import { Tag } from "antd";
import type { StudentClassStatus } from "../../../types/studentClass";

interface ClassStatusTagProps {
  status: StudentClassStatus;
  style?: React.CSSProperties;
}

export const ClassStatusTag: React.FC<ClassStatusTagProps> = React.memo(({ status, style = {} }) => {
  switch (status) {
    case "Active":
    case "active":
      return (
        <Tag color="success" style={{ borderRadius: 12, margin: 0, padding: "2px 10px", ...style }}>
          Đang học
        </Tag>
      );
    case "Ready":
      return (
        <Tag color="processing" style={{ borderRadius: 12, margin: 0, padding: "2px 10px", ...style }}>
          Ready (Sẵn sàng)
        </Tag>
      );
    case "Completed":
    case "completed":
      return (
        <Tag color="default" style={{ borderRadius: 12, margin: 0, padding: "2px 10px", ...style }}>
          Hoàn thành
        </Tag>
      );
    case "Paused":
    case "closed":
      return (
        <Tag color="warning" style={{ borderRadius: 12, margin: 0, padding: "2px 10px", ...style }}>
          Tạm dừng
        </Tag>
      );
    default:
      return (
        <Tag color="blue" style={{ borderRadius: 12, margin: 0, padding: "2px 10px", ...style }}>
          {status}
        </Tag>
      );
  }
});

ClassStatusTag.displayName = "ClassStatusTag";

export default ClassStatusTag;
