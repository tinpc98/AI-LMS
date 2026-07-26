import React, { useState, useEffect, useCallback } from "react";
import { Row, Col, Alert, Result, Button, Skeleton, Space, Spin } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import { useAuth } from "../../hooks/useAuth";
import { classApi } from "../../api/classApi";
import axiosClient from "../../api/axiosClient";

import { TeacherWelcomeHeader } from "../../components/teacher/TeacherWelcomeHeader";
import { TeacherQuickStats } from "../../components/teacher/TeacherQuickStats";
import { TeacherQuickActions } from "../../components/teacher/TeacherQuickActions";
import { TeacherScheduleWidget } from "../../components/teacher/TeacherScheduleWidget";
import { TeacherClassroomsGrid } from "../../components/teacher/TeacherClassroomsGrid";
import { TeacherAnnouncementsWidget } from "../../components/teacher/TeacherAnnouncementsWidget";
import { TeacherAssignmentsWidget } from "../../components/teacher/TeacherAssignmentsWidget";
import { TeacherLiveSessionWidget } from "../../components/teacher/TeacherLiveSessionWidget";

export default function HomePageTeacher() {
  const { user } = useAuth();

  // State Management
  const [classes, setClasses] = useState<any[]>([]);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [activeLiveSessions, setActiveLiveSessions] = useState<any[]>([]);

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch real data from Backend
  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch Classes
      const classRes = await classApi.getMyClasses();
      const rawClasses = classRes.data?.data || classRes.data?.classList || classRes.data || [];
      const classList = Array.isArray(rawClasses) ? rawClasses : [];
      setClasses(classList);

      // 2. Fetch Announcements
      try {
        const annRes = await axiosClient.get("/api/announcements");
        const rawAnn = annRes.data?.data || annRes.data?.items || annRes.data || [];
        setAnnouncements(Array.isArray(rawAnn) ? rawAnn : []);
      } catch (e) {
        console.warn("[Teacher Dashboard] Announcements fetch warning:", e);
      }

      // 3. Fetch Assignments for assigned classes
      try {
        if (classList.length > 0) {
          const assignmentPromises = classList.slice(0, 5).map((cls: any) =>
            axiosClient.get(`/api/assignments/class/${cls._id}`).catch(() => null)
          );
          const assignmentResults = await Promise.all(assignmentPromises);
          const aggregatedAssignments: any[] = [];
          assignmentResults.forEach((res) => {
            if (res?.data?.assignments) {
              aggregatedAssignments.push(...res.data.assignments);
            }
          });
          setAssignments(aggregatedAssignments);
        }
      } catch (e) {
        console.warn("[Teacher Dashboard] Assignments fetch warning:", e);
      }

      // 4. Fetch Active Live Sessions
      try {
        if (classList.length > 0) {
          const livePromises = classList.slice(0, 5).map((cls: any) =>
            axiosClient.get(`/api/live/active/${cls._id}`).catch(() => null)
          );
          const liveResults = await Promise.all(livePromises);
          const activeSessions = liveResults
            .filter((res) => res?.data?.data && res.data.data.status === "Live")
            .map((res) => res.data.data);
          setActiveLiveSessions(activeSessions);
        }
      } catch (e) {
        console.warn("[Teacher Dashboard] Live Sessions fetch warning:", e);
      }

    } catch (err: any) {
      console.error("[Teacher Dashboard] Fetch Error:", err);
      setError(err.message || "Lỗi khi tải dữ liệu từ máy chủ. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Aggregate Stats
  const totalStudentsCount = classes.reduce((sum, c) => {
    const studentCount = c.currentStudents ?? (Array.isArray(c.students) ? c.students.length : 0);
    return sum + studentCount;
  }, 0);

  return (
    <div style={{ padding: "24px", maxWidth: 1400, margin: "0 auto", backgroundColor: "#f8f9fa", minHeight: "100vh" }}>
      {/* 1. Header Section */}
      <TeacherWelcomeHeader
        fullName={user?.fullName}
        email={user?.email}
        avatar={user?.avatar}
        loading={loading}
        onRefresh={fetchDashboardData}
      />

      {/* Error Alert State */}
      {error && (
        <Alert
          message="Lỗi kết nối dữ liệu"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" type="primary" danger icon={<ReloadOutlined />} onClick={fetchDashboardData}>
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
