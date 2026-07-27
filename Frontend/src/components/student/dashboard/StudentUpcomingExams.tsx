import React from "react";
import { Card, List, Button, Tag, Typography, Space } from "antd";
import { FormOutlined, ClockCircleOutlined, TrophyOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import EmptyState from "../../common/EmptyState";

const { Text } = Typography;

export interface IStudentExamItem {
  id: string;
  attemptId?: string;
  title: string;
  className?: string;
  startTime?: string;
  duration: number; // phút
  maxScore?: number;
  score?: number | null; // null if not taken yet
  status: "NOT_STARTED" | "COMPLETED";
}

interface StudentUpcomingExamsProps {
  exams: IStudentExamItem[];
}

export const StudentUpcomingExams: React.FC<StudentUpcomingExamsProps> = React.memo(({ exams }) => {
  const navigate = useNavigate();

  return (
    <Card
      title={
        <Space align="center">
          <FormOutlined style={{ color: "#ff4d4f", fontSize: 18 }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>Bài kiểm tra sắp diễn ra</span>
        </Space>
      }
      style={{
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        marginBottom: 24,
      }}
      styles={{ body: { padding: "12px 20px" } }}
    >
      {exams.length === 0 ? (
        <EmptyState
          description="Hiện tại không có bài kiểm tra nào sắp diễn ra."
          style={{ padding: "32px 16px", border: "none" }}
        />
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={exams}
          renderItem={(item) => {
            const formattedDate = item.startTime
              ? new Date(item.startTime).toLocaleDateString("vi-VN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Thời gian linh hoạt";

            const isCompleted = item.status === "COMPLETED" || item.score !== null && item.score !== undefined;

            return (
              <List.Item
                actions={[
                  isCompleted ? (
                    <Tag key="score" color="gold" style={{ fontSize: 13, padding: "4px 10px", borderRadius: 8 }}>
                      <TrophyOutlined style={{ marginRight: 4 }} /> Điểm: {item.score} / {item.maxScore || 10}
                    </Tag>
                  ) : (
                    <Button
                      key="start"
                      type="primary"
                      danger
                      size="small"
                      onClick={() => navigate(`/exam/${item.attemptId || item.id}`)}
                      style={{ borderRadius: 6 }}
                    >
                      Bắt đầu
                    </Button>
                  ),
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
                        backgroundColor: "#fff1f0",
                        border: "1px solid #ffa39e",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FormOutlined style={{ color: "#ff4d4f", fontSize: 20 }} />
                    </div>
                  }
                  title={
                    <Text strong style={{ fontSize: 14 }}>
                      {item.title}
                    </Text>
                  }
                  description={
                    <Space direction="vertical" size={2} style={{ marginTop: 2 }}>
                      {item.className && (
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Lớp: {item.className}
                        </Text>
                      )}
                      <Space size={12}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          <ClockCircleOutlined style={{ marginRight: 4 }} /> {item.duration} phút
                        </Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                          Ngày thi: {formattedDate}
                        </Text>
                      </Space>
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
});

StudentUpcomingExams.displayName = "StudentUpcomingExams";

export default StudentUpcomingExams;
