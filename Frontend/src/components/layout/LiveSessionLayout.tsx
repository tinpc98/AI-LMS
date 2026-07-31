import React from "react";
import { Outlet } from "react-router-dom";
import LiveSessionErrorBoundary from "../features/LiveSessionErrorBoundary";

const LiveSessionLayout: React.FC = () => {
  return (
    <LiveSessionErrorBoundary>
      <div
        style={{
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
          backgroundColor: "#000",
          margin: 0,
          padding: 0,
        }}
      >
        <Outlet />
      </div>
    </LiveSessionErrorBoundary>
  );
};

export default LiveSessionLayout;
