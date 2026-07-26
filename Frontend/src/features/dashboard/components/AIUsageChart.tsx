import React from "react";
import { Card, Typography, Skeleton } from "antd";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
} from "recharts";
import type { AIUsageItem } from "../dashboard.types";

const { Title, Text } = Typography;

interface AIUsageChartProps {
  data: AIUsageItem[];
  loading?: boolean;
}

export const AIUsageChart: React.FC<AIUsageChartProps> = ({ data, loading }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      style={{ height: "100%" }}
    >
      <Card
        variant="borderless"
        style={{
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          border: "1px solid #f0f0f0",
          height: "100%",
        }}
        styles={{ body: { padding: "24px" } }}
      >
        <div style={{ marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Sử dụng AI theo tính năng 🤖
            </Title>
            <Text type="secondary" style={{ fontSize: "13px" }}>
              Số lượng lượt dùng AI Chatbot, Tóm tắt, Quiz, Đề thi, Chấm bài
            </Text>
          </div>
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis
                  dataKey="feature"
                  tickLine={false}
                  axisLine={{ stroke: "#e0e0e0" }}
                  tick={{ fill: "#666", fontSize: 12 }}
                />
                <YAxis tickLine={false} axisLine={false} tick={{ fill: "#666", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
                    padding: "10px 14px",
                  }}
                  formatter={(value: any) => [`${value} lượt gọi`, "Lượt sử dụng"]}
                  labelStyle={{ fontWeight: 600, color: "#1f1f1f" }}
                />
                <Legend verticalAlign="top" height={36} align="right" />
                <Bar
                  name="Lượt sử dụng AI"
                  dataKey="count"
                  radius={[8, 8, 0, 0]}
                  barSize={38}
                >
                  {data.map((entry, index) => (
                    <Cell key={`bar-cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </motion.div>
  );
};
