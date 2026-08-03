import React, { lazy, Suspense } from "react";
import { Route, Routes, useParams, Navigate } from "react-router-dom";
import { Spin } from "antd";
import "./App.css";
import { ThemeProvider } from "./shared/context/ThemeContext";
import { BreadcrumbProvider } from "./shared/context/BreadcrumbContext";

import ToastContainer from "./shared/components/ToastContainer";
import PublicRoute from "./shared/components/routing/PublicRoute";
import ProtectedRoute from "./shared/components/routing/ProtectedRoute";
import RoleRedirector from "./shared/components/routing/RoleRedirector";

// Auth Components (Lazy Loaded)
const LoginPage = lazy(() => import("./features/auth/pages/LoginPage"));

// Student Components (Lazy Loaded)
const HomeLayoutStudent = lazy(() => import("./shared/components/layout/HomeLayoutStudent"));
const HomePageStudent = lazy(() => import("./features/learning/pages/HomePageStudent"));
const MyClasses = lazy(() => import("./features/class/pages/MyClasses"));
const StudentAssignment = lazy(() => import("./features/assignment/pages/StudentAssignment"));
const ClassDetail = lazy(() => import("./features/class/pages/ClassDetail"));
const LessonView = lazy(() => import("./features/lesson/pages/LessonView"));
const NotificationCenterPage = lazy(
  () => import("./features/notification/pages/NotificationCenterPage")
);
const ExamPage = lazy(() => import("./features/exam/pages/ExamPage"));

// Teacher Components (Lazy Loaded)
const HomeLayoutTeacher = lazy(() => import("./shared/components/layout/HomeLayoutTeacher"));
const HomePageTeacher = lazy(() => import("./features/dashboard/pages/HomePageTeacher"));
const ClassManagement = lazy(() => import("./features/class/pages/ClassroomManagement"));
const ClassroomDetail = lazy(() => import("./features/class/pages/ClassroomDetail"));
const QuestionBank = lazy(() => import("./features/exam-set/pages/QuestionBank"));
const ExamResults = lazy(() => import("./features/exam/pages/ExamResults"));
const ExamAttemptDetail = lazy(() => import("./features/exam/pages/ExamAttemptDetail"));

// Admin Components (Lazy Loaded)
const AdminLayout = lazy(() => import("./shared/components/layout/AdminLayout"));
const DashboardPage = lazy(() => import("./features/dashboard/DashboardPage"));
const AccountManagementPage = lazy(() => import("./features/account/AccountManagementPage"));
const CourseManagementPage = lazy(() => import("./features/course/CourseManagementPage"));
const ClassManagementPage = lazy(() => import("./features/class/ClassManagementPage"));
const TeacherAssignmentPage = lazy(
  () => import("./features/teacher-assignment/TeacherAssignmentPage")
);
const AIManagementPage = lazy(() => import("./features/ai/AIManagementPage"));
const ReportPage = lazy(() => import("./features/report/pages/ReportPage"));
const ProfilePage = lazy(() => import("./features/profile/pages/ProfilePage"));
const AdminPage = lazy(() => import("./shared/components/PlaceholderPage"));

const LiveSessionLayout = lazy(() => import("./shared/components/layout/LiveSessionLayout"));
const LiveSessionPage = lazy(() => import("./features/live-session/pages/LiveSessionPage"));

// Design System Demo Route (Dev only)
const DesignSystemDemoPage = lazy(
  () => import("./features/design-system/DesignSystemDemoPage")
);

const PageLoadingFallback = () => (
  <div
    style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}
  >
    <Spin size="large" tip="Đang tải trang..." />
  </div>
);

// Legacy Redirect Handler cho tuyến đường /classdetail/:classId cũ
const LegacyClassDetailRedirect = () => {
  const { classId } = useParams<{ classId: string }>();
  return <Navigate to={`/student/classdetail/${classId || ""}`} replace />;
};

function App() {
  return (
    <ThemeProvider>
      <BreadcrumbProvider>
        <ToastContainer />
        <Suspense fallback={<PageLoadingFallback />}>
          <Routes>
            {/* Root Redirector */}
            <Route path="/" element={<RoleRedirector />} />

            {/* Design System Showcase Route */}
            <Route path="/design-system" element={<DesignSystemDemoPage />} />

            {/* ================= PUBLIC / AUTH ROUTES ================= */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* ================= STUDENT PROTECTED ROUTES ================= */}
            <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
              {/* Tuyến đường /student làm prefix chính cho Student Module */}
              <Route path="/student" element={<HomeLayoutStudent />}>
                <Route index element={<HomePageStudent />} />
                <Route path="dashboard" element={<HomePageStudent />} />
                <Route path="myclasses" element={<MyClasses />} />
                <Route path="studentassignment" element={<StudentAssignment />} />
                <Route path="classdetail/:classId" element={<ClassDetail />} />
                <Route path="studentassignment/:assignmentId" element={<StudentAssignment />} />
                <Route path="lessonview/:lessonId" element={<LessonView />} />
                <Route path="notifications" element={<NotificationCenterPage />} />
              </Route>

              {/* Live Session Route cho Student (Full màn hình, không Header/Sidebar) */}
              <Route path="/student/live" element={<LiveSessionLayout />}>
                <Route path=":sessionId" element={<LiveSessionPage />} />
              </Route>

              {/* Legacy redirect tương thích ngược cho link cũ /classdetail/:classId */}
              <Route path="/classdetail/:classId" element={<LegacyClassDetailRedirect />} />

              <Route path="/exam/:attemptId" element={<ExamPage />} />
            </Route>

            {/* ================= TEACHER PROTECTED ROUTES ================= */}
            <Route element={<ProtectedRoute allowedRoles={["teacher"]} />}>
              <Route path="/teacher" element={<HomeLayoutTeacher />}>
                <Route index element={<HomePageTeacher />} />
                <Route path="classes" element={<ClassManagement />} />
                <Route path="classroom-detail/:classId" element={<ClassroomDetail />} />
                <Route path="questionbank" element={<QuestionBank />} />
                <Route path="examresults/:examId" element={<ExamResults />} />
                <Route path="exam-review/:attemptId" element={<ExamAttemptDetail />} />
              </Route>

              {/* Live Session Route cho Teacher (Full màn hình, không Header/Sidebar) */}
              <Route path="/teacher/live" element={<LiveSessionLayout />}>
                <Route path=":sessionId" element={<LiveSessionPage />} />
              </Route>
            </Route>

            {/* ================= ADMIN PROTECTED ROUTES ================= */}
            <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="accounts" element={<AccountManagementPage />} />
                <Route path="courses" element={<CourseManagementPage />} />
                <Route path="classes" element={<ClassManagementPage />} />
                <Route path="teacher-assignment" element={<TeacherAssignmentPage />} />
                <Route path="ai-management" element={<AIManagementPage />} />
                <Route path="reports" element={<ReportPage />} />
                <Route path="profile" element={<ProfilePage />} />
                <Route
                  path="system"
                  element={
                    <AdminPage
                      title="System Management"
                      description="Configure system-wide settings."
                    />
                  }
                />
              </Route>
            </Route>

            {/* ================= 404 NOT FOUND ================= */}
            <Route
              path="*"
              element={<h2 style={{ textAlign: "center", marginTop: 40 }}>Trang không tồn tại!</h2>}
            />
          </Routes>
        </Suspense>
      </BreadcrumbProvider>
    </ThemeProvider>
  );
}

export default App;
