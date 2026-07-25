import { Route, Routes } from "react-router-dom";
import "./App.css";

// Auth Components
import LoginPage from "./pages/auth/LoginPage";
import RegistrationPage from "./pages/auth/RegistrationPage";

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
import LessonManagement from "./pages/teachers/LessonManagement";
import HomeLayoutTeacher from "./components/layout/HomeLayoutTeacher";
import ClassDetail from "./pages/students/ClassDetail";
import ExamManagement from "./pages/teachers/ExamManagement";
import QuestionBank from "./pages/teachers/QuestionBank";
import ExamResults from "./pages/teachers/ExamResults";

import ToastContainer from "./components/common/ToastContainer";
import PublicRoute from "./components/common/PublicRoute";
import ProtectedRoute from "./components/common/ProtectedRoute";
import AdminLayout from "./components/layout/AdminLayout";
import AdminPage from "./pages/admin/AdminPage";
import AccountManagementPage from "./features/accountManagement/AccountManagementPage";

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* ================= PUBLIC / AUTH ROUTES ================= */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegistrationPage />} />
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
            <Route path="classroom-detail/:classId" element={<ClassroomDetail />} />
            <Route path="classroom-management" element={<ClassManagement />} />
            <Route path="lessonManagement" element={<LessonManagement />} />
            <Route path="questionbank" element={<QuestionBank />} />
            <Route path="exammanagement" element={<ExamManagement />} />
            <Route path="examresults/:examId" element={<ExamResults />} />
            <Route path="exam-review/:attemptId" element={<ExamAttemptDetail />} />
          </Route>
        </Route>

        {/* ================= ADMIN PROTECTED ROUTES ================= */}
        {/* <Route element={<ProtectedRoute allowedRoles={["admin"]} />}> */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminPage title="Dashboard" description="Welcome to the admin dashboard." />} />
          <Route path="accounts" element={<AccountManagementPage />} />
          <Route path="courses" element={<AdminPage title="Course Management" description="Manage training courses and curriculum." />} />
          <Route path="classes" element={<AdminPage title="Class Management" description="Manage classes and class details." />} />
          <Route path="teacher-assignment" element={<AdminPage title="Teacher Assignment" description="Assign teachers to classes." />} />
          <Route path="ai-management" element={<AdminPage title="AI Management" description="Manage AI-enabled features and tools." />} />
          <Route path="reports" element={<AdminPage title="Reports" description="Review system and learning reports." />} />
          <Route path="system" element={<AdminPage title="System Management" description="Configure system-wide settings." />} />
        </Route>
        {/* </Route> */}

        {/* ================= 404 NOT FOUND ================= */}
        <Route path="*" element={<h2>Trang không tồn tại!</h2>} />
      </Routes>
    </>
  );
}

export default App;
