import { Badge, Descriptions, Drawer, Tag, Typography } from "antd";
import type { AIModel } from "../types/aiManagement.types";

interface ModelDrawerProps {
  open: boolean;
  model?: AIModel;
  onClose: () => void;
}

const ModelDrawer = ({ open, model, onClose }: ModelDrawerProps) => {
  if (!model) return null;

  return (
    <Drawer
      title="AI Model Specifications"
      placement="right"
      width={480}
      open={open}
      onClose={onClose}
    >
      <div style={{ marginBottom: 20 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {model.name}
        </Typography.Title>
        <Typography.Text type="secondary">
          {model.provider} • Version {model.version}
        </Typography.Text>
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <Tag color={model.status === "Active" ? "green" : "default"}>{model.status}</Tag>
          <Tag color="geekblue">Priority {model.priority}</Tag>
          {model.isDefault && <Badge status="success" text="Default Model" />}
        </div>
      </div>

      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Provider">{model.provider}</Descriptions.Item>
        <Descriptions.Item label="Model Name">{model.name}</Descriptions.Item>
        <Descriptions.Item label="Version">{model.version}</Descriptions.Item>
        <Descriptions.Item label="Priority">Level {model.priority}</Descriptions.Item>
        <Descriptions.Item label="Context Window">
          {model.maxContextTokens.toLocaleString()} tokens (
          {(model.maxContextTokens / 1000).toLocaleString()}k)
        </Descriptions.Item>
        <Descriptions.Item label="Default Status">
          {model.isDefault ? "Primary Default Model" : "Secondary / Specialty Model"}
        </Descriptions.Item>
        <Descriptions.Item label="Created At">
          {new Date(model.createdAt).toLocaleString("vi-VN")}
        </Descriptions.Item>
        <Descriptions.Item label="Last Updated">
          {new Date(model.updatedAt).toLocaleString("vi-VN")}
        </Descriptions.Item>
        <Descriptions.Item label="Description">
          {model.description || "No description provided."}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  );
};

export default ModelDrawer;
