import React from "react";
import { Card, Statistic, Typography } from "antd";

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
  /** Màu accent cho viền trái và icon, mặc định #1890ff */
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
 * Chuẩn thị giác: viền trái 4px màu accent, nền trắng, Ant Design Statistic.
 */
export const StatCard: React.FC<StatCardProps> = React.memo(
  ({
    label,
    value,
    suffix,
    description,
    icon,
    accentColor = "#1890ff",
    badge,
    valueColor,
    loading = false,
    style,
  }) => (
    <Card
      loading={loading}
      hoverable
      style={{
        borderRadius: 12,
        borderLeft: `4px solid ${accentColor}`,
        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
        ...style,
      }}
      styles={{ body: { padding: "16px 20px" } }}
    >
      <Statistic
        title={
          badge ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
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
            <span style={{ marginRight: 8, color: accentColor }}>{icon}</span>
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
  )
);

StatCard.displayName = "StatCard";

export default StatCard;
