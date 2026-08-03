import React from "react";
import { Card, Row, Col, Statistic, Typography, Space } from "antd";
import {
  BookOutlined,
  CheckCircleOutlined,
  TeamOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

interface TeacherClassHeaderProps {
  totalClasses: number;
  activeClasses: number;
  completedClasses: number;
  totalStudents: number;
  loading?: boolean;
}

export const TeacherClassHeader: React.FC<TeacherClassHeaderProps> = React.memo(
  ({
    totalClasses = 0,
    activeClasses = 0,
    completedClasses = 0,
    totalStudents = 0,
    loading = false,
  }) => {
    return (
      <Card
        style={{
          borderRadius: 16,
          background: "linear-gradient(135deg, var(--color-action-primary-bg) 0%, var(--color-action-primary-bg-active) 100%)",
          color: "var(--color-surface)",
          marginBottom: 24,
          boxShadow: "0 8px 24px rgba(24, 144, 255, 0.25)",
        }}
        styles={{ body: { padding: "24px 32px" } }}
      >
        <div style={{ marginBottom: 20 }}>
          <Space align="center">
            <BookOutlined style={{ fontSize: 28, color: "var(--color-surface)" }} />
            <Title level={3} style={{ color: "var(--color-surface)", margin: 0, fontWeight: 700 }}>
              Quản lý lớp học của tôi
            </Title>
          </Space>
          <Text
            style={{
              color: "rgba(255,255,255,0.85)",
              display: "block",
              marginTop: 4,
              fontSize: 14,
            }}
          >
            Theo dõi trạng thái, danh sách học sinh và điều phối hoạt động giảng dạy trong các lớp
            học được phân công.
          </Text>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(6px)",
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <Statistic
                title={
                  <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>Tổng số lớp</Text>
                }
                value={totalClasses}
                suffix="lớp"
                valueStyle={{ color: "var(--color-surface)", fontWeight: 700, fontSize: 22 }}
                loading={loading}
              />
            </div>
          </Col>

          <Col xs={12} sm={6}>
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(6px)",
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <Statistic
                title={
                  <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                    Đang hoạt động
                  </Text>
                }
                value={activeClasses}
                suffix="lớp"
                prefix={<CheckCircleOutlined style={{ color: "var(--color-border-default)", marginRight: 6 }} />}
                valueStyle={{ color: "var(--color-surface)", fontWeight: 700, fontSize: 22 }}
                loading={loading}
              />
            </div>
          </Col>

          <Col xs={12} sm={6}>
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(6px)",
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <Statistic
                title={
                  <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                    Đã hoàn thành
                  </Text>
                }
                value={completedClasses}
                suffix="lớp"
                prefix={<ClockCircleOutlined style={{ color: "var(--color-warning-bg)", marginRight: 6 }} />}
                valueStyle={{ color: "var(--color-surface)", fontWeight: 700, fontSize: 22 }}
                loading={loading}
              />
            </div>
          </Col>

          <Col xs={12} sm={6}>
            <div
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                backdropFilter: "blur(6px)",
                padding: "12px 16px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.25)",
              }}
            >
              <Statistic
                title={
                  <Text style={{ color: "rgba(255,255,255,0.85)", fontSize: 12 }}>
                    Tổng học sinh
                  </Text>
                }
                value={totalStudents}
                suffix="học sinh"
                prefix={<TeamOutlined style={{ color: "var(--color-bg-primary-tint)", marginRight: 6 }} />}
                valueStyle={{ color: "var(--color-surface)", fontWeight: 700, fontSize: 22 }}
                loading={loading}
              />
            </div>
          </Col>
        </Row>
      </Card>
    );
  }
);

TeacherClassHeader.displayName = "TeacherClassHeader";
