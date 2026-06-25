import React from "react";
import SidebarStudent from "./SidebarStudent";
import HeaderStudent from "./HeaderStudent";
import HomePageStudent from "../../pages/students/HomePageStudent";

const HomeLayoutStudent = () => {
  return (
    <>
      <div className="font-body-md text-body-md selection:bg-primary-container selection:text-on-primary-container min-h-screen bg-background">
        <SidebarStudent />
        <HeaderStudent />
        <div className="flex-grow">
          {/* Gọi Component HomePageTeacher ra đây */}
          <HomePageStudent />
        </div>
      </div>
    </>
  );
};

export default HomeLayoutStudent;
