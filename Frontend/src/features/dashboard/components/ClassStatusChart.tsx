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
import type { DashboardResponse } from "../dashboard.types";

const { Title, Text } = Typography;

interface ClassStatusChartProps {
  data?: DashboardResponse["classStatusChart"];
  loading?: boolean;
}

interface ClassStatusStatistic {
  name: string;
  value: number;
  color: string;
}

const transformClassStatusData = (data: DashboardResponse["classStatusChart"] = []): ClassStatusStatistic[] => {
  const grouped: Record<string, { value: number; color: string }> = {
    "Sắp mở": { value: 0, color: "#faad14" }, // Orange
    "Đang hoạt động": { value: 0, color: "#52c41a" }, // Green
    "Đã xong": { value: 0, color: "#1677ff" }, // Blue
    "Đã hủy": { value: 0, color: "#ff4d4f" }, // Red
  };

  data.forEach((item) => {
    switch (item.status) {
      case "Draft":
      case "Ready":
        grouped["Sắp mở"].value += item.count;
        break;
      case "Ongoing":
        grouped["Đang hoạt động"].value += item.count;
        break;
      case "Completed":
        grouped["Đã xong"].value += item.count;
        break;
      case "Cancelled":
        grouped["Đã hủy"].value += item.count;
        break;
      default:
        break;
    }
  });

  // Only return categories that have at least 1 class
  return Object.keys(grouped)
    .filter((key) => grouped[key].value > 0)
    .map((key) => ({
      name: key,
      value: grouped[key].value,
      color: grouped[key].color,
    }));
};

export const ClassStatusChart: React.FC<ClassStatusChartProps> = ({ data = [], loading }) => {
  const transformedData = transformClassStatusData(data);
  const totalClasses = transformedData.reduce((acc, curr) => acc + curr.value, 0);

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
                  data={transformedData}
                  cx="50%"
                  cy="45%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {transformedData.map((entry, index) => (
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
                  formatter={(value: any, name: any) => [`${value} lớp`, name]}
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
