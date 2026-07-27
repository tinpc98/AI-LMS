import React from "react";
import { Spin } from "antd";

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
    return (
      <div
        className={`page-container ${className}`}
        style={{
          width: "100%",
          maxWidth: maxWidth,
          margin: "0 auto",
          padding: "24px",
          boxSizing: "border-box",
          minHeight: "100%",
          ...style,
        }}
      >
        {breadcrumb && <div style={{ marginBottom: 16 }}>{breadcrumb}</div>}

        {(title || subTitle || extra) && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
              marginBottom: 24,
            }}
          >
            <div>
              {title && (
                <h1
                  style={{
                    margin: 0,
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "#1f2937",
                    lineHeight: 1.3,
                  }}
                >
                  {title}
                </h1>
              )}
              {subTitle && (
                <div style={{ marginTop: 4, color: "#6b7280", fontSize: "14px" }}>
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
