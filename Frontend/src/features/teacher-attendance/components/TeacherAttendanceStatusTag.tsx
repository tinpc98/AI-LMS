import React from "react";
import type { TeacherAttendanceStatus } from "../../../types/teacherAttendance";
import StatusBadge from "../../../shared/components/StatusBadge";
import { CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from "@ant-design/icons";

interface Props {
  status: TeacherAttendanceStatus;
}

export const TeacherAttendanceStatusTag: React.FC<Props> = ({ status }) => {
  switch (status) {
    case "CONFIRMED":
      return <StatusBadge tone="success" label="Đã xác nhận" icon={<CheckCircleOutlined />} />;
    case "PENDING":
      return <StatusBadge tone="warning" label="Chờ xác nhận" icon={<ClockCircleOutlined />} />;
    case "ABSENT":
      return <StatusBadge tone="danger" label="Vắng mặt" icon={<ExclamationCircleOutlined />} />;
    default:
      return <StatusBadge tone="neutral" label={status || "Không rõ"} />;
  }
};

export default TeacherAttendanceStatusTag;
