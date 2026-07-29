import React, { lazy, Suspense } from "react";
import { Route, Routes, useParams, Navigate } from "react-router-dom";
import { Spin } from "antd";
import "./App.css";

import ToastContainer from "./components/common/ToastContainer";
import PublicRoute from "./components/common/PublicRoute";
import ProtectedRoute from "./components/common/ProtectedRoute";
import RoleRedirector from "./components/common/RoleRedirector";

// Auth Components (Lazy Loaded)
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));

// Student Components (Lazy Loaded)
const HomeLayoutStudent = lazy(() => import("./components/layout/HomeLayoutStudent"));
const HomePageStudent = lazy(() => import("./pages/students/HomePageStudent"));
const MyClasses = lazy(() => import("./pages/students/MyClasses"));
const StudentAssignment = lazy(() => import("./pages/students/StudentAssignment"));
const ClassDetail = lazy(() => import("./pages/students/ClassDetail"));
const LessonView = lazy(() => import("./pages/students/LessonView"));
const NotificationCenterPage = lazy(() => import("./pages/students/NotificationCenterPage"));
const ExamPage = lazy(() => import("./pages/students/ExamPage"));

// Teacher Components (Lazy Loaded)
const HomeLayoutTeacher = lazy(() => import("./components/layout/HomeLayoutTeacher"));
const HomePageTeacher = lazy(() => import("./pages/teachers/HomePageTeacher"));
const ClassManagement = lazy(() => import("./pages/teachers/ClassroomManagement"));
const ClassroomDetail = lazy(() => import("./pages/teachers/ClassroomDetail"));
const QuestionBank = lazy(() => import("./pages/teachers/QuestionBank"));
const ExamResults = lazy(() => import("./pages/teachers/ExamResults"));
const ExamAttemptDetail = lazy(() => import("./pages/teachers/ExamAttemptDetail"));

// Admin Components (Lazy Loaded)
const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));
const DashboardPage = lazy(() => import("./features/dashboard/DashboardPage"));
const AccountManagementPage = lazy(() => import("./features/accountManagement/AccountManagementPage"));
const CourseManagementPage = lazy(() => import("./features/courseManagement/CourseManagementPage"));
const ClassManagementPage = lazy(() => import("./features/classManagement/ClassManagementPage"));
const TeacherAssignmentPage = lazy(() => import("./features/teacherAssignment/TeacherAssignmentPage"));
const AIManagementPage = lazy(() => import("./features/aiManagement/AIManagementPage"));
const ReportPage = lazy(() => import("./pages/Report/ReportPage"));
const ProfilePage = lazy(() => import("./pages/admin/Profile/ProfilePage"));
const AdminPage = lazy(() => import("./pages/admin/AdminPage"));

const LiveSessionLayout = lazy(() => import("./components/layout/LiveSessionLayout"));
const LiveSessionPage = lazy(() => import("./pages/live/LiveSessionPage"));

const PageLoadingFallback = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
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
    <>
      <ToastContainer />
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          {/* Root Redirector */}
          <Route path="/" element={<RoleRedirector />} />

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
              <Route path="lessonview" element={<LessonView />} />
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
              <Route path="system" element={<AdminPage title="System Management" description="Configure system-wide settings." />} />
            </Route>
          </Route>

          {/* ================= 404 NOT FOUND ================= */}
          <Route path="*" element={<h2 style={{ textAlign: "center", marginTop: 40 }}>Trang không tồn tại!</h2>} />
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
