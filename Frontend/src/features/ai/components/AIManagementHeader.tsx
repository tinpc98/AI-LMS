import { Typography } from "antd";

const AIManagementHeader = () => {
  return (
    <div style={{ marginBottom: 16 }}>
      <Typography.Title level={3} style={{ marginBottom: 4 }}>
        AI Management
      </Typography.Title>
      <Typography.Paragraph style={{ margin: 0, color: "var(--color-text-description)" }}>
        System-wide AI infrastructure governance, prompt repository, knowledge indexing, and rate
        limit configuration.
      </Typography.Paragraph>
    </div>
  );
};

export default AIManagementHeader;
