import React from "react";
import { Card, Typography, Skeleton } from "antd";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
import type { RegistrationChartItem } from "../dashboard.types";

const { Title, Text } = Typography;

interface RegistrationChartProps {
  data: RegistrationChartItem[];
  loading?: boolean;
}

export const RegistrationChart: React.FC<RegistrationChartProps> = ({ data, loading }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      style={{ height: "100%" }}
    >
      <Card
        variant="borderless"
        style={{
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          border: "1px solid var(--color-border-default)",
          height: "100%",
        }}
        styles={{ body: { padding: "24px" } }}
      >
        <div
          style={{
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Thống kê học sinh đăng ký 📈
            </Title>
            <Text type="secondary" style={{ fontSize: "13px" }}>
              Số lượng học sinh ghi danh mới trong 12 tháng gần nhất
            </Text>
          </div>
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-action-primary-bg)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-action-primary-bg)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-default)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={{ stroke: "var(--color-border-default)" }}
                  tick={{ fill: "var(--color-text-description)", fontSize: 12 }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--color-text-description)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
                    padding: "10px 14px",
                  }}
                  formatter={(value: any) => [`${value} học sinh`, "Học sinh đăng ký"]}
                  labelStyle={{ fontWeight: 600, color: "var(--color-text-title)" }}
                />
                <Legend verticalAlign="top" height={36} align="right" />
                <Line
                  name="Số học sinh ghi danh"
                  type="monotone"
                  dataKey="students"
                  stroke="var(--color-action-primary-bg)"
                  strokeWidth={3}
                  activeDot={{ r: 8, fill: "var(--color-action-primary-bg)", stroke: "var(--color-surface)", strokeWidth: 3 }}
                  dot={{ r: 4, fill: "var(--color-action-primary-bg)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </motion.div>
  );
};
