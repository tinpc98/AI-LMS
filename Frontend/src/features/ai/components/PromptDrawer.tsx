import { Card, Descriptions, Drawer, Tag, Typography } from "antd";
import type { AIModel, PromptTemplate } from "../types/aiManagement.types";

interface PromptDrawerProps {
  open: boolean;
  prompt?: PromptTemplate;
  models: AIModel[];
  onClose: () => void;
}

const PromptDrawer = ({ open, prompt, models, onClose }: PromptDrawerProps) => {
  if (!prompt) return null;

  const assignedModel = models.find((m) => m.id === prompt.modelId);

  // Simple live preview generator replacing {{var}} with sample values
  let previewText = prompt.userPrompt || "";
  const sampleValues: Record<string, string> = {
    student_name: "Nguyễn Văn A",
    subject: "Toán 12",
    user_question: "Cách tính thể tích khối đa diện?",
    lesson_title: "Hàm số lượng giác",
    lesson_content: "Tập xác định D = R, chu kỳ T = 2pi...",
    question_count: "5",
    topic: "Đạo hàm & Cực trị",
    difficulty: "Vận dụng",
    duration: "45",
    total_questions: "40",
    chapters: "Chương 1 & 2",
    prompt_title: "Viết bài luận Tiếng Anh về biến đổi khí hậu",
    student_essay: "Climate change is a major issue facing our world...",
    performance_data: "Toán: 7.5, Lý: 6.0, Hóa: 8.2",
  };

  if (prompt.variables) {
    for (const v of prompt.variables) {
      const regex = new RegExp(`{{\\s*${v}\\s*}}`, "g");
      const sampleVal = sampleValues[v] || `[${v}]`;
      previewText = previewText.replace(regex, sampleVal);
    }
  }

  return (
    <Drawer
      title="Prompt Template Details & Live Preview"
      placement="right"
      width={560}
      open={open}
      onClose={onClose}
    >
      <div style={{ marginBottom: 20 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {prompt.name}
        </Typography.Title>
        <Typography.Text type="secondary">{prompt.description}</Typography.Text>
        <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
          <Tag color="blue">{prompt.category}</Tag>
          <Tag color={prompt.status === "Active" ? "green" : "default"}>{prompt.status}</Tag>
        </div>
      </div>

      <Descriptions column={1} bordered size="small" style={{ marginBottom: 20 }}>
        <Descriptions.Item label="Assigned Model">
          {assignedModel ? `${assignedModel.provider} - ${assignedModel.name}` : prompt.modelId}
        </Descriptions.Item>

        <Descriptions.Item label="Variables">
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {prompt.variables && prompt.variables.length > 0 ? (
              prompt.variables.map((v) => <Tag color="geekblue" key={v}>{`{{${v}}}`}</Tag>)
            ) : (
              <Typography.Text type="secondary">No variables</Typography.Text>
            )}
          </div>
        </Descriptions.Item>
      </Descriptions>

      <Card size="small" title="System Prompt" style={{ marginBottom: 16, background: "var(--color-bg-page)" }}>
        <Typography.Paragraph
          style={{ margin: 0, fontFamily: "monospace", fontSize: 13, whiteSpace: "pre-wrap" }}
        >
          {prompt.systemPrompt}
        </Typography.Paragraph>
      </Card>

      <Card
        size="small"
        title="User Prompt Template"
        style={{ marginBottom: 16, background: "var(--color-bg-page)" }}
      >
        <Typography.Paragraph
          style={{ margin: 0, fontFamily: "monospace", fontSize: 13, whiteSpace: "pre-wrap" }}
        >
          {prompt.userPrompt}
        </Typography.Paragraph>
      </Card>

      <Card
        size="small"
        title="Live Sample Preview"
        style={{ marginBottom: 16, background: "var(--color-success-bg)", borderColor: "var(--color-border-default)" }}
      >
        <Typography.Text
          type="secondary"
          style={{ fontSize: 11, display: "block", marginBottom: 6 }}
        >
          Interpolated with sample variable values:
        </Typography.Text>
        <Typography.Paragraph
          style={{ margin: 0, fontFamily: "sans-serif", fontSize: 13, whiteSpace: "pre-wrap" }}
        >
          {previewText}
        </Typography.Paragraph>
      </Card>
    </Drawer>
  );
};

export default PromptDrawer;
