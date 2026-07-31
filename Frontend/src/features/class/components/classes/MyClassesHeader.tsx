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
          backgroundColor: "#fff",
          padding: "24px 28px",
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          border: "1px solid #f0f0f0",
          marginBottom: 24,
        }}
      >
        <Row gutter={[24, 16]} align="middle" justify="space-between">
          {/* Left Title & Description */}
          <Col xs={24} md={12} lg={14}>
            <Title level={3} style={{ margin: 0, fontWeight: 700, color: "#1f2937" }}>
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
                    backgroundColor: "#f5f5f5",
                    borderRadius: 12,
                    padding: "10px 14px",
                    textAlign: "center",
                    border: "1px solid #e8e8e8",
                  }}
                >
                  <Space size={6} align="center">
                    <BookOutlined style={{ color: "#1890ff", fontSize: 14 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Tổng số lớp
                    </Text>
                  </Space>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#1f2937", marginTop: 2 }}>
                    {totalClasses}
                  </div>
                </div>
              </Col>

              <Col xs={8} sm={8}>
                <div
                  style={{
                    backgroundColor: "#f6ffed",
                    borderRadius: 12,
                    padding: "10px 14px",
                    textAlign: "center",
                    border: "1px solid #b7eb8f",
                  }}
                >
                  <Space size={6} align="center">
                    <SyncOutlined spin style={{ color: "#52c41a", fontSize: 14 }} />
                    <Text style={{ fontSize: 12, color: "#389e0d" }}>Đang học</Text>
                  </Space>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#237804", marginTop: 2 }}>
                    {activeClassesCount}
                  </div>
                </div>
              </Col>

              <Col xs={8} sm={8}>
                <div
                  style={{
                    backgroundColor: "#fafafa",
                    borderRadius: 12,
                    padding: "10px 14px",
                    textAlign: "center",
                    border: "1px solid #d9d9d9",
                  }}
                >
                  <Space size={6} align="center">
                    <CheckCircleOutlined style={{ color: "#8c8c8c", fontSize: 14 }} />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      Hoàn thành
                    </Text>
                  </Space>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#595959", marginTop: 2 }}>
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
