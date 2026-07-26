import React from "react";
import { Card, Row, Col, Button, Typography, Space } from "antd";
import { useNavigate } from "react-router-dom";
import {
  CheckSquareOutlined,
  BookOutlined,
  FormOutlined,
  DatabaseOutlined,
  FileDoneOutlined,
  VideoCameraOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

export const TeacherQuickActions: React.FC = React.memo(() => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Lớp học của tôi",
      desc: "Quản lý và xem danh sách lớp",
      icon: <BookOutlined style={{ fontSize: 24, color: "#1890ff" }} />,
      color: "#e6f7ff",
      borderColor: "#91d5ff",
      onClick: () => navigate("/teacher"),
    },
    {
      title: "Quản lý bài giảng",
      desc: "Tạo và đăng tải tài liệu học tập",
      icon: <FormOutlined style={{ fontSize: 24, color: "#52c41a" }} />,
      color: "#f6ffed",
      borderColor: "#b7eb8f",
      onClick: () => navigate("/teacher/lessonManagement"),
    },
    {
      title: "Ngân hàng câu hỏi",
      desc: "Quản lý và tạo bộ câu hỏi thi",
      icon: <DatabaseOutlined style={{ fontSize: 24, color: "#faad14" }} />,
      color: "#fffbe6",
      borderColor: "#ffe58f",
      onClick: () => navigate("/teacher/questionbank"),
    },
    {
      title: "Quản lý kỳ thi",
      desc: "Tạo đề thi và theo dõi làm bài",
      icon: <FileDoneOutlined style={{ fontSize: 24, color: "#722ed1" }} />,
      color: "#f9f0ff",
      borderColor: "#d3ade6",
      onClick: () => navigate("/teacher/exammanagement"),
    },
  ];

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
          ⚡ Thao tác nhanh
        </Title>
      }
      style={{ borderRadius: 12, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      bodyStyle={{ padding: 20 }}
    >
      <Row gutter={[16, 16]}>
        {actions.map((act, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <div
              onClick={act.onClick}
              style={{
                padding: 16,
                borderRadius: 10,
                backgroundColor: act.color,
                border: `1px solid ${act.borderColor}`,
                cursor: "pointer",
                transition: "all 0.2s ease",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  backgroundColor: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                }}
              >
                {act.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ display: "block", fontSize: 15, marginBottom: 2 }}>
                  {act.title}
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }} ellipsis>
                  {act.desc}
                </Text>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </Card>
  );
});

TeacherQuickActions.displayName = "TeacherQuickActions";
