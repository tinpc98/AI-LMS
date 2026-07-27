import React from "react";
import { Button, Typography, Space, Tag } from "antd";
import { ReloadOutlined, StarOutlined, RiseOutlined } from "@ant-design/icons";
import type { LearningOverview, LearningScore } from "../types/learningDashboard.types";

const { Title, Text } = Typography;

interface DashboardHeaderProps {
  overview: LearningOverview;
  learningScore: LearningScore;
  onRefresh: () => void;
  loading?: boolean;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = React.memo(
  ({ learningScore, onRefresh, loading }) => {
    return (
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 20,
          padding: "20px 24px",
          marginBottom: 24,
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.03)",
          border: "1px solid #f0f0f0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <Space size={8} align="center">
            <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#1f2937" }}>
              📊 Learning Progress Dashboard
            </Title>
            <Tag color="purple" icon={<StarOutlined />}>
              AI Powered
            </Tag>
          </Space>
          <Text type="secondary" style={{ fontSize: 13, display: "block", marginTop: 4 }}>
            Hệ thống phân tích tiến độ học tập, tổng hợp kết quả và gợi ý lộ trình thông minh cho sinh viên.
          </Text>
        </div>

        <Space size={12}>
          <div
            style={{
              backgroundColor: "#f6ffed",
              border: "1px solid #b7eb8f",
              borderRadius: 10,
              padding: "6px 14px",
              textAlign: "right",
            }}
          >
            <Text type="secondary" style={{ fontSize: 11, display: "block" }}>
              Điểm năng lực học tập
            </Text>
            <Text strong style={{ fontSize: 18, color: "#52c41a" }}>
              {learningScore.score} / 100 <RiseOutlined style={{ fontSize: 14 }} />
            </Text>
          </div>

          <Button
            type="primary"
            icon={<ReloadOutlined spin={loading} />}
            onClick={onRefresh}
            style={{ borderRadius: 10, height: 42 }}
          >
            Làm mới dữ liệu
          </Button>
        </Space>
      </div>
    );
  }
);

DashboardHeader.displayName = "DashboardHeader";

export default DashboardHeader;
