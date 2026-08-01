import React from "react";
import { Card, List, Tag, Typography, Empty, Space, Button } from "antd";
import { FormOutlined, ClockCircleOutlined, RightOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Text } = Typography;

interface AssignmentWidgetProps {
  assignments?: any[];
  loading?: boolean;
}

export const TeacherAssignmentsWidget: React.FC<AssignmentWidgetProps> = React.memo(
  ({ assignments = [], loading = false }) => {
    const navigate = useNavigate();

    return (
      <Card
        loading={loading}
        title={
          <Space>
            <FormOutlined style={{ color: "#faad14" }} />
            <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
              Bài tập cần chấm điểm
            </Title>
          </Space>
        }
        style={{ borderRadius: 12, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
        styles={{ body: { padding: "12px 20px" } }}
      >
        {assignments.length > 0 ? (
          <List
            itemLayout="horizontal"
            dataSource={assignments.slice(0, 5)}
            renderItem={(item) => {
              const isPastDeadline = item.deadline && new Date(item.deadline) < new Date();

              return (
                <List.Item
                  style={{ padding: "12px 0" }}
                  actions={[
                    <Button
                      type="link"
                      size="small"
                      key="grade"
                      icon={<RightOutlined />}
                      onClick={() => navigate(`/teacher/classroom-detail/${item.classId}`)}
                    >
                      Chi tiết
                    </Button>,
                  ]}
                >
                  <List.Item.Meta
                    title={
                      <Space align="center">
                        <Text strong style={{ fontSize: 14 }}>
                          {item.title}
                        </Text>
                        {item.isAIGenerated && <Tag color="purple">AI Generated</Tag>}
                      </Space>
                    }
                    description={
                      <Space size={12} style={{ fontSize: 12, marginTop: 4 }}>
                        {item.deadline && (
                          <Space size={4}>
                            <ClockCircleOutlined
                              style={{ color: isPastDeadline ? "#ff4d4f" : "#8c8c8c" }}
                            />
                            <Text type={isPastDeadline ? "danger" : "secondary"}>
                              Hạn nộp: {new Date(item.deadline).toLocaleString("vi-VN")}
                            </Text>
                          </Space>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              );
            }}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={<Text type="secondary">Chưa có bài tập nào cần chấm điểm.</Text>}
          />
        )}
      </Card>
    );
  }
);

TeacherAssignmentsWidget.displayName = "TeacherAssignmentsWidget";
