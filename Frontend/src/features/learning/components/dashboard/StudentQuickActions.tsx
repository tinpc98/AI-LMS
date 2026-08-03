import React from "react";
import { Row, Col, Typography } from "antd";
import {
  RocketOutlined,
  BookOutlined,
  FileTextOutlined,
  CalendarOutlined,
  BellOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { tokens } from "../../../../shared/theme/tokens";

const { Text } = Typography;

interface QuickActionItem {
  key: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  iconColor: string;
  onClick: () => void;
}

export const StudentQuickActions: React.FC = React.memo(() => {
  const navigate = useNavigate();

  const actions: QuickActionItem[] = [
    {
      key: "enter-class",
      title: "Vào lớp học",
      description: "Tham gia buổi học ngay",
      icon: <RocketOutlined style={{ fontSize: 28 }} />,
      bgColor: tokens.color.bg.primaryTint,
      borderColor: tokens.color.border.primaryTint,
      iconColor: tokens.color.action.primaryBg,
      onClick: () => navigate("/student/myclasses"),
    },
    {
      key: "my-assignments",
      title: "Xem bài tập",
      description: "Danh sách bài cần nộp",
      icon: <FileTextOutlined style={{ fontSize: 28 }} />,
      bgColor: tokens.color.semantic.warning.bg,
      borderColor: tokens.color.border.default,
      iconColor: tokens.color.semantic.warning.base,
      onClick: () => navigate("/student/studentassignment"),
    },
    {
      key: "my-classes",
      title: "Danh sách lớp",
      description: "Tất cả lớp đang học",
      icon: <BookOutlined style={{ fontSize: 28 }} />,
      bgColor: tokens.color.bg.secondaryTint,
      borderColor: tokens.color.border.secondaryTint,
      iconColor: tokens.color.secondary.icon,
      onClick: () => navigate("/student/myclasses"),
    },
    {
      key: "exam-schedule",
      title: "Lịch thi",
      description: "Kiểm tra & kỳ thi sắp tới",
      icon: <CalendarOutlined style={{ fontSize: 28 }} />,
      bgColor: tokens.color.semantic.success.bg,
      borderColor: tokens.color.border.default,
      iconColor: tokens.color.semantic.success.base,
      onClick: () => navigate("/student/myclasses"),
    },
    {
      key: "notifications",
      title: "Thông báo",
      description: "Thông tin từ giảng viên",
      icon: <BellOutlined style={{ fontSize: 28 }} />,
      bgColor: tokens.color.bg.accentTint,
      borderColor: tokens.color.border.accentTint,
      iconColor: tokens.color.accent.base,
      onClick: () => navigate("/student/notifications"),
    },
  ];

  return (
    <div
      style={{
        borderRadius: tokens.radius.lg,
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
        border: `1px solid ${tokens.color.border.default}`,
        marginBottom: tokens.space[6],
        backgroundColor: tokens.color.bg.surface,
        padding: tokens.space[5],
      }}
    >
      <Row gutter={[tokens.space[4], tokens.space[3]]}>
        {actions.map((act) => (
          <Col xs={12} sm={8} md={8} lg={8} xl={4.8} key={act.key} style={{ flex: 1, minWidth: 140 }}>
            <div
              onClick={act.onClick}
              style={{
                backgroundColor: act.bgColor,
                border: `1px solid ${act.borderColor}`,
                borderRadius: tokens.radius.md,
                padding: `${tokens.space[4]}px ${tokens.space[4]}px`,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: tokens.space[2],
                cursor: "pointer",
                transition: "var(--transition-fast)",
                height: "100%",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLDivElement).style.boxShadow =
                  "0 6px 20px rgba(0,0,0,0.1)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: tokens.radius.md,
                  backgroundColor: "rgba(255,255,255,0.85)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: act.iconColor,
                  flexShrink: 0,
                }}
              >
                {act.icon}
              </div>
              <div>
                <Text strong style={{ fontSize: 14, color: tokens.color.text.title, display: "block", lineHeight: 1.3 }}>
                  {act.title}
                </Text>
                <Text style={{ fontSize: 12, color: tokens.color.text.description, marginTop: tokens.space[1], display: "block", lineHeight: 1.4 }}>
                  {act.description}
                </Text>
              </div>
            </div>
          </Col>
        ))}
      </Row>
    </div>
  );
});

StudentQuickActions.displayName = "StudentQuickActions";

export default StudentQuickActions;
