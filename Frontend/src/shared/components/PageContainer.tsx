import React from "react";
import { Spin } from "antd";
import { tokens } from "../theme/tokens";
import { useResponsiveLayout } from "../hooks/useResponsiveLayout";

interface PageContainerProps {
  title?: React.ReactNode;
  subTitle?: React.ReactNode;
  extra?: React.ReactNode;
  breadcrumb?: React.ReactNode;
  loading?: boolean;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  maxWidth?: number | string;
}

export const PageContainer: React.FC<PageContainerProps> = React.memo(
  ({
    title,
    subTitle,
    extra,
    breadcrumb,
    loading = false,
    children,
    className = "",
    style = {},
    maxWidth = 1400,
  }) => {
    const { isMobile, isTablet } = useResponsiveLayout();

    const paddingValue = isMobile
      ? `${tokens.space[4]}px ${tokens.space[3]}px`
      : isTablet
      ? `${tokens.space[5]}px ${tokens.space[4]}px`
      : `${tokens.space[6]}px ${tokens.space[5]}px`;

    return (
      <div
        className={`page-container ${className}`}
        style={{
          width: "100%",
          maxWidth: maxWidth,
          margin: "0 auto",
          padding: paddingValue,
          boxSizing: "border-box",
          minHeight: "100%",
          ...style,
        }}
      >
        {breadcrumb && <div style={{ marginBottom: tokens.space[4] }}>{breadcrumb}</div>}

        {(title || subTitle || extra) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: tokens.space[4],
              marginBottom: tokens.space[5],
            }}
          >
            <div>
              {title && (
                <h1
                  style={{
                    margin: 0,
                    fontSize: isMobile ? "20px" : "24px",
                    fontWeight: 700,
                    color: tokens.color.text.title,
                    lineHeight: 1.3,
                  }}
                >
                  {title}
                </h1>
              )}
              {subTitle && (
                <div
                  style={{
                    marginTop: tokens.space[1],
                    color: tokens.color.text.description,
                    fontSize: "14px",
                  }}
                >
                  {subTitle}
                </div>
              )}
            </div>
            {extra && <div style={{ display: "flex", gap: 12, alignItems: "center" }}>{extra}</div>}
          </div>
        )}

        <Spin spinning={loading} size="large" tip="Đang tải dữ liệu...">
          {children}
        </Spin>
      </div>
    );
  }
);

PageContainer.displayName = "PageContainer";

export default PageContainer;

