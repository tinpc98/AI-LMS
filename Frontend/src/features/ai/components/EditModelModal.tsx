import { useEffect } from "react";
import { Form, Input, InputNumber, Modal, Select, Switch } from "antd";
import type { AIModel, ModelStatus } from "../types/aiManagement.types";

interface EditModelModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: AIModel;
  onSubmit: (values: Omit<AIModel, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

const EditModelModal = ({ open, mode, initialValues, onSubmit, onCancel }: EditModelModalProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialValues) {
        form.setFieldsValue(initialValues);
      } else {
        form.resetFields();
        form.setFieldsValue({
          provider: "OpenAI",
          version: "v1.0",
          status: "Active" as ModelStatus,
          priority: 1,
          isDefault: false,
          maxContextTokens: 128000,
        });
      }
    }
  }, [open, mode, initialValues, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
      form.resetFields();
    } catch {
      // validation error
    }
  };

  return (
    <Modal
      title={mode === "create" ? "Add New AI Model" : `Edit Model: ${initialValues?.name || ""}`}
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
      width={540}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item name="provider" label="Provider" rules={[{ required: true }]}>
          <Select
            options={[
              { label: "OpenAI", value: "OpenAI" },
              { label: "Google", value: "Google" },
              { label: "Anthropic", value: "Anthropic" },
              { label: "Meta", value: "Meta" },
              { label: "Custom", value: "Custom" },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="name"
          label="Model Name"
          rules={[{ required: true, message: "Please enter model name" }]}
        >
          <Input placeholder="e.g. GPT-4.5 Turbo" />
        </Form.Item>

        <Form.Item name="version" label="Version" rules={[{ required: true }]}>
          <Input placeholder="e.g. 2026-03" />
        </Form.Item>

        <Form.Item name="priority" label="Priority (1 = Highest)" rules={[{ required: true }]}>
          <InputNumber min={1} max={99} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          name="maxContextTokens"
          label="Context Window (Tokens)"
          rules={[{ required: true }]}
        >
          <InputNumber min={4000} max={2000000} step={4000} style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} placeholder="Describe the capabilities of this model..." />
        </Form.Item>

        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select
            options={[
              { label: "Active", value: "Active" },
              { label: "Disabled", value: "Disabled" },
            ]}
          />
        </Form.Item>

        <Form.Item name="isDefault" label="Set as System Default Model" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditModelModal;
