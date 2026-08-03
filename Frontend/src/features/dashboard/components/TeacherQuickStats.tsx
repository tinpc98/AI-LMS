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
import { tokens } from "../../../shared/theme/tokens";

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
      <Row gutter={[tokens.space[4], tokens.space[4]]} style={{ marginBottom: tokens.space[5] }}>
        <Col xs={12} sm={12} md={12} lg={4.8} style={{ flex: 1, minWidth: 150 }}>
          <StatCard
            loading={loading}
            label="Lớp phụ trách"
            value={totalClasses}
            suffix="lớp"
            description="Lớp học được Admin phân công"
            icon={<BookOutlined />}
            accentColor={tokens.color.action.primaryBg}
          />
        </Col>

        <Col xs={12} sm={12} md={12} lg={4.8} style={{ flex: 1, minWidth: 150 }}>
          <StatCard
            loading={loading}
            label="Tổng học sinh"
            value={totalStudents}
            suffix="học sinh"
            description="Đang tham gia học tập"
            icon={<TeamOutlined />}
            accentColor={tokens.color.semantic.success.base}
          />
        </Col>

        <Col xs={12} sm={12} md={12} lg={4.8} style={{ flex: 1, minWidth: 150 }}>
          <StatCard
            loading={loading}
            label="Bài nộp cần chấm"
            value={pendingSubmissionsCount}
            suffix="bài"
            description="Bài làm chờ chấm điểm"
            icon={<FormOutlined />}
            accentColor={tokens.color.semantic.warning.base}
            valueColor={pendingSubmissionsCount > 0 ? tokens.color.semantic.warning.text : undefined}
            badge={
              pendingSubmissionsCount > 0 ? (
                <Badge count={pendingSubmissionsCount} overflowCount={99} />
              ) : undefined
            }
          />
        </Col>

        <Col xs={12} sm={12} md={12} lg={4.8} style={{ flex: 1, minWidth: 150 }}>
          <StatCard
            loading={loading}
            label="Phòng học trực tuyến"
            value={activeLiveSessionsCount}
            suffix="phòng"
            description="Phòng học trực tuyến đang mở"
            icon={<VideoCameraOutlined />}
            accentColor={tokens.color.semantic.error.base}
            valueColor={activeLiveSessionsCount > 0 ? tokens.color.semantic.error.text : undefined}
            badge={
              activeLiveSessionsCount > 0 ? (
                <Badge
                  status="processing"
                  text="LIVE"
                  style={{ color: tokens.color.semantic.error.text, fontWeight: 700 }}
                />
              ) : undefined
            }
          />
        </Col>

        <Col xs={12} sm={12} md={12} lg={4.8} style={{ flex: 1, minWidth: 150 }}>
          <StatCard
            loading={loading}
            label="Thông báo"
            value={totalAnnouncementsCount}
            suffix="tin"
            description="Thông báo trên hệ thống"
            icon={<NotificationOutlined />}
            accentColor={tokens.color.secondary.icon}
          />
        </Col>
      </Row>
    );
  }
);

TeacherQuickStats.displayName = "TeacherQuickStats";
