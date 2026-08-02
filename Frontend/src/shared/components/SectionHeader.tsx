import React from "react";
import { Typography } from "antd";

const { Text } = Typography;

interface SectionHeaderProps {
  /** Emoji hiển thị trước tiêu đề, ví dụ "📌" */
  emoji?: string;
  /** Tiêu đề chính của section */
  title: string;
  /** Mô tả phụ bên dưới tiêu đề, không bắt buộc */
  subtitle?: string;
  /** Slot action bên phải (link "Xem tất cả", nút refresh...) */
  action?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Section header dùng chung cho cả Student và Teacher portal.
 * Thay thế các SectionLabel nội bộ viết tay.
 */
export const SectionHeader: React.FC<SectionHeaderProps> = React.memo(
  ({ emoji, title, subtitle, action, style }) => (
    <div
      style={{
        marginBottom: 16,
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "space-between",
        ...style,
      }}
    >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {emoji && <span style={{ fontSize: 18 }}>{emoji}</span>}
          <Text strong style={{ fontSize: 18, color: "#1f2937", lineHeight: 1.2 }}>
            {title}
          </Text>
        </div>
        {subtitle && (
          <Text
            style={{
              fontSize: 13,
              color: "#9ca3af",
              marginLeft: emoji ? 26 : 0,
              display: "block",
              marginTop: 2,
            }}
          >
            {subtitle}
          </Text>
        )}
      </div>

      {action && (
        <div style={{ flexShrink: 0, marginTop: 2 }}>{action}</div>
      )}
    </div>
  )
);

SectionHeader.displayName = "SectionHeader";

export default SectionHeader;
