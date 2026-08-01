import { Typography } from "antd";

const TeacherAssignmentHeader = () => {
  return (
    <div style={{ marginBottom: 16 }}>
      <Typography.Title level={3} style={{ marginBottom: 4 }}>
        Teacher Assignment
      </Typography.Title>
      <Typography.Paragraph style={{ margin: 0, color: "#64748b" }}>
        Assign, update, and manage teacher responsibilities across classes.
      </Typography.Paragraph>
    </div>
  );
};

export default TeacherAssignmentHeader;
