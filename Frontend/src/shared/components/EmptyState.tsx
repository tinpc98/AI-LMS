import React from "react";
import { Empty, Button } from "antd";

interface EmptyStateProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  action?: React.ReactNode;
  image?: React.ReactNode;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = React.memo(
  ({
    title,
    description = "Không có dữ liệu hiển thị",
    actionText,
    onAction,
    action,
    image = Empty.PRESENTED_IMAGE_SIMPLE,
    style = {},
  }) => {
    return (
      <div
        style={{
          padding: "48px 24px",
          textAlign: "center",
          backgroundColor: "#fff",
          borderRadius: 12,
          border: "1px solid #f0f0f0",
          ...style,
        }}
      >
        <Empty
          image={image}
          description={
            <div>
              {title && (
                <div style={{ fontWeight: 600, fontSize: 16, color: "#1f2937", marginBottom: 4 }}>
                  {title}
                </div>
              )}
              <div style={{ color: "#6b7280", fontSize: 14 }}>{description}</div>
            </div>
          }
        >
          {action ? (
            action
          ) : actionText && onAction ? (
            <Button type="primary" onClick={onAction} style={{ marginTop: 12 }}>
              {actionText}
            </Button>
          ) : null}
        </Empty>
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

export default EmptyState;
