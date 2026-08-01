import { Form, Input, InputNumber, Modal, Select } from "antd";
import type {
  KnowledgeCategory,
  KnowledgeDocument,
  KnowledgeFileType,
  KnowledgeStatus,
} from "../types/aiManagement.types";

interface AddKnowledgeModalProps {
  open: boolean;
  onSubmit: (
    values: Omit<KnowledgeDocument, "id" | "createdAt" | "updatedAt" | "chunksCount">
  ) => void;
  onCancel: () => void;
}

const AddKnowledgeModal = ({ open, onSubmit, onCancel }: AddKnowledgeModalProps) => {
  const [form] = Form.useForm();

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit({
        ...values,
        uploadedBy: "Admin Center",
      });
      form.resetFields();
    } catch {
      // validation error
    }
  };

  return (
    <Modal
      title="Add Knowledge Document"
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
      width={520}
    >
      <Form
        form={form}
        layout="vertical"
        style={{ marginTop: 12 }}
        initialValues={{
          category: "Toán" as KnowledgeCategory,
          fileType: "pdf" as KnowledgeFileType,
          fileSizeMB: 10,
          status: "Pending" as KnowledgeStatus,
        }}
      >
        <Form.Item
          name="name"
          label="Document Title"
          rules={[{ required: true, message: "Enter document title" }]}
        >
          <Input placeholder="e.g. Sách giáo khoa Toán 12 Nâng cao.pdf" />
        </Form.Item>

        <Form.Item name="category" label="Subject Category" rules={[{ required: true }]}>
          <Select
            options={[
              { label: "Toán", value: "Toán" },
              { label: "Vật Lý", value: "Vật Lý" },
              { label: "Hóa Học", value: "Hóa Học" },
              { label: "Tiếng Anh", value: "Tiếng Anh" },
              { label: "Chung", value: "Chung" },
            ]}
          />
        </Form.Item>

        <Form.Item name="fileType" label="File Format" rules={[{ required: true }]}>
          <Select
            options={[
              { label: "PDF (.pdf)", value: "pdf" },
              { label: "Word (.docx)", value: "docx" },
              { label: "Archive (.zip)", value: "zip" },
              { label: "Text (.txt)", value: "txt" },
            ]}
          />
        </Form.Item>

        <Form.Item name="fileSizeMB" label="File Size (MB)" rules={[{ required: true }]}>
          <InputNumber min={0.1} max={500} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="status" label="Initial Status" rules={[{ required: true }]}>
          <Select
            options={[
              { label: "Indexed", value: "Indexed" },
              { label: "Pending", value: "Pending" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AddKnowledgeModal;
