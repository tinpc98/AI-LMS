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
      bgColor: "#e6f7ff",
      borderColor: "#91d5ff",
      iconColor: "#1890ff",
      onClick: () => navigate("/student/myclasses"),
    },
    {
      key: "my-assignments",
      title: "Xem bài tập",
      description: "Danh sách bài cần nộp",
      icon: <FileTextOutlined style={{ fontSize: 28 }} />,
      bgColor: "#fff7e6",
      borderColor: "#ffd591",
      iconColor: "#fa8c16",
      onClick: () => navigate("/student/studentassignment"),
    },
    {
      key: "my-classes",
      title: "Danh sách lớp",
      description: "Tất cả lớp đang học",
      icon: <BookOutlined style={{ fontSize: 28 }} />,
      bgColor: "#f9f0ff",
      borderColor: "#d3ade6",
      iconColor: "#722ed1",
      onClick: () => navigate("/student/myclasses"),
    },
    {
      key: "exam-schedule",
      title: "Lịch thi",
      description: "Kiểm tra & kỳ thi sắp tới",
      icon: <CalendarOutlined style={{ fontSize: 28 }} />,
      bgColor: "#f6ffed",
      borderColor: "#b7eb8f",
      iconColor: "#52c41a",
      onClick: () => navigate("/student/myclasses"),
    },
    {
      key: "notifications",
      title: "Thông báo",
      description: "Thông tin từ giảng viên",
      icon: <BellOutlined style={{ fontSize: 28 }} />,
      bgColor: "#fff0f6",
      borderColor: "#ffadd2",
      iconColor: "#eb2f96",
      onClick: () => navigate("/student/myclasses"),
    },
  ];

  return (
    <div
      style={{
        borderRadius: 20,
        boxShadow: "0 2px 12px rgba(0, 0, 0, 0.06)",
        border: "1px solid #f0f0f0",
        marginBottom: 32,
        backgroundColor: "#fff",
        padding: "20px",
      }}
    >
      <Row gutter={[16, 12]}>
        {actions.map((act) => (
          <Col xs={12} sm={8} md={6} lg={24 / actions.length} key={act.key} style={{ minWidth: 120 }}>
            <div
              onClick={act.onClick}
              style={{
                backgroundColor: act.bgColor,
                border: `1px solid ${act.borderColor}`,
                borderRadius: 16,
                padding: "18px 16px",
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 10,
                cursor: "pointer",
                transition: "all 0.25s ease",
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
                  width: 52,
                  height: 52,
                  borderRadius: 14,
                  backgroundColor: "rgba(255,255,255,0.7)",
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
                <Text strong style={{ fontSize: 14, color: "#1f2937", display: "block", lineHeight: 1.3 }}>
                  {act.title}
                </Text>
                <Text style={{ fontSize: 12, color: "#6b7280", marginTop: 2, display: "block", lineHeight: 1.4 }}>
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
