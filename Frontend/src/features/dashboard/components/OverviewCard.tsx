import React from "react";
import { Card, Statistic, Tag, Typography } from "antd";
import { motion } from "framer-motion";
import CountUp from "react-countup";
import {
  UserOutlined,
  TeamOutlined,
  BookOutlined,
  SolutionOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  RobotOutlined,
  VideoCameraOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from "@ant-design/icons";
import type { OverviewCardItem } from "../dashboard.types";

const { Text } = Typography;

// Interop check for CountUp export in CJS/ESM environments
const CountUpComponent: React.ComponentType<any> =
  typeof CountUp === "function" ? CountUp : (CountUp as any)?.default || CountUp;

interface OverviewCardProps {
  item: OverviewCardItem;
}

const iconMap: Record<string, React.ReactNode> = {
  UserOutlined: <UserOutlined />,
  TeamOutlined: <TeamOutlined />,
  BookOutlined: <BookOutlined />,
  SolutionOutlined: <SolutionOutlined />,
  CheckCircleOutlined: <CheckCircleOutlined />,
  ClockCircleOutlined: <ClockCircleOutlined />,
  RobotOutlined: <RobotOutlined />,
  VideoCameraOutlined: <VideoCameraOutlined />,
};

export const OverviewCard: React.FC<OverviewCardProps> = ({ item }) => {
  const icon = iconMap[item.iconName] || <UserOutlined />;
  const isUp = item.trendType === "up";

  return (
    <motion.div whileHover={{ y: -4, transition: { duration: 0.2 } }} style={{ height: "100%" }}>
      <Card
        variant="borderless"
        style={{
          borderRadius: "14px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.04)",
          background: "var(--color-surface)",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          border: "1px solid var(--color-border-default)",
          transition: "box-shadow var(--duration-fast) var(--ease-out)",
        }}
        styles={{ body: { padding: "20px" } }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <Text type="secondary" style={{ fontSize: "14px", fontWeight: 500 }}>
            {item.title}
          </Text>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: "12px",
              backgroundColor: item.bgColor,
              color: item.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              flexShrink: 0,
            }}
          >
            {icon}
          </div>
        </div>

        <div>
          <Statistic
            value={item.value}
            formatter={(value) => (
              <CountUpComponent end={Number(value)} duration={1.8} separator="," />
            )}
            styles={{
              content: {
                fontSize: "28px",
                fontWeight: 700,
                color: "var(--color-text-title)",
                lineHeight: 1.2,
              },
            }}
          />

          <div
            style={{
              marginTop: 12,
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {item.trend !== 0 ? (
              <Tag
                color={isUp ? "success" : "warning"}
                style={{
                  borderRadius: "6px",
                  marginRight: 0,
                  fontWeight: 600,
                  fontSize: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                {isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                {Math.abs(item.trend)}%
              </Tag>
            ) : (
              <Tag color="processing" style={{ borderRadius: "6px", marginRight: 0 }}>
                Live
              </Tag>
            )}

            <Text type="secondary" style={{ fontSize: "12px" }}>
              {item.trendLabel}
            </Text>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};
