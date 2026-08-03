import React from "react";
import { Typography } from "antd";
import { useTheme } from "../context/ThemeContext";

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
  ({ emoji, title, subtitle, action, style }) => {
    const { tokens } = useTheme();

    return (
      <div
        style={{
          marginBottom: tokens.space[4],
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          ...style,
        }}
      >
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: tokens.space[2] }}>
          {emoji && <span style={{ fontSize: 18 }}>{emoji}</span>}
          <Text strong style={{ fontSize: 18, color: tokens.color.text.title, lineHeight: 1.2 }}>
            {title}
          </Text>
        </div>
        {subtitle && (
          <Text
            style={{
              fontSize: 13,
              color: tokens.color.text.description,
              marginLeft: emoji ? 28 : 0,
              display: "block",
              marginTop: tokens.space[1],
            }}
          >
            {subtitle}
          </Text>
        )}
      </div>

      {action && (
        <div style={{ flexShrink: 0, marginTop: tokens.space[1] }}>{action}</div>
      )}
      </div>
    );
  }
);

SectionHeader.displayName = "SectionHeader";

export default SectionHeader;
