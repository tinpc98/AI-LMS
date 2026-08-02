import React from "react";
import { Tag, Space } from "antd";
import { StarOutlined } from "@ant-design/icons";
import type { LearningOverview, LearningScore } from "../types/learningDashboard.types";

interface DashboardHeaderProps {
  overview: LearningOverview;
  learningScore: LearningScore;
  onRefresh: () => void;
  loading?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(
  ({ learningScore }) => {
    // This component is now minimal — the main greeting/refresh is in StudentWelcomeBanner.
    // We keep it here as a no-op export so imports in LearningProgressDashboardPage don't break.
    return (
      <Space size={8} style={{ marginBottom: 8, display: "flex", alignItems: "center" }}>
        <Tag
          color="purple"
          icon={<StarOutlined />}
          style={{ borderRadius: 8, fontWeight: 600, fontSize: 12 }}
        >
          AI Powered · Điểm học tập:{" "}
          <strong style={{ marginLeft: 4 }}>{learningScore.score} / 100</strong>
        </Tag>
      </Space>
    );
  }
);

DashboardHeader.displayName = "DashboardHeader";

export default DashboardHeader;
