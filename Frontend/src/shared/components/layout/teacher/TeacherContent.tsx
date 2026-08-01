import React from "react";
import { Layout } from "antd";

const { Content } = Layout;

interface TeacherContentProps {
  children: React.ReactNode;
}

export const TeacherContent: React.FC<TeacherContentProps> = React.memo(({ children }) => {
  return (
    <Content
      style={{
        margin: 0,
        padding: 0,
        minHeight: "calc(100vh - 64px)",
        backgroundColor: "#f5f5f5",
        overflowX: "hidden",
      }}
    >
      {children}
    </Content>
  );
});

TeacherContent.displayName = "TeacherContent";
