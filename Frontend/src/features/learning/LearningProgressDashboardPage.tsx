import React, { useMemo } from "react";
import { Row, Col, Alert, Card, Typography, List, Tag, Button, Space } from "antd";
import {
  ClockCircleOutlined,
  CalendarOutlined,
  ExclamationCircleOutlined,
  PlayCircleFilled,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import PageContainer from "../../shared/components/PageContainer";
import {
  LearningDashboardProvider,
  useLearningDashboardContext,
} from "./context/LearningDashboardContext";
import DashboardErrorBoundary from "./components/DashboardErrorBoundary";
import DashboardLoadingSkeleton from "./components/DashboardLoadingSkeleton";
import StudentWelcomeBanner from "./components/dashboard/StudentWelcomeBanner";
import AchievementsCard from "./components/dashboard/AchievementsCard";
import { tokens } from "../../shared/theme/tokens";
import { ClassCard } from "../class/components/classes/ClassCard";
import { sortClassesByUpcomingSession } from "./utils/learningDashboard.utils";
import { mapToStudentClass } from "../../api/studentClassApi";

const { Title, Text } = Typography;

// ─── Dashboard Content ─────────────────────────────────────────────────────────
const DashboardContent: React.FC = React.memo(() => {
  const navigate = useNavigate();
  const { overview, assignments, exams, rawClasses, loading, error, refresh } =
    useLearningDashboardContext();

  // Gom nhóm Deadline (Assignments + Exams)
  const upcomingDeadlines = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      type: "assignment" | "exam";
      deadline: Date;
      link: string;
      classId?: string;
    }> = [];

    assignments.forEach((a) => {
      const deadline = (a as any).deadline || a.dueDate;
      if (deadline) {
        items.push({
          id: String((a as any)._id || a.id),
          title: a.title,
          type: "assignment",
          deadline: new Date(deadline),
          link: `/student/studentassignment/${(a as any)._id || a.id}`,
          classId: String((a as any).classId?._id || (a as any).classId),
        });
      }
    });

    exams.forEach((e) => {
      if (e.startTime) {
        items.push({
          id: String((e as any)._id || e.id),
          title: e.title,
          type: "exam",
          deadline: new Date(e.startTime),
          link: `/student/exams`, // Route tổng hợp thi
          classId: String((e as any).classId),
        });
      }
    });

    // Sắp xếp tăng dần theo thời gian
    return items.sort((a, b) => a.deadline.getTime() - b.deadline.getTime()).slice(0, 5); // Lấy 5 cái gần nhất
  }, [assignments, exams]);

  const sortedClasses = useMemo(() => {
    const mappedClasses = (rawClasses || []).map((cls: any) => mapToStudentClass(cls));
    return sortClassesByUpcomingSession(mappedClasses);
  }, [rawClasses]);

  if (loading) {
    return <DashboardLoadingSkeleton />;
  }

  return (
    <div style={{ paddingBottom: tokens.space[6] }}>
      {/* Error Alert */}
      {error && (
        <Alert
          type="error"
          title="Lỗi tải dữ liệu"
          description={error}
          showIcon
          style={{ marginBottom: tokens.space[5], borderRadius: tokens.radius.md }}
        />
      )}

      {/* Welcome Banner */}
      <StudentWelcomeBanner
        totalClassesCount={overview.totalClasses}
        pendingAssignmentsCount={overview.pendingAssignmentsCount}
        upcomingExamsCount={overview.upcomingExamsCount}
        unreadAnnouncementsCount={overview.unreadAnnouncementsCount}
        onRefresh={refresh}
        loading={loading}
      />

      <div style={{ marginTop: tokens.space[5] }}>
        <Row gutter={[24, 24]}>
          {/* ═══════════════════════════════════════════════════════
              WIDGET 1 — Danh sách lớp học (Grid)
          ═══════════════════════════════════════════════════════ */}
          <Col span={24}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Title level={4} style={{ margin: 0, display: "flex", alignItems: "center" }}>
                <CalendarOutlined
                  style={{ color: tokens.color.action.primaryBg, marginRight: 8 }}
                />
                Danh sách lớp học
              </Title>
              <Button type="link" onClick={() => navigate("/student/myclasses")}>
                Xem tất cả
              </Button>
            </div>

            {sortedClasses.length === 0 ? (
              <Card style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}>
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 0",
                    color: tokens.color.text.description,
                  }}
                >
                  <CalendarOutlined style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }} />
                  <p>Bạn chưa tham gia lớp học nào.</p>
                </div>
              </Card>
            ) : (
              <Row gutter={[24, 24]}>
                {sortedClasses.slice(0, 6).map((cls) => (
                  <Col xs={24} sm={12} lg={8} key={cls._id || cls.id}>
                    <ClassCard item={cls} />
                  </Col>
                ))}
              </Row>
            )}
          </Col>

          {/* ═══════════════════════════════════════════════════════
              WIDGET 2 — Thành tích của tôi (Level/XP + Badge)
          ═══════════════════════════════════════════════════════ */}
          <Col xs={24} lg={12}>
            <AchievementsCard />
          </Col>

          {/* ═══════════════════════════════════════════════════════
              WIDGET 3 — Deadline sắp tới
          ═══════════════════════════════════════════════════════ */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <>
                  <ExclamationCircleOutlined
                    style={{ color: tokens.color.semantic.warning.base, marginRight: 8 }}
                  />{" "}
                  Deadline sắp tới
                </>
              }
              style={{ borderRadius: 16, boxShadow: "0 2px 8px rgba(0,0,0,0.08)", height: "100%" }}
            >
              {upcomingDeadlines.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "32px 0",
                    color: tokens.color.text.description,
                  }}
                >
                  <p>Tuyệt vời! Bạn không có bài tập hay kỳ thi nào sắp tới.</p>
                </div>
              ) : (
                <List
                  dataSource={upcomingDeadlines}
                  renderItem={(item) => {
                    const hoursLeft = dayjs(item.deadline).diff(dayjs(), "hour");
                    const isUrgent = hoursLeft > 0 && hoursLeft < 24;
                    const isOverdue = hoursLeft <= 0;

                    return (
                      <List.Item
                        style={{
                          padding: "12px",
                          borderBottom: `1px solid ${tokens.color.border.default}`,
                          backgroundColor: isUrgent ? "#fff1f0" : "transparent",
                          borderRadius: isUrgent ? 8 : 0,
                          marginBottom: 4,
                        }}
                      >
                        <List.Item.Meta
                          title={
                            <Link
                              to={item.link}
                              style={{
                                color: isUrgent ? tokens.color.semantic.error.base : "inherit",
                                fontWeight: 600,
                              }}
                            >
                              {item.type === "assignment" ? "📝 Bài tập: " : "⏱️ Kỳ thi: "}{" "}
                              {item.title}
                            </Link>
                          }
                          description={
                            <Text
                              type="secondary"
                              style={{
                                color: isUrgent ? tokens.color.semantic.error.base : undefined,
                              }}
                            >
                              Hạn: {dayjs(item.deadline).format("DD/MM/YYYY HH:mm")}
                              {isUrgent && (
                                <span style={{ marginLeft: 8, fontWeight: "bold" }}>
                                  {" "}
                                  (CÒN {hoursLeft} GIỜ)
                                </span>
                              )}
                              {isOverdue && (
                                <span style={{ marginLeft: 8, fontWeight: "bold", color: "red" }}>
                                  {" "}
                                  (ĐÃ QUÁ HẠN)
                                </span>
                              )}
                            </Text>
                          }
                        />
                      </List.Item>
                    );
                  }}
                />
              )}
            </Card>
          </Col>

          {/* ═══════════════════════════════════════════════════════
              WIDGET 4 — Đồng hồ đếm ngược (Mockup)
          ═══════════════════════════════════════════════════════ */}
          <Col xs={24} lg={12}>
            <Card
              style={{
                borderRadius: 16,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                height: "100%",
                background: "linear-gradient(135deg, #1890ff 0%, #0050b3 100%)",
                color: "#fff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
              }}
              styles={{ body: { width: "100%" } }}
            >
              <div>
                <Title
                  level={4}
                  style={{
                    color: "rgba(255,255,255,0.8)",
                    margin: 0,
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: 1,
                  }}
                >
                  Kỳ thi THPT Quốc Gia
                </Title>
                <div
                  style={{
                    fontSize: 72,
                    fontWeight: 900,
                    lineHeight: 1.1,
                    margin: "16px 0",
                    textShadow: "0 4px 12px rgba(0,0,0,0.15)",
                  }}
                >
                  120
                </div>
                <Text
                  style={{
                    fontSize: 20,
                    color: "rgba(255,255,255,0.9)",
                    fontWeight: 600,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                  }}
                >
                  Ngày Nữa
                </Text>
                <div style={{ marginTop: 24 }}>
                  <Button
                    type="default"
                    size="large"
                    shape="round"
                    style={{ fontWeight: 600, color: "#0050b3" }}
                    onClick={() => navigate("/student/myclasses")}
                  >
                    TIẾP TỤC ÔN LUYỆN
                  </Button>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
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
