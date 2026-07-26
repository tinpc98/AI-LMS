import React from "react";
import { Card, List, Tag, Progress, Button, Typography, Space } from "antd";
import { FileTextOutlined, CalendarOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import EmptyState from "../../common/EmptyState";

const { Text } = Typography;

export interface IStudentAssignmentItem {
  id: string;
  title: string;
  className: string;
  dueDate: string;
  status: "PENDING" | "SUBMITTED" | "LATE";
  urgentPercent?: number; // 0 to 100
  classId?: string;
}

interface StudentAssignmentOverviewProps {
  assignments: IStudentAssignmentItem[];
}

export const StudentAssignmentOverview: React.FC<StudentAssignmentOverviewProps> = React.memo(
  ({ assignments }) => {
    const navigate = useNavigate();

    const getStatusTag = (status: IStudentAssignmentItem["status"]) => {
      switch (status) {
        case "SUBMITTED":
          return <Tag color="success">Đã nộp</Tag>;
        case "LATE":
          return <Tag color="error">Quá hạn</Tag>;
        case "PENDING":
        default:
          return <Tag color="warning">Chưa nộp</Tag>;
      }
    };

    return (
      <Card
        title={
          <Space align="center">
            <FileTextOutlined style={{ color: "#fa8c16", fontSize: 18 }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Bài tập gần đến hạn</span>
          </Space>
        }
        extra={
          <Button
            type="link"
            onClick={() => navigate("/studentassignment")}
            style={{ padding: 0 }}
          >
            Tất cả <RightOutlined style={{ fontSize: 10 }} />
          </Button>
        }
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          marginBottom: 24,
        }}
        styles={{ body: { padding: "12px 20px" } }}
      >
        {assignments.length === 0 ? (
          <EmptyState
            description="Bạn đã hoàn thành tất cả bài tập! Không có bài tập nào gần đến hạn."
            style={{ padding: "32px 16px", border: "none" }}
          />
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={assignments}
            renderItem={(item) => {
              const formattedDueDate = item.dueDate
                ? new Date(item.dueDate).toLocaleDateString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Chưa có hạn";

              return (
                <List.Item
                  actions={[
                    <Button
                      key="detail"
                      type="primary"
                      ghost
                      size="small"
                      onClick={() =>
                        navigate(
                          item.classId
                            ? `/classdetail/${item.classId}`
                            : `/studentassignment/${item.id}`
                        )
                      }
                      style={{ borderRadius: 6 }}
                    >
                      Chi tiết
                    </Button>,
                  ]}
                  style={{ padding: "14px 0" }}
                >
                  <List.Item.Meta
                    avatar={
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          backgroundColor: "#fff7e6",
                          border: "1px solid #ffd591",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <FileTextOutlined style={{ color: "#fa8c16", fontSize: 20 }} />
                      </div>
                    }
                    title={
                      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                        <Text strong style={{ fontSize: 14 }}>
                          {item.title}
                        </Text>
                        {getStatusTag(item.status)}
                      </div>
                    }
                    description={
                      <Space direction="vertical" size={2} style={{ marginTop: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Môn học: {item.className}
                        </Text>
                        <Space size={4}>
                          <CalendarOutlined style={{ fontSize: 12, color: "#8c8c8c" }} />
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Hạn nộp: {formattedDueDate}
                          </Text>
                        </Space>
                        {item.urgentPercent !== undefined && item.status === "PENDING" && (
                          <div style={{ marginTop: 4, maxWidth: 240 }}>
                            <Progress
                              percent={item.urgentPercent}
                              size="small"
                              showInfo={false}
                              status={item.urgentPercent > 80 ? "exception" : "active"}
                            />
                          </div>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    );
  }
);

StudentAssignmentOverview.displayName = "StudentAssignmentOverview";

export default StudentAssignmentOverview;
