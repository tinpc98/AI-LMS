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
import type { ClassStatusItem } from "../dashboard.types";

const { Title, Text } = Typography;

interface ClassStatusChartProps {
  data: ClassStatusItem[];
  loading?: boolean;
}

export const ClassStatusChart: React.FC<ClassStatusChartProps> = ({ data, loading }) => {
  const totalClasses = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.15 }}
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
            Trạng thái lớp học 🏫
          </Title>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            Tỷ lệ lớp Sắp mở, Đang hoạt động, Đã xong & Đã hủy
          </Text>
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <div style={{ width: "100%", height: 300, position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="statusLabel"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-status-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    borderRadius: "10px",
                    border: "none",
                    boxShadow: "0 4px 16px rgba(0, 0, 0, 0.12)",
                  }}
                  formatter={(value: any, name: any) => [`${value} lớp học`, name]}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center Overlay Text */}
            <div
              style={{
                position: "absolute",
                top: "40%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                pointerEvents: "none",
              }}
            >
              <div style={{ fontSize: "24px", fontWeight: 700, color: "#1f1f1f", lineHeight: 1 }}>
                {totalClasses}
              </div>
              <div style={{ fontSize: "11px", color: "#8c8c8c", marginTop: 4 }}>Tổng số lớp</div>
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );
};
