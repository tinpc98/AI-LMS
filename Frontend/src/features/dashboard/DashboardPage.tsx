import React from "react";
import { Row, Col, Alert } from "antd";
import { useDashboardQuery } from "./hooks/useDashboardQuery";
//import { DashboardHeader } from "./components/DashboardHeader";
import { StatisticCards } from "./components/StatisticCards";
import { RegistrationChart } from "./components/RegistrationChart";
import { CourseDistributionChart } from "./components/CourseDistributionChart";
import { ClassStatusChart } from "./components/ClassStatusChart";
import { AIUsageChart } from "./components/AIUsageChart";
import { TodayClassesTable } from "./components/TodayClassesTable";
import { RecentUsersTable } from "./components/RecentUsersTable";
import { RecentActivities } from "./components/RecentActivities";
import { QuickAccess } from "./components/QuickAccess";

export const DashboardPage: React.FC = () => {
  const {
    loading,
    error,
    refetch,
    overviewCards,
    registrationChart,
    courseDistribution,
    classStatusChart,
    aiChart,
    recentClasses,
    recentUsers,
    activities,
  } = useDashboardQuery();

  return (
    <div style={{ padding: "8px 0" }}>
      {error && (
        <Alert
          message="Lỗi tải dữ liệu Dashboard"
          description={error.message}
          type="error"
          showIcon
          action={
            <span style={{ cursor: "pointer", fontWeight: 600 }} onClick={() => refetch()}>
              Thử lại
            </span>
          }
          style={{ marginBottom: "20px", borderRadius: "12px" }}
        />
      )}

      {/* 1. Welcome Header */}
      {/* <DashboardHeader onRefresh={() => refetch()} loading={loading} /> */}

      {/* 2. Overview Statistic 8 Cards */}
      <StatisticCards cards={overviewCards} loading={loading} />

      {/* 3. Quick Access Grid Cards */}
      <QuickAccess />

      {/* 4. Registration Analytics (Line Chart) & Course Distribution (Pie Chart) */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} lg={15} xl={16}>
          <RegistrationChart data={registrationChart} loading={loading} />
        </Col>
        <Col xs={24} lg={9} xl={8}>
          <CourseDistributionChart data={courseDistribution} loading={loading} />
        </Col>
      </Row>

      {/* 5. Class Status (Donut Chart) & AI Usage (Bar Chart) */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} lg={10} xl={9}>
          <ClassStatusChart data={classStatusChart} loading={loading} />
        </Col>
        <Col xs={24} lg={14} xl={15}>
          <AIUsageChart data={aiChart} loading={loading} />
        </Col>
      </Row>

      {/* 6. Today's Classes Table & Recent Users List */}
      <Row gutter={[16, 16]} style={{ marginBottom: "24px" }}>
        <Col xs={24} xl={16}>
          <TodayClassesTable classes={recentClasses} loading={loading} />
        </Col>
        <Col xs={24} xl={8}>
          <RecentUsersTable users={recentUsers} loading={loading} />
        </Col>
      </Row>

      {/* 7. Recent Activities Timeline */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <RecentActivities activities={activities} loading={loading} />
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
