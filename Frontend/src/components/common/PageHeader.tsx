import React from "react";
import { Typography, Space } from "antd";

const { Title, Text } = Typography;

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  extra?: React.ReactNode;
  avatar?: React.ReactNode;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

export const PageHeader: React.FC<PageHeaderProps> = React.memo(
  ({ title, description, extra, avatar, children, style = {} }) => {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          padding: "20px 24px",
          borderRadius: 12,
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          border: "1px solid #f0f0f0",
          marginBottom: 24,
          ...style,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <Space size={16} align="center">
            {avatar}
            <div>
              {typeof title === "string" ? (
                <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#1f2937" }}>
                  {title}
                </Title>
              ) : (
                title
              )}
              {description && (
                <Text type="secondary" style={{ fontSize: 14, marginTop: 4, display: "block" }}>
                  {description}
                </Text>
              )}
            </div>
          </Space>
          {extra && <Space size={12}>{extra}</Space>}
        </div>
        {children && <div style={{ marginTop: 16 }}>{children}</div>}
      </div>
    );
  }
);

PageHeader.displayName = "PageHeader";

export default PageHeader;
