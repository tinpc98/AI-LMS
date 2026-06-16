import { useState } from "react";
import { Route, Routes } from "react-router-dom";

import "./App.css";
import HomeLayoutTeacher from "./components/HomeLayoutTeacher";
import RegistrationPage from "./pages/RegistrationPage";
import LoginPage from "./pages/LoginPage";
import HomeLayoutStudent from "./components/HomeLayoutStudent";

function App() {
  return (
    <>
      {/* <Routes>
        <Route path="/" element={<HomeLayoutTeacher />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
      </Routes> */}

      <Routes>
        <Route path="/" element={<HomeLayoutStudent />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegistrationPage />} />
      </Routes>
    </>
  );
}

export default App;
