import React from "react";
import { Spin } from "antd";

interface LoadingProps {
  tip?: string;
  fullScreen?: boolean;
  minHeight?: number | string;
}

export const Loading: React.FC<LoadingProps> = React.memo(
  ({ tip = "Đang tải dữ liệu...", fullScreen = false, minHeight = "300px" }) => {
    if (fullScreen) {
      return (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            zIndex: 9999,
          }}
        >
          <Spin size="large" tip={tip} />
        </div>
      );
    }

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: minHeight,
          width: "100%",
        }}
      >
        <Spin size="large" tip={tip} />
      </div>
    );
  }
);

Loading.displayName = "Loading";

export default Loading;
