import React from "react";
import { Tag } from "antd";
import {
  ExclamationCircleOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  VideoCameraOutlined,
  PauseCircleOutlined,
  InfoCircleOutlined,
  MinusCircleOutlined,
  SyncOutlined,
  BookOutlined,
  NotificationOutlined,
  HomeOutlined,
} from "@ant-design/icons";
import { tokens } from "../theme/tokens";

import { useTheme } from "../context/ThemeContext";
import type { DesignTokens } from "../theme/tokens";

// ─── Semantic Tones ────────────────────────────────────────────────────────────
export type StatusTone = "success" | "warning" | "danger" | "info" | "neutral";

// Legacy variant alias for backward compatibility
export type StatusVariant =
  | "overdue"
  | "upcoming"
  | "submitted"
  | "live"
  | "pending"
  | "system"
  | "course"
  | "class";

interface ToneConfig {
  bg: string;
  border: string;
  text: string;
  icon: React.ReactNode;
  defaultLabel: string;
}

const getToneConfig = (tokens: DesignTokens, isDark: boolean): Record<StatusTone, ToneConfig> => ({
  success: {
    bg: tokens.color.semantic.success.bg,
    border: isDark ? "rgba(74, 222, 128, 0.3)" : "var(--color-border-default)",
    text: tokens.color.semantic.success.text,
    icon: <CheckCircleOutlined />,
    defaultLabel: "Hoàn thành",
  },
  warning: {
    bg: tokens.color.semantic.warning.bg,
    border: isDark ? "rgba(251, 191, 36, 0.3)" : "var(--color-warning-text)",
    text: tokens.color.semantic.warning.text,
    icon: <ClockCircleOutlined />,
    defaultLabel: "Sắp hết hạn",
  },
  danger: {
    bg: tokens.color.semantic.error.bg,
    border: isDark ? "rgba(248, 113, 113, 0.3)" : "var(--color-error-bg)",
    text: tokens.color.semantic.error.text,
    icon: <ExclamationCircleOutlined />,
    defaultLabel: "Quá hạn",
  },
  info: {
    bg: tokens.color.semantic.info.bg,
    border: isDark ? "rgba(96, 165, 250, 0.3)" : "var(--color-border-primary-tint)",
    text: tokens.color.semantic.info.text,
    icon: <InfoCircleOutlined />,
    defaultLabel: "Thông tin",
  },
  neutral: {
    bg: tokens.color.bg.page,
    border: tokens.color.border.default,
    text: tokens.color.text.description,
    icon: <MinusCircleOutlined />,
    defaultLabel: "Đã kết thúc",
  },
});

const VARIANT_TO_TONE: Record<StatusVariant, { tone: StatusTone; label: string; icon?: React.ReactNode }> = {
  overdue: { tone: "danger", label: "Quá hạn", icon: <ExclamationCircleOutlined /> },
  upcoming: { tone: "warning", label: "Sắp hết hạn", icon: <ClockCircleOutlined /> },
  submitted: { tone: "success", label: "Đã nộp", icon: <CheckCircleOutlined /> },
  live: { tone: "danger", label: "LIVE", icon: <VideoCameraOutlined /> },
  pending: { tone: "warning", label: "Chờ xử lý", icon: <PauseCircleOutlined /> },
  system: { tone: "info", label: "Hệ thống", icon: <NotificationOutlined /> },
  course: { tone: "info", label: "Khóa học", icon: <BookOutlined /> },
  class: { tone: "info", label: "Lớp học", icon: <HomeOutlined /> },
};

