import React from "react";
import { Tag } from "antd";
import type { PayrollStatus, PayrollPeriodStatus } from "../../../types/payroll";

const PAYROLL_STATUS_CONFIG: Record<
  PayrollStatus,
  { color: string; label: string }
> = {
  DRAFT:      { color: "default",   label: "Nháp" },
  CALCULATED: { color: "blue",      label: "Đã tính" },
  CONFIRMED:  { color: "gold",      label: "Đã xác nhận" },
  PAID:       { color: "green",     label: "Đã thanh toán" },
  LOCKED:     { color: "red",       label: "Đã khóa" },
};

const PERIOD_STATUS_CONFIG: Record<
  PayrollPeriodStatus,
  { color: string; label: string }
> = {
  OPEN:       { color: "cyan",      label: "Đang mở" },
  CALCULATED: { color: "blue",      label: "Đã tính" },
  CONFIRMED:  { color: "gold",      label: "Đã xác nhận" },
  PAID:       { color: "green",     label: "Đã thanh toán" },
  LOCKED:     { color: "red",       label: "Đã khóa" },
};

interface PayrollStatusTagProps {
  status: PayrollStatus;
}

interface PayrollPeriodStatusTagProps {
  status: PayrollPeriodStatus;
}

export const PayrollStatusTag: React.FC<PayrollStatusTagProps> = ({ status }) => {
  const config = PAYROLL_STATUS_CONFIG[status] ?? { color: "default", label: status };
  return <Tag color={config.color}>{config.label}</Tag>;
};

export const PayrollPeriodStatusTag: React.FC<PayrollPeriodStatusTagProps> = ({ status }) => {
  const config = PERIOD_STATUS_CONFIG[status] ?? { color: "default", label: status };
  return <Tag color={config.color}>{config.label}</Tag>;
};

export default PayrollStatusTag;
