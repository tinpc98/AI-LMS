import React from "react";
import { Empty, Button } from "antd";
import { useTheme } from "../context/ThemeContext";

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
    const { tokens } = useTheme();

    return (
      <div
        style={{
          padding: `${tokens.space[7]}px ${tokens.space[5]}px`,
          textAlign: "center",
          backgroundColor: tokens.color.bg.surface,
          borderRadius: tokens.radius.lg,
          border: `1px solid ${tokens.color.border.default}`,
          ...style,
        }}
      >
        <Empty
          image={image}
          description={
            <div>
              {title && (
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 16,
                    color: tokens.color.text.title,
                    marginBottom: tokens.space[1],
                  }}
                >
                  {title}
                </div>
              )}
              <div style={{ color: tokens.color.text.description, fontSize: 14 }}>
                {description}
              </div>
            </div>
          }
        >
          {action ? (
            action
          ) : actionText && onAction ? (
            <Button
              type="primary"
              onClick={onAction}
              style={{ marginTop: tokens.space[3] }}
            >
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
