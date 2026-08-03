import React from "react";
import { Layout } from "antd";
import { tokens } from "../../../theme/tokens";

const { Content } = Layout;

interface StudentContentProps {
  children: React.ReactNode;
}

export const StudentContent: React.FC<StudentContentProps> = React.memo(({ children }) => {
  return (
    <Content
      style={{
        margin: 0,
        padding: 0,
        minHeight: "calc(100vh - 64px)",
        backgroundColor: "var(--color-bg-page)",
        overflowX: "hidden",
      }}
    >
      {children}
    </Content>
  );
});

StudentContent.displayName = "StudentContent";

export default StudentContent;
