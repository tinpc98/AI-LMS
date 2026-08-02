import React from "react";
import { Row, Col, Alert, Divider } from "antd";
import PageContainer from "../../shared/components/PageContainer";
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
import StudentWelcomeBanner from "./components/dashboard/StudentWelcomeBanner";
import StudentQuickActions from "./components/dashboard/StudentQuickActions";
import SectionHeader from "../../shared/components/SectionHeader";


// ─── Dashboard Content ─────────────────────────────────────────────────────────
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
    <div style={{ paddingBottom: 32 }}>
      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          message="Lỗi tải dữ liệu"
          description={error}
          showIcon
          style={{ marginBottom: 24, borderRadius: 14 }}
        />
      )}

      {/* ═══════════════════════════════════════════════════════
          SECTION 1 — TODAY OVERVIEW
          Greeting + Refresh Button + 4 KPI Cards
      ═══════════════════════════════════════════════════════ */}
      <StudentWelcomeBanner
        totalClassesCount={overview.totalClasses}
        pendingAssignmentsCount={overview.pendingAssignmentsCount}
        upcomingExamsCount={overview.upcomingExamsCount}
        unreadAnnouncementsCount={overview.unreadAnnouncementsCount}
        onRefresh={refresh}
        loading={loading}
      />

      {/* AI Badge (compact) */}
      <DashboardHeader
        overview={overview}
        learningScore={learningScore}
        onRefresh={refresh}
        loading={loading}
      />

      {/* ═══════════════════════════════════════════════════════
          SECTION 2 — HÔM NAY CẦN LÀM (Most prominent)
          Lịch học | Bài tập sắp hết hạn | Lịch thi
      ═══════════════════════════════════════════════════════ */}
      <div style={{ marginTop: 24, marginBottom: 32 }}>
        <SectionHeader
          emoji="📌"
          title="Hôm nay cần làm"
          subtitle="Tập trung vào những việc quan trọng nhất hôm nay"
        />
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={9}>
            <TodayClassesWidget todayClasses={todayClasses} />
          </Col>
          <Col xs={24} lg={9}>
            <AssignmentOverviewWidget assignments={assignments} />
          </Col>
          <Col xs={24} lg={6}>
            <UpcomingExamsWidget exams={exams} />
          </Col>
        </Row>
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 3 — AI LEARNING INSIGHT
          Compact, collapsible recommendations
      ═══════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader
          emoji="🤖"
          title="AI Learning Insights"
          subtitle="Phân tích cá nhân hoá từ hệ thống AI"
        />
        <LearningInsightsWidget insight={learningInsight} />
      </div>

      {/* ═══════════════════════════════════════════════════════
          SECTION 4 — LEARNING PERFORMANCE
          Score + Stats + Progress (long-term tracking)
      ═══════════════════════════════════════════════════════ */}
      <div style={{ marginBottom: 32 }}>
        <SectionHeader
          emoji="📊"
          title="Thành tích học tập"
          subtitle="Theo dõi hiệu suất dài hạn của bạn"
        />

        {/* Row 4a: Score + Stats */}
        <Row gutter={[20, 20]} style={{ marginBottom: 20 }}>
          <Col xs={24} lg={10}>
            <LearningScoreCard score={learningScore} />
          </Col>
          <Col xs={24} lg={14}>
            <LearningStatsWidget statistics={statistics} />
          </Col>
        </Row>

        {/* Row 4b: Class Progress */}
        <ClassProgressWidget classProgress={classProgress} />
      </div>

      {/* ═══════════════════════════════════════════════════════
          QUICK ACTIONS — Full width
      ═══════════════════════════════════════════════════════ */}
      <Divider
        style={{ margin: "0 0 24px 0", borderColor: "#f0f0f0" }}
      />
      <div>
        <SectionHeader
          emoji="⚡"
          title="Thao tác nhanh"
          subtitle="Truy cập nhanh các tính năng thường dùng"
        />
        <StudentQuickActions />
      </div>

      {/* ═══════════════════════════════════════════════════════
          Announcements — Full width at bottom
      ═══════════════════════════════════════════════════════ */}
      <div>
        <SectionHeader
          emoji="🔔"
          title="Thông báo gần đây"
          subtitle="Cập nhật mới nhất từ giảng viên"
        />
        <AnnouncementsTimelineWidget announcements={announcements} />
      </div>
    </div>
  );
});

DashboardContent.displayName = "DashboardContent";

// ─── Page Wrapper ─────────────────────────────────────────────────────────────
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
