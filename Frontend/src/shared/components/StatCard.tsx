import React from "react";
import { Card, Statistic, Typography } from "antd";
import { tokens as staticTokens } from "../theme/tokens";
import { useTheme } from "../context/ThemeContext";

const { Text } = Typography;

interface StatCardProps {
  /** Nhãn hiển thị trên đầu card, ví dụ "Lớp phụ trách" */
  label: string;
  /** Giá trị số hoặc chuỗi chính */
  value: number | string;
  /** Đơn vị đứng sau value, ví dụ "lớp", "học sinh" */
  suffix?: string;
  /** Mô tả phụ nhỏ bên dưới value */
  description?: string;
  /** Icon hiển thị cùng value (AntD icon element) */
  icon?: React.ReactNode;
  /** Màu accent cho viền trái và icon, mặc định primary */
  accentColor?: string;
  /** Badge hiển thị cạnh label (số đếm cần hành động, trạng thái LIVE...) */
  badge?: React.ReactNode;
  /** Màu riêng cho chữ value, ghi đè mặc định */
  valueColor?: string;
  loading?: boolean;
  style?: React.CSSProperties;
}

/**
 * Stat card dùng chung cho Teacher portal (và các nơi hiển thị số đếm đơn giản).
 * Chuẩn thị giác: viền trái 4px màu accent, Ant Design Statistic.
 */
export const StatCard: React.FC<StatCardProps> = React.memo(
  ({
    label,
    value,
    suffix,
    description,
    icon,
    accentColor,
    badge,
    valueColor,
    loading = false,
    style,
  }) => {
    const { tokens, isDark } = useTheme();
    const resolvedAccentColor = accentColor || tokens.color.action.primaryBg;

    return (
      <Card
        loading={loading}
        hoverable
        style={{
          borderRadius: tokens.radius.none,
          borderLeft: `4px solid ${resolvedAccentColor}`,
          boxShadow: isDark ? "none" : "0 2px 8px rgba(0,0,0,0.06)",
          transition: "var(--transition-fast)",
          ...style,
        }}
        styles={{ body: { padding: `${tokens.space[4]}px ${tokens.space[5]}px` } }}
      >
        <Statistic
          title={
            badge ? (
              <div style={{ display: "flex", alignItems: "center", gap: tokens.space[2] }}>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  {label}
                </Text>
                {badge}
              </div>
            ) : (
              <Text type="secondary" style={{ fontSize: 13 }}>
                {label}
              </Text>
            )
          }
          value={value}
          suffix={suffix}
          prefix={
            icon ? (
              <span style={{ marginRight: tokens.space[2], color: resolvedAccentColor }}>{icon}</span>
            ) : undefined
          }
          valueStyle={{ fontWeight: 700, fontSize: 24, color: valueColor }}
        />

        {description && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {description}
          </Text>
        )}
      </Card>
    );
  }
);

StatCard.displayName = "StatCard";

export default StatCard;
