import { Descriptions, Drawer, Tag, Typography } from "antd";
import type { KnowledgeDocument } from "../types/aiManagement.types";

interface KnowledgeDrawerProps {
  open: boolean;
  doc?: KnowledgeDocument;
  onClose: () => void;
}

const KnowledgeDrawer = ({ open, doc, onClose }: KnowledgeDrawerProps) => {
  if (!doc) return null;

  return (
    <Drawer
      title="Knowledge Document Details"
      placement="right"
      width={480}
      open={open}
      onClose={onClose}
    >
      <div style={{ marginBottom: 20 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {doc.name}
        </Typography.Title>
        <Typography.Text type="secondary">Uploaded by {doc.uploadedBy}</Typography.Text>
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <Tag color="blue">{doc.category}</Tag>
          <Tag
            color={doc.status === "Indexed" ? "green" : doc.status === "Pending" ? "orange" : "red"}
          >
            {doc.status}
          </Tag>
          <Tag color="purple">{doc.fileType.toUpperCase()}</Tag>
        </div>
      </div>

      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label="Document Name">{doc.name}</Descriptions.Item>
        <Descriptions.Item label="Category">{doc.category}</Descriptions.Item>
        <Descriptions.Item label="File Type">{doc.fileType.toUpperCase()}</Descriptions.Item>
        <Descriptions.Item label="File Size">{doc.fileSizeMB} MB</Descriptions.Item>
        <Descriptions.Item label="Vector Chunks">
          {doc.chunksCount > 0 ? `${doc.chunksCount.toLocaleString()} chunks` : "Not generated yet"}
        </Descriptions.Item>
        <Descriptions.Item label="Indexing Status">{doc.status}</Descriptions.Item>
        <Descriptions.Item label="Uploaded By">{doc.uploadedBy}</Descriptions.Item>
        <Descriptions.Item label="Created At">
          {new Date(doc.createdAt).toLocaleString("vi-VN")}
        </Descriptions.Item>
        <Descriptions.Item label="Last Updated / Re-indexed">
          {new Date(doc.updatedAt).toLocaleString("vi-VN")}
        </Descriptions.Item>
      </Descriptions>
    </Drawer>
  );
};

export default KnowledgeDrawer;
