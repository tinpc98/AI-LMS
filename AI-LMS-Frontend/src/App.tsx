import { useState } from "react";
import { Route, Routes } from "react-router-dom";

import "./App.css";
import HeaderTeacher from "./component/HeaderTeacher";
import SidebarTeacher from "./component/SidebarTeacher";
import HomePageTeacher from "./pages/HomePageTeacher";
import SidebarStudent from "./component/SidebarStudent";
import HeaderStudent from "./component/HeaderStudent";
import HomePageStudent from "./pages/HomePageStudent";

function App() {
  return (
    // <>
    //   <SidebarTeacher />
    //   <HeaderTeacher />
    //   <Routes>
    //     <Route path="/" element={<HomePageTeacher />} />
    //   </Routes>
    // </>
    <>
      <SidebarStudent />
      <HeaderStudent />
      <Routes>
        <Route path="/" element={<HomePageStudent />} />
      </Routes>
    </>
  );
}

export default App;
