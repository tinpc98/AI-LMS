import React from "react";
import { Card, Row, Col, Typography, Space } from "antd";
import { RocketOutlined, BookOutlined, FileTextOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Text } = Typography;

export const StudentQuickActions: React.FC = React.memo(() => {
  const navigate = useNavigate();

  const actions = [
    {
      key: "enter-class",
      title: "Vào lớp học",
      icon: <RocketOutlined style={{ fontSize: 22, color: "#1890ff" }} />,
      bgColor: "#e6f7ff",
      borderColor: "#91d5ff",
      onClick: () => navigate("/student/myclasses"),
    },
    {
      key: "my-classes",
      title: "Xem danh sách lớp",
      icon: <BookOutlined style={{ fontSize: 22, color: "#722ed1" }} />,
      bgColor: "#f9f0ff",
      borderColor: "#d3ade6",
      onClick: () => navigate("/student/myclasses"),
    },
    {
      key: "my-assignments",
      title: "Xem bài tập",
      icon: <FileTextOutlined style={{ fontSize: 22, color: "#fa8c16" }} />,
      bgColor: "#fff7e6",
      borderColor: "#ffd591",
      onClick: () => navigate("/student/studentassignment"),
    },
  ];

  return (
    <Card
      title={
        <Space align="center">
          <RocketOutlined style={{ color: "#1890ff", fontSize: 18 }} />
          <span style={{ fontSize: 16, fontWeight: 700 }}>Thao tác nhanh</span>
        </Space>
      }
      style={{
        borderRadius: 16,
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
        marginBottom: 24,
      }}
      styles={{ body: { padding: 16 } }}
    >
      <Row gutter={[12, 12]}>
        {actions.map((act) => (
          <Col xs={12} sm={12} lg={6} key={act.key}>
            <div
              onClick={act.onClick}
              style={{
                backgroundColor: act.bgColor,
                border: `1px solid ${act.borderColor}`,
                borderRadius: 12,
                padding: "14px 12px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              className="quick-action-card"
            >
              <div style={{ flexShrink: 0 }}>{act.icon}</div>
              <Text strong style={{ fontSize: 13, color: "#1f2937", lineHeight: 1.2 }}>
                {act.title}
              </Text>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
});

StudentQuickActions.displayName = "StudentQuickActions";

export default StudentQuickActions;
