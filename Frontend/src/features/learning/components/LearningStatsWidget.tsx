import React from "react";
import { Row, Col, Card, Progress, Typography } from "antd";
import {
  TrophyOutlined,
  CalendarOutlined,
  FileTextOutlined,
  FormOutlined,
} from "@ant-design/icons";
import type { LearningStatistics } from "../types/learningDashboard.types";

const { Text } = Typography;

interface LearningStatsWidgetProps {
  statistics: LearningStatistics;
}

interface StatItem {
  key: string;
  icon: React.ReactNode;
  label: string;
  /** Chuỗi hiển thị — "Chưa có dữ liệu" khi null */
  value: string;
  /** 0–100 để vẽ thanh progress */
  percent: number;
  strokeColor: string;
  bgColor: string;
  textColor: string;
  /** true = chưa có dữ liệu thật, thanh sẽ hiện màu xám trung tính */
  noData: boolean;
}

export const LearningStatsWidget: React.FC<LearningStatsWidgetProps> = React.memo(
  ({ statistics }) => {
    const stats: StatItem[] = [
      {
        key: "gpa",
        icon: <TrophyOutlined style={{ fontSize: 20, color: "#fa8c16" }} />,
        label: "Điểm GPA",
        value:
          statistics.gpa !== null
            ? `${statistics.gpa.toFixed(2)} / 10`
            : "Chưa có dữ liệu",
        percent: statistics.gpa !== null ? Math.round((statistics.gpa / 10) * 100) : 0,
        strokeColor: "#fa8c16",
        bgColor: "#fff7e6",
        textColor: "#d46b08",
        noData: statistics.gpa === null,
      },
      {
        key: "attendance",
        icon: <CalendarOutlined style={{ fontSize: 20, color: "#52c41a" }} />,
        label: "Chuyên cần",
        value: `${statistics.attendanceRate}%`,
        percent: statistics.attendanceRate,
        strokeColor: "#52c41a",
        bgColor: "#f6ffed",
        textColor: "#389e0d",
        noData: false,
      },
      {
        key: "assignment",
        icon: <FileTextOutlined style={{ fontSize: 20, color: "#1890ff" }} />,
        label: "Hoàn thành BT",
        value:
          statistics.assignmentCompletionRate !== null
            ? `${statistics.assignmentCompletionRate}%`
            : "Chưa có dữ liệu",
        percent: statistics.assignmentCompletionRate ?? 0,
        strokeColor: "#1890ff",
        bgColor: "#e6f7ff",
        textColor: "#096dd9",
        noData: statistics.assignmentCompletionRate === null,
      },
      {
        key: "exam",
        icon: <FormOutlined style={{ fontSize: 20, color: "#722ed1" }} />,
        label: "Kết quả thi",
        value:
          statistics.examPerformanceRate !== null
            ? `${statistics.examPerformanceRate}%`
            : "Chưa có dữ liệu",
        percent: statistics.examPerformanceRate ?? 0,
        strokeColor: "#722ed1",
        bgColor: "#f9f0ff",
        textColor: "#531dab",
        noData: statistics.examPerformanceRate === null,
      },
    ];

    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 0 }}>
        {stats.map((stat) => (
          <Col xs={12} sm={6} key={stat.key} style={{ display: "flex" }}>
            <Card
              bordered={false}
              styles={{ body: { padding: "18px 16px" } }}
              style={{
                borderRadius: 18,
                backgroundColor: stat.noData ? "#fafafa" : stat.bgColor,
                flex: 1,
                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                border: "1px solid transparent",
                transition: "all 0.25s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 6px 16px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 8px rgba(0,0,0,0.04)";
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {stat.icon}
                <Text style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>{stat.label}</Text>
              </div>

              {/* Giá trị — tuỳ chỉnh theo noData */}
              {stat.noData ? (
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#9ca3af",
                    lineHeight: 1.3,
                    marginBottom: 10,
                    fontStyle: "italic",
                  }}
                >
                  Chưa có dữ liệu
                </div>
              ) : (
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 800,
                    color: stat.textColor,
                    lineHeight: 1.1,
                    marginBottom: 10,
                    letterSpacing: -0.3,
                  }}
                >
                  {stat.value}
                </div>
              )}

              {/* Thanh tiến độ */}
              <Progress
                percent={stat.percent}
                showInfo={false}
                strokeColor={stat.noData ? "#d9d9d9" : stat.strokeColor}
                trailColor="rgba(0,0,0,0.06)"
                size="small"
              />

              {/* Chú thích nhỏ dưới thanh khi có dữ liệu */}
              {!stat.noData && stat.key !== "attendance" && (
                <Text
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                    display: "block",
                    marginTop: 4,
                  }}
                >
                  {stat.key === "gpa" && "Thang điểm 10"}
                  {stat.key === "assignment" && "Bài đã nộp / tổng bài"}
                  {stat.key === "exam" && "Điểm TB / thang 10"}
                </Text>
              )}
            </Card>
          </Col>
        ))}
      </Row>
    );
  }
);

LearningStatsWidget.displayName = "LearningStatsWidget";

export default LearningStatsWidget;
