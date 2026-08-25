import React from "react";
import { StatusBadge } from "./StatusBadge";

export type PaymentStatus = "PENDING" | "PAID" | "CANCELLED" | "REFUNDED" | string;

interface PaymentStatusTagProps {
  status?: PaymentStatus;
  style?: React.CSSProperties;
}

export const PaymentStatusTag: React.FC<PaymentStatusTagProps> = ({ status, style }) => {
  let label = "Không rõ";
  let tone: "success" | "warning" | "danger" | "info" | "neutral" = "neutral";

  switch (status?.toUpperCase()) {
    case "PENDING":
      label = "Đang chờ xác nhận";
      tone = "warning";
      break;
    case "PAID":
      label = "Đã thanh toán";
      tone = "success";
      break;
    case "CANCELLED":
      label = "Đã hủy";
      tone = "danger";
      break;
    case "REFUNDED":
      label = "Đã hoàn tiền";
      tone = "info";
      break;
    default:
      label = status || "Không rõ";
      tone = "neutral";
  }

  return <StatusBadge tone={tone} label={label} style={style} />;
};

export default PaymentStatusTag;
