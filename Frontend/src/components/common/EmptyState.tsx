import React from "react";
import { Empty, Button } from "antd";

interface EmptyStateProps {
  description?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
  image?: React.ReactNode;
  style?: React.CSSProperties;
}

export const EmptyState: React.FC<EmptyStateProps> = React.memo(
  ({
    description = "Không có dữ liệu hiển thị",
    actionText,
    onAction,
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
        <Empty image={image} description={description}>
          {actionText && onAction && (
            <Button type="primary" onClick={onAction} style={{ marginTop: 12 }}>
              {actionText}
            </Button>
          )}
        </Empty>
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

export default EmptyState;
