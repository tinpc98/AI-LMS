import { Row, Col, Alert, Button } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useAuth } from "../../../shared/hooks/useAuth";
import { useTeacherDashboardQuery } from "../hooks/useTeacherDashboardQuery";

import { TeacherWelcomeHeader } from "../components/TeacherWelcomeHeader";
import { TeacherQuickStats } from "../components/TeacherQuickStats";
import { TeacherQuickActions } from "../components/TeacherQuickActions";
import { TeacherScheduleWidget } from "../components/TeacherScheduleWidget";
import { TeacherClassroomsGrid } from "../components/TeacherClassroomsGrid";
import { TeacherAnnouncementsWidget } from "../components/TeacherAnnouncementsWidget";
import { TeacherAssignmentsWidget } from "../components/TeacherAssignmentsWidget";
import { TeacherLiveSessionWidget } from "../components/TeacherLiveSessionWidget";

export default function HomePageTeacher() {
  const { user } = useAuth();

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

  return (
    <div
      style={{
        padding: "24px",
        maxWidth: 1400,
        margin: "0 auto",
        backgroundColor: "#f8f9fa",
        minHeight: "100vh",
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
          style={{ marginBottom: 24, borderRadius: 8 }}
        />
      )}

      {/* 2. Active Live Sessions Banner Widget */}
      <TeacherLiveSessionWidget activeSessions={activeLiveSessions} loading={loading} />

      {/* 3. Quick Statistics Cards */}
      <TeacherQuickStats
        totalClasses={classes.length}
        totalStudents={totalStudentsCount}
        pendingSubmissionsCount={assignments.length}
        activeLiveSessionsCount={activeLiveSessions.length}
        totalAnnouncementsCount={announcements.length}
        loading={loading}
      />

      {/* 4. Quick Action Navigation */}
      <TeacherQuickActions />

      {/* 5. Main Layout Split (Left & Right Column) */}
      <Row gutter={[24, 24]}>
        {/* Left Column (Main Content) */}
        <Col xs={24} lg={16}>
          {/* Schedule Widget */}
          <TeacherScheduleWidget classes={classes} loading={loading} />

          {/* Classrooms Grid */}
          <TeacherClassroomsGrid classes={classes} loading={loading} />
        </Col>

        {/* Right Column (Sidebar Widgets) */}
        <Col xs={24} lg={8}>
          {/* Assignments Widget */}
          <TeacherAssignmentsWidget assignments={assignments} loading={loading} />

          {/* Announcements Widget */}
          <TeacherAnnouncementsWidget announcements={announcements} loading={loading} />
        </Col>
      </Row>
    </div>
  );
}
