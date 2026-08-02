import React from "react";
import { Row, Col, Badge } from "antd";
import {
  BookOutlined,
  TeamOutlined,
  FormOutlined,
  VideoCameraOutlined,
  NotificationOutlined,
} from "@ant-design/icons";
import StatCard from "../../../shared/components/StatCard";

interface TeacherQuickStatsProps {
  totalClasses: number;
  totalStudents: number;
  pendingSubmissionsCount: number;
  activeLiveSessionsCount: number;
  totalAnnouncementsCount: number;
  loading?: boolean;
}

export const TeacherQuickStats: React.FC<TeacherQuickStatsProps> = React.memo(
  ({
    totalClasses = 0,
    totalStudents = 0,
    pendingSubmissionsCount = 0,
    activeLiveSessionsCount = 0,
    totalAnnouncementsCount = 0,
    loading = false,
  }) => {
    return (
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={8} lg={4.8} style={{ flex: 1 }}>
          <StatCard
            loading={loading}
            label="Lớp phụ trách"
            value={totalClasses}
            suffix="lớp"
            description="Lớp học được Admin phân công"
            icon={<BookOutlined />}
            accentColor="#1890ff"
          />
        </Col>

        <Col xs={24} sm={12} md={8} lg={4.8} style={{ flex: 1 }}>
          <StatCard
            loading={loading}
            label="Tổng học sinh"
            value={totalStudents}
            suffix="học sinh"
            description="Đang tham gia học tập"
            icon={<TeamOutlined />}
            accentColor="#52c41a"
          />
        </Col>

        <Col xs={24} sm={12} md={8} lg={4.8} style={{ flex: 1 }}>
          <StatCard
            loading={loading}
            label="Bài nộp cần chấm"
            value={pendingSubmissionsCount}
            suffix="bài"
            description="Bài làm chờ chấm điểm"
            icon={<FormOutlined />}
            accentColor="#faad14"
            valueColor={pendingSubmissionsCount > 0 ? "#d48806" : undefined}
            badge={
              pendingSubmissionsCount > 0 ? (
                <Badge count={pendingSubmissionsCount} overflowCount={99} />
              ) : undefined
            }
          />
        </Col>

        <Col xs={24} sm={12} md={8} lg={4.8} style={{ flex: 1 }}>
          <StatCard
            loading={loading}
            label="Live Session"
            value={activeLiveSessionsCount}
            suffix="phòng"
            description="Phòng học trực tuyến đang mở"
            icon={<VideoCameraOutlined />}
            accentColor="#ff4d4f"
            valueColor={activeLiveSessionsCount > 0 ? "#ff4d4f" : undefined}
            badge={
              activeLiveSessionsCount > 0 ? (
                <Badge
                  status="processing"
                  text="LIVE"
                  style={{ color: "#ff4d4f", fontWeight: 700 }}
                />
              ) : undefined
            }
          />
        </Col>

        <Col xs={24} sm={12} md={8} lg={4.8} style={{ flex: 1 }}>
          <StatCard
            loading={loading}
            label="Thông báo"
            value={totalAnnouncementsCount}
            suffix="tin"
            description="Thông báo trên hệ thống"
            icon={<NotificationOutlined />}
            accentColor="#722ed1"
          />
        </Col>
      </Row>
    );
  }
);

TeacherQuickStats.displayName = "TeacherQuickStats";
