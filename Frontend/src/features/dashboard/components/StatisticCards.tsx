import React from "react";
import { Row, Col, Skeleton } from "antd";
import { OverviewCard } from "./OverviewCard";
import type { OverviewCardItem } from "../dashboard.types";

interface StatisticCardsProps {
  cards: OverviewCardItem[];
  loading?: boolean;
}

export const StatisticCards: React.FC<StatisticCardsProps> = ({ cards, loading }) => {
  if (loading) {
    return (
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        {Array.from({ length: 8 }).map((_, index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={index}>
            <div
              style={{
                background: "#ffffff",
                padding: "20px",
                borderRadius: "14px",
                border: "1px solid #f0f0f0",
              }}
            >
              <Skeleton active paragraph={{ rows: 2 }} />
            </div>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
      {cards.map((item) => (
        <Col xs={24} sm={12} md={8} lg={6} key={item.key}>
          <OverviewCard item={item} />
        </Col>
      ))}
    </Row>
  );
};