/** Map các trạng thái nghiệp vụ phổ biến sang Tone và Label tiếng Việt chuẩn */
export const mapStatusToTone = (
  status?: string
): { tone: StatusTone; label: string; icon?: React.ReactNode } => {
  if (!status) return { tone: "neutral", label: "Không rõ" };

  const s = status.trim().toLowerCase();
  switch (s) {
    // ─── Thành công / Đang hoạt động / Hoàn thành ──────────────────────────
    case "đang học":
    case "enrolled":
      return { tone: "success", label: "Đang học", icon: <CheckCircleOutlined /> };

    case "đã nộp":
    case "submitted":
      return { tone: "success", label: "Đã nộp", icon: <CheckCircleOutlined /> };

    case "đã hoàn thành":
    case "hoàn thành":
    case "completed":
    case "success":
      return { tone: "success", label: "Đã kết thúc", icon: <CheckCircleOutlined /> };

    case "đang hoạt động":
    case "active":
      return { tone: "success", label: "Đang hoạt động", icon: <CheckCircleOutlined /> };

    // ─── Đang diễn ra / Thông tin ──────────────────────────────────────────
    case "ongoing":
    case "đang diễn ra":
      return { tone: "info", label: "Đang diễn ra", icon: <SyncOutlined /> };

    case "in_progress":
      return { tone: "info", label: "Đang làm bài", icon: <SyncOutlined spin /> };

    case "processing":
      return { tone: "info", label: "Đang xử lý", icon: <SyncOutlined spin /> };

    case "transferred":
    case "chuyển lớp":
      return { tone: "info", label: "Chuyển lớp", icon: <InfoCircleOutlined /> };

    // ─── Cảnh báo / Sắp tới / Chờ ──────────────────────────────────────────
    case "ready":
    case "upcoming":
    case "sắp diễn ra":
    case "sắp khai giảng":
      return { tone: "warning", label: "Sắp khai giảng", icon: <ClockCircleOutlined /> };

    case "sắp hết hạn":
    case "sắp đến hạn":
      return { tone: "warning", label: "Sắp hết hạn", icon: <ClockCircleOutlined /> };

    case "late":
    case "nộp muộn":
    case "đi muộn":
      return { tone: "warning", label: "Đi muộn", icon: <ClockCircleOutlined /> };

    case "reserved":
    case "bảo lưu":
      return { tone: "warning", label: "Bảo lưu", icon: <ClockCircleOutlined /> };

    case "tạm dừng":
    case "paused":
    case "pending":
    case "chờ xử lý":
      return { tone: "warning", label: "Chờ xử lý", icon: <PauseCircleOutlined /> };

    // ─── Nguy hiểm / Quá hạn / Hủy / Trực tiếp ─────────────────────────────
    case "live":
      return { tone: "danger", label: "Trực tiếp", icon: <VideoCameraOutlined /> };

    case "quá hạn":
    case "overdue":
      return { tone: "danger", label: "Quá hạn", icon: <ExclamationCircleOutlined /> };

    case "đã hủy":
    case "cancelled":
      return { tone: "danger", label: "Đã hủy", icon: <ExclamationCircleOutlined /> };

    case "dropped":
    case "đã thôi học":
      return { tone: "danger", label: "Đã thôi học", icon: <MinusCircleOutlined /> };

    case "error":
    case "danger":
      return { tone: "danger", label: "Lỗi", icon: <ExclamationCircleOutlined /> };

    // ─── Trung tính / Bản nháp / Lưu trữ ──────────────────────────────────
    case "bản nháp":
    case "draft":
      return { tone: "neutral", label: "Bản nháp", icon: <MinusCircleOutlined /> };

    case "lưu trữ":
    case "archived":
      return { tone: "neutral", label: "Lưu trữ", icon: <MinusCircleOutlined /> };

    case "đã kết thúc":
    case "closed":
    case "inactive":
      return { tone: "neutral", label: "Đã kết thúc", icon: <MinusCircleOutlined /> };

    default:
      return { tone: "neutral", label: status, icon: <MinusCircleOutlined /> };
  }
};

// ─── Props ────────────────────────────────────────────────────────────────────
export interface StatusBadgeProps {
  /** Semantic tone trực tiếp (ưu tiên cao nhất) */
  tone?: StatusTone;
  /** Legacy variant alias */
  variant?: StatusVariant;
  /** Trạng thái nghiệp vụ (tự động map sang Tone & Icon tương ứng) */
  status?: string;
  /** Nhãn hiển thị đè */
  label?: string;
  /** Icon hiển thị đè */
  icon?: React.ReactNode;
  /** true = ẩn icon */
  noIcon?: boolean;
  style?: React.CSSProperties;
}

/**
 * StatusBadge dùng chung cho toàn bộ EduSpace Frontend.
 * Wrapper chuẩn bọc Ant Design Tag với 5 tone màu semantic đạt chuẩn tương phản WCAG AA.
 */
export const StatusBadge: React.FC<StatusBadgeProps> = React.memo(
  ({ tone, variant, status, label, icon, noIcon = false, style }) => {
    const { tokens: currentTokens, isDark } = useTheme();
    const toneConfig = getToneConfig(currentTokens, isDark);

    let resolvedTone: StatusTone = "neutral";
    let resolvedLabel = "";
    let resolvedIcon: React.ReactNode = undefined;

    if (tone) {
      resolvedTone = tone;
      resolvedLabel = label ?? toneConfig[tone].defaultLabel;
      resolvedIcon = icon ?? toneConfig[tone].icon;
    } else if (variant && VARIANT_TO_TONE[variant]) {
      const v = VARIANT_TO_TONE[variant];
      resolvedTone = v.tone;
      resolvedLabel = label ?? v.label;
      resolvedIcon = icon ?? v.icon;
    } else if (status) {
      const m = mapStatusToTone(status);
      resolvedTone = m.tone;
      resolvedLabel = label ?? m.label;
      resolvedIcon = icon ?? m.icon;
    } else {
      resolvedLabel = label ?? "Không rõ";
    }

    const cfg = toneConfig[resolvedTone];

    return (
      <Tag
        icon={noIcon ? undefined : resolvedIcon}
        style={{
          borderRadius: currentTokens.radius.sm,
          backgroundColor: cfg.bg,
          border: `1px solid ${cfg.border}`,
          color: cfg.text,
          fontSize: 12,
          fontWeight: 500,
          padding: `2px ${currentTokens.space[2]}px`,
          margin: 0,
          display: "inline-flex",
          alignItems: "center",
          gap: currentTokens.space[1],
          lineHeight: "18px",
          ...style,
        }}
      >
        {resolvedLabel}
      </Tag>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export default StatusBadge;
