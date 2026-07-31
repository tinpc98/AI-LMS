import { useEffect } from "react";
import { Form, Input, Modal, Select } from "antd";
import type {
  AIModel,
  PromptCategory,
  PromptStatus,
  PromptTemplate,
} from "../types/aiManagement.types";

interface EditPromptModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: PromptTemplate;
  models: AIModel[];
  onSubmit: (values: Omit<PromptTemplate, "id" | "createdAt" | "updatedAt">) => void;
  onCancel: () => void;
}

const EditPromptModal = ({
  open,
  mode,
  initialValues,
  models,
  onSubmit,
  onCancel,
}: EditPromptModalProps) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      if (mode === "edit" && initialValues) {
        form.setFieldsValue({
          ...initialValues,
          variablesString: initialValues.variables ? initialValues.variables.join(", ") : "",
        });
      } else {
        form.resetFields();
        form.setFieldsValue({
          category: "Chatbot" as PromptCategory,
          modelId: models[0]?.id || "",
          status: "Active" as PromptStatus,
        });
      }
    }
  }, [open, mode, initialValues, models, form]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      const variables = values.variablesString
        ? values.variablesString
            .split(",")
            .map((v: string) => v.trim())
            .filter(Boolean)
        : [];

      delete values.variablesString;

      onSubmit({
        ...values,
        variables,
      });
      form.resetFields();
    } catch {
      // validation error
    }
  };

  return (
    <Modal
      title={
        mode === "create" ? "Create Prompt Template" : `Edit Prompt: ${initialValues?.name || ""}`
      }
      open={open}
      onOk={handleOk}
      onCancel={onCancel}
      destroyOnClose
      width={640}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 12 }}>
        <Form.Item
          name="name"
          label="Prompt Name"
          rules={[{ required: true, message: "Enter prompt name" }]}
        >
          <Input placeholder="e.g. AI Chatbot Assistant" />
        </Form.Item>

        <Form.Item name="category" label="Category" rules={[{ required: true }]}>
          <Select
            options={[
              { label: "Chatbot", value: "Chatbot" },
              { label: "Summary", value: "Summary" },
              { label: "Quiz Generator", value: "Quiz Generator" },
              { label: "Exam Generator", value: "Exam Generator" },
              { label: "Homework Assistant", value: "Homework Assistant" },
              { label: "Essay Evaluation", value: "Essay Evaluation" },
              { label: "Learning Recommendation", value: "Learning Recommendation" },
            ]}
          />
        </Form.Item>

        <Form.Item name="modelId" label="Assigned AI Model" rules={[{ required: true }]}>
          <Select
            options={models.map((m) => ({
              label: `${m.provider} - ${m.name} (${m.version})`,
              value: m.id,
            }))}
          />
        </Form.Item>

        <Form.Item name="description" label="Description">
          <Input placeholder="Short summary of this prompt template..." />
        </Form.Item>

        <Form.Item name="systemPrompt" label="System Prompt" rules={[{ required: true }]}>
          <Input.TextArea rows={4} placeholder="System instructions for the AI persona..." />
        </Form.Item>

        <Form.Item name="userPrompt" label="User Prompt Template" rules={[{ required: true }]}>
          <Input.TextArea
            rows={4}
            placeholder="User prompt template with {{variables}}, e.g. {{student_name}}"
          />
        </Form.Item>

        <Form.Item
          name="variablesString"
          label="Template Variables (comma-separated)"
          tooltip="e.g. student_name, subject, user_question"
        >
          <Input placeholder="student_name, subject, user_question" />
        </Form.Item>

        <Form.Item name="status" label="Status" rules={[{ required: true }]}>
          <Select
            options={[
              { label: "Active", value: "Active" },
              { label: "Disabled", value: "Disabled" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default EditPromptModal;
