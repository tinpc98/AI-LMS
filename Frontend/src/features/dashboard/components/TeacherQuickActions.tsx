import React from "react";
import { Card, Row, Col, Typography } from "antd";
import { useNavigate } from "react-router-dom";
import { BookOutlined, DatabaseOutlined } from "@ant-design/icons";
import { tokens } from "../../../shared/theme/tokens";

const { Title, Text } = Typography;

export const TeacherQuickActions: React.FC = React.memo(() => {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Lớp học của tôi",
      desc: "Quản lý và xem danh sách lớp học phụ trách",
      icon: <BookOutlined style={{ fontSize: 24, color: tokens.color.action.primaryBg }} />,
      color: tokens.color.bg.primaryTint,
      borderColor: tokens.color.border.primaryTint,
      onClick: () => navigate("/teacher/classes"),
    },
    {
      title: "Ngân hàng câu hỏi",
      desc: "Quản lý và tạo bộ câu hỏi thi",
      icon: <DatabaseOutlined style={{ fontSize: 24, color: tokens.color.semantic.warning.base }} />,
      color: tokens.color.semantic.warning.bg,
      borderColor: tokens.color.border.default,
      onClick: () => navigate("/teacher/questionbank"),
    },
  ];

  return (
    <Card
      title={
        <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
          ⚡ Thao tác nhanh
        </Title>
      }
      style={{ borderRadius: tokens.radius.lg, marginBottom: tokens.space[5], boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
      styles={{ body: { padding: tokens.space[5] } }}
    >
      <Row gutter={[tokens.space[4], tokens.space[4]]}>
        {actions.map((act, index) => (
          <Col xs={24} sm={12} md={6} key={index}>
            <div
              onClick={act.onClick}
              style={{
                padding: tokens.space[4],
                borderRadius: tokens.radius.md,
                backgroundColor: act.color,
                border: `1px solid ${act.borderColor}`,
                cursor: "pointer",
                transition: "var(--transition-fast)",
                display: "flex",
                alignItems: "center",
                gap: tokens.space[4],
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
                  borderRadius: tokens.radius.md,
                  backgroundColor: tokens.color.bg.surface,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                }}
              >
                {act.icon}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Text strong style={{ display: "block", fontSize: 15, marginBottom: tokens.space[1] }}>
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
