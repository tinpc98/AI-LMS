import { Route, Routes } from "react-router-dom";
import "./App.css";

// Auth Components
import LoginPage from "./pages/auth/LoginPage";

// Student Components
import HomeLayoutStudent from "./components/layout/HomeLayoutStudent";
import ExamPage from "./pages/students/ExamPage";
import LessonView from "./pages/students/LessonView";
import MyClasses from "./pages/students/MyClasses";
import StudentAssignment from "./pages/students/StudentAssignment";
import HomePageStudent from "./pages/students/HomePageStudent";

// Teacher Components
import HomePageTeacher from "./pages/teachers/HomePageTeacher";
import ClassroomDetail from "./pages/teachers/ClassroomDetail";
import ClassManagement from "./pages/teachers/ClassroomManagement";
import ExamAttemptDetail from "./pages/teachers/ExamAttemptDetail.tsx";
import HomeLayoutTeacher from "./components/layout/HomeLayoutTeacher";
import ClassDetail from "./pages/students/ClassDetail";
import QuestionBank from "./pages/teachers/QuestionBank";
import ExamResults from "./pages/teachers/ExamResults";

import ToastContainer from "./components/common/ToastContainer";
import PublicRoute from "./components/common/PublicRoute";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminLayout from "./components/layout/AdminLayout";
import AdminPage from "./pages/admin/AdminPage";
import AccountManagementPage from "./features/accountManagement/AccountManagementPage";
import CourseManagementPage from "./features/courseManagement/CourseManagementPage";
import ClassManagementPage from "./features/classManagement/ClassManagementPage";
import TeacherAssignmentPage from "./features/teacherAssignment/TeacherAssignmentPage";
import AIManagementPage from "./features/aiManagement/AIManagementPage";

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* ================= PUBLIC / AUTH ROUTES ================= */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>

        {/* ================= STUDENT PROTECTED ROUTES ================= */}
        <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
          <Route path="/" element={<HomeLayoutStudent />}>
            <Route index element={<HomePageStudent />} />
            <Route path="myclasses" element={<MyClasses />} />
            <Route path="studentassignment" element={<StudentAssignment />} />
          </Route>
          <Route path="classdetail/:classId" element={<ClassDetail />} />
          <Route path="studentassignment/:assignmentId" element={<StudentAssignment />} />
          <Route path="lessonview" element={<LessonView />} />
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
        </Route>

        {/* ================= ADMIN PROTECTED ROUTES ================= */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminPage title="Dashboard" description="Welcome to the admin dashboard." />} />
          <Route path="accounts" element={<AccountManagementPage />} />
          <Route path="courses" element={<CourseManagementPage />} />
          <Route path="classes" element={<ClassManagementPage />} />
          <Route path="teacher-assignment" element={<TeacherAssignmentPage />} />
          <Route path="ai-management" element={<AIManagementPage />} />
          <Route path="reports" element={<AdminPage title="Reports" description="Review system and learning reports." />} />
          <Route path="system" element={<AdminPage title="System Management" description="Configure system-wide settings." />} />
        </Route>

        {/* ================= 404 NOT FOUND ================= */}
        <Route path="*" element={<h2>Trang không tồn tại!</h2>} />
      </Routes>
    </>
  );
}

export default App;
