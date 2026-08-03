import React from "react";
import { Row, Col, Typography, Space } from "antd";
import { BookOutlined, CheckCircleOutlined, SyncOutlined } from "@ant-design/icons";

const { Title, Text } = Typography;

interface MyClassesHeaderProps {
  totalClasses: number;
  activeClassesCount: number;
  completedClassesCount: number;
}

export const MyClassesHeader: React.FC<MyClassesHeaderProps> = React.memo(
  ({ totalClasses, activeClassesCount, completedClassesCount }) => {
    return (
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          padding: "24px 28px",
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          border: "1px solid var(--color-border-default)",
          marginBottom: 24,
        }}
      >
        <Row gutter={[24, 16]} align="middle" justify="space-between">
          {/* Left Title & Description */}
          <Col xs={24} md={12} lg={14}>
            <Title level={3} style={{ margin: 0, fontWeight: 700, color: "var(--color-text-title)" }}>
              Lớp học của tôi 📚
            </Title>
            <Text type="secondary" style={{ fontSize: 14, marginTop: 4, display: "block" }}>
              Danh sách các lớp học bạn đang được phân công và theo dõi tiến trình học tập.
            </Text>
          </Col>

          {/* Right Small Statistic Badges */}
          <Col xs={24} md={12} lg={10}>
            <Row gutter={[12, 12]} justify="end">
              <Col xs={8} sm={8}>
                <div
                  style={{
                    backgroundColor: "var(--color-bg-page)",
                    borderRadius: 12,
                    padding: "10px 14px",
                    textAlign: "center",
                    border: "1px solid var(--color-border-default)",
                  }}
                >
                  <Space size={6} align="center">
                    <BookOutlined style={{ color: "var(--color-action-primary-bg)", fontSize: 14 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Tổng số lớp
                    </Text>
                  </Space>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-title)", marginTop: 2 }}>
                    {totalClasses}
                  </div>
                </div>
              </Col>

              <Col xs={8} sm={8}>
                <div
                  style={{
                    backgroundColor: "var(--color-success-bg)",
                    borderRadius: 12,
                    padding: "10px 14px",
                    textAlign: "center",
                    border: "1px solid var(--color-border-default)",
                  }}
                >
                  <Space size={6} align="center">
                    <SyncOutlined spin style={{ color: "var(--color-success-base)", fontSize: 14 }} />
                    <Text style={{ fontSize: 12, color: "var(--color-success-text)" }}>Đang học</Text>
                  </Space>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-success-text)", marginTop: 2 }}>
                    {activeClassesCount}
                  </div>
                </div>
              </Col>

              <Col xs={8} sm={8}>
                <div
                  style={{
                    backgroundColor: "var(--color-bg-page)",
                    borderRadius: 12,
                    padding: "10px 14px",
                    textAlign: "center",
                    border: "1px solid var(--color-border-default)",
                  }}
                >
                  <Space size={6} align="center">
                    <CheckCircleOutlined style={{ color: "var(--color-text-description)", fontSize: 14 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Hoàn thành
                    </Text>
                  </Space>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text-body)", marginTop: 2 }}>
                    {completedClassesCount}
                  </div>
                </div>
              </Col>
            </Row>
          </Col>
        </Row>
      </div>
    );
  }
);

MyClassesHeader.displayName = "MyClassesHeader";

export default MyClassesHeader;
