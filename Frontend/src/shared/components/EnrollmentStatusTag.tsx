import React from "react";
import { StatusBadge } from "./StatusBadge";

export type EnrollmentStatus = "PENDING_PAYMENT" | "APPROVED" | "COMPLETED" | "CANCELLED" | string;

interface EnrollmentStatusTagProps {
  status?: EnrollmentStatus;
  style?: React.CSSProperties;
}

export const EnrollmentStatusTag: React.FC<EnrollmentStatusTagProps> = ({ status, style }) => {
  let label = "Không rõ";
  let tone: "success" | "warning" | "danger" | "info" | "neutral" = "neutral";

  switch (status?.toUpperCase()) {
    case "PENDING_PAYMENT":
      label = "Chờ thanh toán";
      tone = "warning";
      break;
    case "PAYMENT_PENDING_CONFIRMATION":
      label = "Đang chờ xác nhận";
      tone = "info";
      break;
    case "APPROVED":
      label = "Đã xác nhận";
      tone = "success";
      break;
    case "COMPLETED":
      label = "Đã hoàn thành";
      tone = "info";
      break;
    case "CANCELLED":
      label = "Đã hủy";
      tone = "danger";
      break;
    default:
      label = status || "Không rõ";
      tone = "neutral";
  }

  return <StatusBadge tone={tone} label={label} style={style} />;
};

export default EnrollmentStatusTag;
