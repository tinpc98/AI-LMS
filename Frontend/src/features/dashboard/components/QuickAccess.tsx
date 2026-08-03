import React from "react";
import { Card, Row, Col, Typography, Badge } from "antd";
import {
  UserOutlined,
  BookOutlined,
  SolutionOutlined,
  UserSwitchOutlined,
  RobotOutlined,
  BarChartOutlined,
  ArrowRightOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import type { QuickAccessItem } from "../dashboard.types";

const { Title, Text } = Typography;

const quickAccessItems: QuickAccessItem[] = [
  {
    key: "accounts",
    title: "Quản lý Tài Khoản",
    description: "Quản lý học sinh, giáo viên & phân quyền",
    path: "/admin/accounts",
    iconName: "UserOutlined",
    color: "var(--color-action-primary-bg)",
    bgColor: "var(--color-bg-primary-tint)",
    badge: "Mới",
  },
  {
    key: "courses",
    title: "Quản lý Khóa Học",
    description: "Tạo môn học, chương trình luyện thi THPT",
    path: "/admin/courses",
    iconName: "BookOutlined",
    color: "var(--color-info-base)",
    bgColor: "var(--color-info-bg)",
  },
  {
    key: "classes",
    title: "Quản lý Lớp Học",
    description: "Lịch học, sĩ số, hình thức Online/Offline",
    path: "/admin/classes",
    iconName: "SolutionOutlined",
    color: "var(--color-warning-base)",
    bgColor: "var(--color-warning-bg)",
  },
  {
    key: "teacher-assignment",
    title: "Phân Công Giáo Viên",
    description: "Phân công giảng dạy, kiểm tra trùng lịch",
    path: "/admin/teacher-assignment",
    iconName: "UserSwitchOutlined",
    color: "var(--color-secondary-icon)",
    bgColor: "var(--color-secondary-bg)",
    badge: "Ưu tiên",
  },
  {
    key: "ai-management",
    title: "Quản lý AI",
    description: "Cấu hình Model AI, Prompt template & RAG",
    path: "/admin/ai-management",
    iconName: "RobotOutlined",
    color: "var(--color-accent-base)",
    bgColor: "var(--color-accent-bg)",
  },
  {
    key: "reports",
    title: "Báo Cáo & Thống Kê",
    description: "Xem chi tiết doanh thu, học tập & hệ thống",
    path: "/admin/reports",
    iconName: "BarChartOutlined",
    color: "var(--color-success-base)",
    bgColor: "var(--color-success-bg)",
  },
];

const iconMap: Record<string, React.ReactNode> = {
  UserOutlined: <UserOutlined />,
  BookOutlined: <BookOutlined />,
  SolutionOutlined: <SolutionOutlined />,
  UserSwitchOutlined: <UserSwitchOutlined />,
  RobotOutlined: <RobotOutlined />,
  BarChartOutlined: <BarChartOutlined />,
};

export const QuickAccess: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.35 }}
    >
      <Card
        variant="borderless"
        style={{
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.04)",
          border: "1px solid var(--color-border-default)",
          marginBottom: "24px",
        }}
        styles={{ body: { padding: "24px" } }}
      >
        <div style={{ marginBottom: "20px" }}>
          <Title level={4} style={{ margin: 0, fontWeight: 700 }}>
            Truy cập nhanh các chức năng 🚀
          </Title>
          <Text type="secondary" style={{ fontSize: "13px" }}>
            Chuyển hướng trực tiếp tới các phân hệ quản lý chính
          </Text>
        </div>

        <Row gutter={[16, 16]}>
          {quickAccessItems.map((item) => (
            <Col xs={24} sm={12} md={8} lg={4} key={item.key}>
              <motion.div
                whileHover={{ scale: 1.03, y: -4 }}
                transition={{ duration: 0.2 }}
                style={{ height: "100%" }}
              >
                <Card
                  hoverable
                  onClick={() => navigate(item.path)}
                  style={{
                    borderRadius: "12px",
                    border: "1px solid var(--color-border-default)",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    position: "relative",
                  }}
                  styles={{ body: { padding: "16px" } }}
                >
                  {item.badge && (
                    <div style={{ position: "absolute", top: 10, right: 10 }}>
                      <Badge
                        count={item.badge}
                        style={{ backgroundColor: item.color, fontSize: "10px" }}
                      />
                    </div>
                  )}

                  <div>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "10px",
                        backgroundColor: item.bgColor,
                        color: item.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "20px",
                        marginBottom: 12,
                      }}
                    >
                      {iconMap[item.iconName]}
                    </div>

                    <Title
                      level={5}
                      style={{ fontSize: "14px", margin: "0 0 6px 0", fontWeight: 600 }}
                    >
                      {item.title}
                    </Title>

                    <Text
                      type="secondary"
                      style={{
                        fontSize: "12px",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {item.description}
                    </Text>
                  </div>

                  <div
                    style={{
                      marginTop: 14,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: item.color,
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    Mở ngay <ArrowRightOutlined style={{ fontSize: "10px" }} />
                  </div>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </Card>
    </motion.div>
  );
};
