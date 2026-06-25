import React from "react";
import SidebarTeacher from "./SidebarTeacher";
import HeaderTeacher from "./HeaderTeacher";
import HomePageTeacher from "../../pages/teachers/HomePageTeacher";

const HomeLayoutTeacher = () => {
  return (
    <>
      <div className="font-body-md text-body-md selection:bg-primary-container selection:text-on-primary-container min-h-screen bg-background">
        <SidebarTeacher />
        <HeaderTeacher />
        <div className="flex-grow">
          {/* Gọi Component HomePageTeacher ra đây */}
          <HomePageTeacher />
        </div>
      </div>
    </>
  );
};

export default HomeLayoutTeacher;
