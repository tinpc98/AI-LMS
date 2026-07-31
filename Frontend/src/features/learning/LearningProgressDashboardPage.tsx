import React from "react";
import { Row, Col, Alert } from "antd";
import PageContainer from "../../components/common/PageContainer";
import {
  LearningDashboardProvider,
  useLearningDashboardContext,
} from "./context/LearningDashboardContext";
import DashboardErrorBoundary from "./components/DashboardErrorBoundary";
import DashboardLoadingSkeleton from "./components/DashboardLoadingSkeleton";
import DashboardHeader from "./components/DashboardHeader";
import LearningScoreCard from "./components/LearningScoreCard";
import LearningStatsWidget from "./components/LearningStatsWidget";
import TodayClassesWidget from "./components/TodayClassesWidget";
import AssignmentOverviewWidget from "./components/AssignmentOverviewWidget";
import UpcomingExamsWidget from "./components/UpcomingExamsWidget";
import AnnouncementsTimelineWidget from "./components/AnnouncementsTimelineWidget";
import ClassProgressWidget from "./components/ClassProgressWidget";
import LearningInsightsWidget from "./components/LearningInsightsWidget";
import StudentWelcomeBanner from "../../components/student/dashboard/StudentWelcomeBanner";
import StudentQuickActions from "../../components/student/dashboard/StudentQuickActions";

const DashboardContent: React.FC = React.memo(() => {
  const {
    overview,
    statistics,
    learningScore,
    assignments,
    exams,
    todayClasses,
    announcements,
    classProgress,
    learningInsight,
    loading,
    error,
    refresh,
  } = useLearningDashboardContext();

  if (loading) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <>
      {/* Error Alert if any */}
      {error && (
        <Alert
          type="error"
          message="Lỗi tải dữ liệu"
          description={error}
          showIcon
          style={{ marginBottom: 24, borderRadius: 12 }}
        />
      )}

      {/* 1. Header & Welcome Banner */}
      <DashboardHeader
        overview={overview}
        learningScore={learningScore}
        onRefresh={refresh}
        loading={loading}
      />

      <StudentWelcomeBanner
        totalClassesCount={overview.totalClasses}
        pendingAssignmentsCount={overview.pendingAssignmentsCount}
        upcomingExamsCount={overview.upcomingExamsCount}
        unreadAnnouncementsCount={overview.unreadAnnouncementsCount}
      />

      {/* 2. Overall Learning Score & Key Statistics */}
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <LearningScoreCard score={learningScore} />
        </Col>
        <Col xs={24} lg={12}>
          <LearningStatsWidget statistics={statistics} />
        </Col>
      </Row>

      {/* 3. AI Ready Learning Insights Widget */}
      <LearningInsightsWidget insight={learningInsight} />

      {/* 4. Main Two Column Layout */}
      <Row gutter={[24, 24]}>
        {/* Left Main Content Column */}
        <Col xs={24} lg={15} xl={16}>
          {/* Today Classes */}
          <TodayClassesWidget todayClasses={todayClasses} />

          {/* Assignments Overview */}
          <AssignmentOverviewWidget assignments={assignments} />

          {/* Class Progress */}
          <ClassProgressWidget classProgress={classProgress} />
        </Col>

        {/* Right Sidebar Widgets Column */}
        <Col xs={24} lg={9} xl={8}>
          {/* Quick Actions */}
          <StudentQuickActions />

          {/* Upcoming Exams */}
          <UpcomingExamsWidget exams={exams} />

          {/* Announcements Timeline */}
          <AnnouncementsTimelineWidget announcements={announcements} />
        </Col>
      </Row>
    </>
  );
});

DashboardContent.displayName = "DashboardContent";

export const LearningProgressDashboardPage: React.FC = () => {
  return (
    <PageContainer maxWidth="1400px">
      <LearningDashboardProvider>
        <DashboardErrorBoundary>
          <DashboardContent />
        </DashboardErrorBoundary>
      </LearningDashboardProvider>
    </PageContainer>
  );
};

export default LearningProgressDashboardPage;
