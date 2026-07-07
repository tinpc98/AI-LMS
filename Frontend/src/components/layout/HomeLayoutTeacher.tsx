import React from "react";
import SidebarTeacher from "./SidebarTeacher";
// import HeaderTeacher from "./HeaderTeacher";
// import HomePageTeacher from "../../pages/teachers/HomePageTeacher";
import { Outlet } from "react-router-dom";

const HomeLayoutTeacher = () => {
  return (
    <>
      <div className="flex min-h-screen bg-background font-body-md text-body-md selection:bg-primary-container selection:text-on-primary-container">
        <SidebarTeacher />

        <div className="flex flex-col flex-grow min-w-0">
          {/* <HeaderTeacher /> */}

          <main className="p-6 flex-grow overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
};

export default HomeLayoutTeacher;
