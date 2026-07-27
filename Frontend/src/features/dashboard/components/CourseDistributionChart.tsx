import React from "react";
import { Card, Typography, Skeleton } from "antd";
import { motion } from "framer-motion";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import type { CourseDistributionItem } from "../dashboard.types";

const { Title, Text } = Typography;

interface CourseDistributionChartProps {
  data: CourseDistributionItem[];
  loading?: boolean;
}

export const CourseDistributionChart: React.FC<CourseDistributionChartProps> = ({
  data,
  loading,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
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
        <div style={{ marginBottom: "16px" }}>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Phân bổ khóa học theo môn 📚
          </Title>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            Tỷ lệ các khóa học Toán, Lý, Hóa, Tiếng Anh
          </Text>
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={0}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="count"
                  nameKey="subject"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
                  }}
                  formatter={(value: any, name: any) => [`${value} khóa học`, name]}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </motion.div>
  );
};
