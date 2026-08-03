import React from "react";
import { Card, Typography, Skeleton } from "antd";
import { motion } from "framer-motion";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import type { DashboardResponse } from "../dashboard.types";

const { Title, Text } = Typography;

interface CourseDistributionChartProps {
  data?: DashboardResponse["courseDistribution"];
  loading?: boolean;
}

interface SubjectStatistic {
  subject: string;
  total: number;
}

const groupCoursesBySubject = (
  data: DashboardResponse["courseDistribution"] = []
): SubjectStatistic[] => {
  const grouped: Record<string, number> = {};

  data.forEach((item) => {
    // Subject must come only from backend response field "subject".
    // If subject is missing, ignore that item or show "Unknown".
    const subjectName = item.subject || "Unknown";

    if (!grouped[subjectName]) {
      grouped[subjectName] = 0;
    }
    // Aggregate the total number of classes (or courses)
    grouped[subjectName] += item.classCount;
  });

  return Object.keys(grouped).map((key) => ({
    subject: key,
    total: grouped[key],
  }));
};

export const CourseDistributionChart: React.FC<CourseDistributionChartProps> = ({
  data = [],
  loading,
}) => {
  // Define a curated color palette for courses
  const COLORS = [
    "var(--color-action-primary-bg)",
    "var(--color-secondary-icon)",
    "var(--color-warning-base)",
    "var(--color-success-base)",
    "var(--color-accent-base)",
    "var(--color-info-base)",
    "var(--color-warning-base)",
    "var(--color-error-base)",
  ];

  const subjectData = groupCoursesBySubject(data);

  // Transform data into chart format
  const transformedData = subjectData.map((item, index) => ({
    name: item.subject,
    value: item.total,
    color: COLORS[index % COLORS.length],
  }));

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
          border: "1px solid var(--color-border-default)",
          height: "100%",
        }}
        styles={{ body: { padding: "24px" } }}
      >
        <div style={{ marginBottom: "16px" }}>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Phân bổ khóa học theo môn 📚
          </Title>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            Tỷ lệ phân bổ theo các môn học
          </Text>
        </div>

        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={transformedData}
                  cx="50%"
                  cy="45%"
                  innerRadius={0}
                  outerRadius={90}
                  paddingAngle={3}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                  labelLine={{ strokeWidth: 1 }}
                >
                  {transformedData.map((entry, index) => (
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
                  formatter={(value: any, name: any) => [`${value} khóa/lớp`, name]}
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
