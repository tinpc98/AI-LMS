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

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        {/* ================= AUTH ROUTES (Dùng chung Layout nếu cần) ================= */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />

        {/* ================= STUDENT ROUTES ================= */}
        <Route path="/" element={<HomeLayoutStudent />}>
          <Route index element={<HomePageStudent />} />
          <Route path="myclasses" element={<MyClasses />} />
          <Route path="studentassignment" element={<StudentAssignment />} />
        </Route>
        <Route path="classdetail/:classId" element={<ClassDetail />} />
        <Route path="studentassignment/:assignmentId" element={<StudentAssignment />} />
        <Route path="lessonview" element={<LessonView />} />
        <Route path="/exam/:attemptId" element={<ExamPage />} />

        {/* ================= TEACHER ROUTES ================= */}
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

        {/* ================= ADMIN ROUTES ================= */}
        {/* <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminHome />} /> 
          
        </Route> */}

        {/* ================= 404 NOT FOUND (Tùy chọn) ================= */}
        <Route path="*" element={<h2>Trang không tồn tại!</h2>} />
      </Routes>
    </>
  );
}

export default App;
