import React from "react";
import { Tag } from "antd";
import {
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  VideoCameraOutlined,
  PauseCircleOutlined,
  NotificationOutlined,
  BookOutlined,
  HomeOutlined,
} from "@ant-design/icons";

// ─── Variant catalogue ─────────────────────────────────────────────────────────
export type StatusVariant =
  | "overdue"     // Quá hạn — đỏ
  | "upcoming"    // Sắp hết hạn — cam/vàng
  | "submitted"   // Đã nộp — xanh lá
  | "live"        // LIVE đang phát — đỏ
  | "pending"     // Chờ xử lý — xám
  | "system"      // Thông báo hệ thống — volcano
  | "course"      // Thuộc khóa học — geekblue
  | "class";      // Thuộc lớp học — green

interface VariantConfig {
  antColor: string;
  icon?: React.ReactNode;
  defaultLabel: string;
}

const VARIANT_CONFIG: Record<StatusVariant, VariantConfig> = {
  overdue: {
    antColor: "error",
    icon: <ExclamationCircleOutlined />,
    defaultLabel: "Quá hạn",
  },
  upcoming: {
    antColor: "warning",
    icon: <ClockCircleOutlined />,
    defaultLabel: "Sắp hết hạn",
  },
  submitted: {
    antColor: "success",
    icon: <CheckCircleOutlined />,
    defaultLabel: "Đã nộp",
  },
  live: {
    antColor: "error",
    icon: <VideoCameraOutlined />,
    defaultLabel: "LIVE",
  },
  pending: {
    antColor: "default",
    icon: <PauseCircleOutlined />,
    defaultLabel: "Chờ",
  },
  system: {
    antColor: "volcano",
    icon: <NotificationOutlined />,
    defaultLabel: "Hệ thống",
  },
  course: {
    antColor: "geekblue",
    icon: <BookOutlined />,
    defaultLabel: "Khóa học",
  },
  class: {
    antColor: "green",
    icon: <HomeOutlined />,
    defaultLabel: "Lớp học",
  },
};

// ─── Props ────────────────────────────────────────────────────────────────────
interface StatusBadgeProps {
  variant: StatusVariant;
  /** Override nhãn mặc định nếu cần (ví dụ "Trễ 2 ngày") */
  label?: string;
  /** true = bỏ icon, chỉ hiện text */
  noIcon?: boolean;
  style?: React.CSSProperties;
}

/**
 * StatusBadge dùng chung cho cả Student và Teacher portal.
 * Thay thế các Tag AntD inline tô màu thủ công.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = React.memo(
  ({ variant, label, noIcon = false, style }) => {
    const cfg = VARIANT_CONFIG[variant];
    return (
      <Tag
        color={cfg.antColor}
        icon={noIcon ? undefined : cfg.icon}
        style={{
          borderRadius: 8,
          fontSize: 11,
          margin: 0,
          ...style,
        }}
      >
        {label ?? cfg.defaultLabel}
      </Tag>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export default StatusBadge;
