import React from "react";
import { Card, Typography, Tag, Button } from "antd";
import { FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { AssignmentSummaryItem } from "../types/learningDashboard.types";

const { Text } = Typography;

interface AssignmentOverviewWidgetProps {
  assignments: AssignmentSummaryItem[];
}

export const AssignmentOverviewWidget: React.FC<AssignmentOverviewWidgetProps> = React.memo(
  ({ assignments }) => {
    return (
      <Card
        title={
          <span style={{ fontSize: 15, fontWeight: 700 }}>
            <FileTextOutlined style={{ color: "#1890ff", marginRight: 6 }} /> Tổng quan Bài tập (
            {assignments.length})
          </span>
        }
        style={{ borderRadius: 16, border: "1px solid #f0f0f0", marginBottom: 24 }}
        styles={{ body: { padding: 16 } }}
      >
        {assignments.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 13, fontStyle: "italic" }}>
            Hiện chưa có bài tập cần hoàn thành.
          </Text>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {assignments.slice(0, 4).map((item) => {
              const isSubmitted = item.status === "SUBMITTED";

              return (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: "#fafafa",
                    borderRadius: 12,
                    padding: "12px 16px",
                    border: "1px solid #f0f0f0",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 6,
                    }}
                  >
                    <Text strong style={{ fontSize: 13, color: "#1f2937" }}>
                      {item.title}
                    </Text>

                    {isSubmitted ? (
                      <Tag
                        color="success"
                        icon={<CheckCircleOutlined />}
                        style={{ borderRadius: 6 }}
                      >
                        Đã nộp bài
                      </Tag>
                    ) : (
                      <Tag
                        color="warning"
                        icon={<ClockCircleOutlined />}
                        style={{ borderRadius: 6 }}
                      >
                        Chưa nộp
                      </Tag>
                    )}
                  </div>

                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Lớp: {item.className} • Hạn nộp:{" "}
                      {new Date(item.dueDate).toLocaleDateString("vi-VN")}
                    </Text>

                    {item.classId && (
                      <Link to={`/student/classdetail/${item.classId}?tab=assignments`}>
                        <Button type="link" size="small" style={{ fontSize: 12, padding: 0 }}>
                          Chi tiết bài tập
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    );
  }
);

AssignmentOverviewWidget.displayName = "AssignmentOverviewWidget";

export default AssignmentOverviewWidget;
