import React from "react";
import { Outlet } from "react-router-dom";
import SidebarStudent from "./SidebarStudent";
import HeaderStudent from "./HeaderStudent";

const HomeLayoutStudent = () => {
  return (
    <div className="flex min-h-screen bg-background font-body-md text-body-md selection:bg-primary-container selection:text-on-primary-container">
      <SidebarStudent />

      <div className="flex flex-col flex-grow min-w-0">
        <HeaderStudent />

        <main className="p-6 flex-grow overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default HomeLayoutStudent;
