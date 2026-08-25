import { Row, Col, Alert, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useTeacherDashboardQuery } from "../hooks/useTeacherDashboardQuery";
import { tokens } from "../../../shared/theme/tokens";

import { TeacherWelcomeHeader } from "../components/TeacherWelcomeHeader";
import { TeacherAssignmentsWidget } from "../components/TeacherAssignmentsWidget";
import { PendingAttendanceWidget } from "../components/PendingAttendanceWidget";
import { TeacherClassCard } from "../../class/components/classes/TeacherClassCard";
import { sortClassesByUpcomingSession } from "../../learning/utils/learningDashboard.utils";
import { useMemo } from "react";
import { Typography, Card, Empty } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

import { useResponsiveLayout } from "../../../shared/hooks/useResponsiveLayout";
const { Title } = Typography;

export default function HomePageTeacher() {
  const { user } = useAuth();
  const { isMobile, isTablet } = useResponsiveLayout();

  const paddingValue = isMobile
    ? `${tokens.space[4]}px ${tokens.space[3]}px`
    : isTablet
      ? `${tokens.space[5]}px ${tokens.space[4]}px`
      : `${tokens.space[6]}px ${tokens.space[5]}px`;

  // Toàn bộ việc lấy & ghép dữ liệu nằm ở hook/service, component chỉ hiển thị.
  const {
    classes,
    announcements,
    assignments,
    activeLiveSessions,
    totalStudentsCount,
    loading,
    error,
    refetch,
  } = useTeacherDashboardQuery();
  const navigate = useNavigate();

  const sortedClasses = useMemo(() => {
    return sortClassesByUpcomingSession(classes || []);
  }, [classes]);

  return (
    <div
      style={{
        padding: paddingValue,
        maxWidth: 1400,
        margin: "0 auto",
        backgroundColor: tokens.color.bg.page,
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* 1. Header Section */}
      <TeacherWelcomeHeader
        fullName={user?.fullName}
        email={user?.email}
        avatar={(user as any)?.avatar}
        loading={loading}
        onRefresh={() => refetch()}
      />

      {/* Error Alert State */}
      {error && (
        <Alert
          message="Lỗi kết nối dữ liệu"
          description={error}
          type="error"
          showIcon
          action={
            <Button
              size="small"
              type="primary"
              danger
              icon={<ReloadOutlined />}
              onClick={() => refetch()}
            >
              Thử lại
            </Button>
          }
          style={{ marginBottom: tokens.space[5], borderRadius: tokens.radius.md }}
        />
      )}

      {/* Main Layout Split (Left & Right Column) */}
      <Row gutter={[24, 24]}>
        {/* Left Column (Danh sách lớp học Grid) */}
        <Col xs={24} lg={16} xl={16}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4} style={{ margin: 0, display: 'flex', alignItems: 'center' }}>
              <CalendarOutlined style={{ color: tokens.color.action.primaryBg, marginRight: 8 }} />
              Danh sách lớp học
            </Title>
            <Button type="link" onClick={() => navigate('/teacher/classes')}>
              Xem tất cả
            </Button>
          </div>

          {sortedClasses.length === 0 ? (
            <Card style={{ borderRadius: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <div style={{ textAlign: "center", padding: "32px 0", color: tokens.color.text.description }}>
                <CalendarOutlined style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }} />
                <p>Bạn chưa phụ trách lớp học nào.</p>
              </div>
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {sortedClasses.slice(0, 6).map((cls: any) => (
                <Col xs={24} sm={12} lg={12} xl={8} key={cls._id || cls.id}>
                  <TeacherClassCard item={cls} />
                </Col>
              ))}
            </Row>
          )}
        </Col>

        {/* Right Column (Việc cần xử lý) */}
        <Col xs={24} lg={8} xl={8}>
          <PendingAttendanceWidget classes={classes} loading={loading} />
          <TeacherAssignmentsWidget assignments={assignments} loading={loading} />
        </Col>
      </Row>
    </div>
  );
}
