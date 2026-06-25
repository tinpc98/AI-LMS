import { useState } from "react";
import { Route, Routes } from "react-router-dom";

import "./App.css";
import HomeLayoutTeacher from "./components/layout/HomeLayoutTeacher";
import RegistrationPage from "./pages/auth/RegistrationPage";
import LoginPage from "./pages/auth/LoginPage";
import HomeLayoutStudent from "./components/layout/HomeLayoutStudent";
import QuestionBankContent from "./pages/teachers/QuestionBank";
import ExamPage from "./pages/students/ExamPage";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<HomeLayoutStudent />} />
        <Route path="/teacher" element={<HomeLayoutTeacher />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
        <Route path="/questionbank" element={<QuestionBankContent />} />
        <Route path="/exampage" element={<ExamPage />} />
      </Routes>
    </>
  );
}

export default App;
