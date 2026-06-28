import { Route, Routes } from "react-router-dom";
import "./App.css";

// Auth Components
import LoginPage from "./pages/auth/LoginPage";
import RegistrationPage from "./pages/auth/RegistrationPage";

// Student Components
import HomeLayoutStudent from "./components/layout/HomeLayoutStudent";
import ExamPage from "./pages/students/ExamPage";
import ClassroomDetail from "./pages/students/ClassroomDetail";
import LessonView from "./pages/students/LessonView";
import MyClasses from "./pages/students/MyClasses";
import StudentAssignment from "./pages/students/StudentAssignment";
import HomePageStudent from "./pages/students/HomePageStudent";

// Teacher Components

// import QuestionBankContent from "./pages/teachers/QuestionBank";

function App() {
  return (
    <Routes>
      {/* ================= AUTH ROUTES (Dùng chung Layout nếu cần) ================= */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegistrationPage />} />

      {/* ================= STUDENT ROUTES ================= */}
      <Route path="/" element={<HomeLayoutStudent />}>
        <Route index element={<HomePageStudent />} />
        <Route path="classroomdetail" element={<ClassroomDetail />} />
        <Route path="myclasses" element={<MyClasses />} />
        <Route path="studentassignment" element={<StudentAssignment />} />
      </Route>
      <Route path="lessonview" element={<LessonView />} />
      <Route path="exam" element={<ExamPage />} />

      {/* ================= TEACHER ROUTES ================= */}
      {/* <Route path="/teacher" element={<TeacherLayout />}>
        <Route index element={<TeacherHome />} /> 
        <Route path="question-bank" element={<QuestionBankContent />} /> 
      </Route> */}

      {/* ================= ADMIN ROUTES ================= */}
      {/* <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminHome />} /> 
        
      </Route> */}

      {/* ================= 404 NOT FOUND (Tùy chọn) ================= */}
      <Route path="*" element={<h2>Trang không tồn tại!</h2>} />
    </Routes>
  );
}

export default App;
