import React, { useEffect, useState } from "react";
import { Drawer, Form, Input, Select, Button, Space, Typography, Card, Row, Col } from "antd";
import { DatabaseOutlined, CheckCircleOutlined } from "@ant-design/icons";
import axiosClient from "../../../api/axiosClient";
import { toast } from "../../../utils/toast";

const { Text } = Typography;

interface QuestionFormDrawerProps {
  open: boolean;
  onClose: () => void;
  initialData?: any | null;
  onSaved?: () => void;
}

export const QuestionFormDrawer: React.FC<QuestionFormDrawerProps> = React.memo(
  ({ open, onClose, initialData, onSaved }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [questionType, setQuestionType] = useState<string>("MCQ");

    const isEditing = !!initialData?._id;

    useEffect(() => {
      if (open) {
        if (initialData) {
          setQuestionType(initialData.type || "MCQ");
          form.setFieldsValue({
            topic: initialData.topic || "",
            difficulty: initialData.difficulty || "MEDIUM",
            type: initialData.type || "MCQ",
            content: initialData.content || "",
            optionA: initialData.options?.[0] || "",
            optionB: initialData.options?.[1] || "",
            optionC: initialData.options?.[2] || "",
            optionD: initialData.options?.[3] || "",
            correctAnswer: initialData.correctAnswer || "",
          });
        } else {
          setQuestionType("MCQ");
          form.resetFields();
          form.setFieldsValue({
            difficulty: "MEDIUM",
            type: "MCQ",
          });
        }
      }
    }, [open, initialData, form]);

    const handleSubmit = async (values: any) => {
      setSubmitting(true);

      try {
        const payload: any = {
          topic: values.topic.trim(),
          difficulty: values.difficulty,
          type: values.type,
          content: values.content.trim(),
        };

        if (values.type === "MCQ") {
          const options = [
            values.optionA?.trim() || "",
            values.optionB?.trim() || "",
            values.optionC?.trim() || "",
            values.optionD?.trim() || "",
          ].filter(Boolean);

          if (options.length < 2) {
            toast.warning("Vui lòng nhập ít nhất 2 phương án lựa chọn!");
            setSubmitting(false);
            return;
          }

          if (!values.correctAnswer) {
            toast.warning("Vui lòng chọn đáp án đúng cho câu hỏi trắc nghiệm!");
            setSubmitting(false);
            return;
          }

          payload.options = options;
          payload.correctAnswer = values.correctAnswer.trim();
        }

        if (isEditing && initialData) {
          await axiosClient.put(`/api/questions/${initialData._id}`, payload);
          toast.success("Cập nhật câu hỏi thành công!");
        } else {
          await axiosClient.post("/api/questions", payload);
          toast.success("Thêm câu hỏi mới vào Ngân hàng thành công!");
        }

        onClose();
        if (onSaved) onSaved();
      } catch (err: any) {
        toast.error(err.response?.data?.message || err.message || "Lỗi khi lưu câu hỏi!");
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Drawer
        title={
          <Space align="center">
            <DatabaseOutlined style={{ color: "#1890ff" }} />
            <span>{isEditing ? "Chỉnh sửa câu hỏi" : "Thêm câu hỏi mới vào Ngân hàng đề"}</span>
          </Space>
        }
        placement="right"
        width={680}
        onClose={onClose}
        open={open}
        destroyOnClose
        styles={{ body: { padding: 24 } }}
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Card size="small" style={{ marginBottom: 16, borderRadius: 8 }}>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="topic"
                  label="Chủ đề / Bài học *"
                  rules={[{ required: true, message: "Vui lòng nhập chủ đề!" }]}
                >
                  <Input placeholder="Ví dụ: Unit 8: Ordering a meal / Lập trình Web" maxLength={150} />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item name="difficulty" label="Độ khó">
                  <Select
                    options={[
                      { value: "EASY", label: "🟢 Dễ" },
                      { value: "MEDIUM", label: "🟡 Vừa" },
                      { value: "HARD", label: "🔴 Khó" },
                    ]}
                  />
                </Form.Item>
              </Col>

              <Col span={6}>
                <Form.Item name="type" label="Loại câu hỏi">
                  <Select
                    onChange={(val) => setQuestionType(val)}
                    options={[
                      { value: "MCQ", label: "🔵 Trắc nghiệm" },
                      { value: "ESSAY", label: "🟣 Tự luận" },
                    ]}
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item
            name="content"
            label="Nội dung câu hỏi *"
            rules={[{ required: true, message: "Vui lòng nhập nội dung câu hỏi!" }]}
          >
            <Input.TextArea rows={4} placeholder="Nhập câu hỏi chi tiết..." />
          </Form.Item>

          {questionType === "MCQ" && (
            <Card title="📌 Các phương án trắc nghiệm & Đáp án đúng" size="small" style={{ marginBottom: 20, borderRadius: 8 }}>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item name="optionA" label="Phương án A *" rules={[{ required: true, message: "Vui lòng nhập phương án A!" }]}>
                    <Input placeholder="Nội dung đáp án A" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="optionB" label="Phương án B *" rules={[{ required: true, message: "Vui lòng nhập phương án B!" }]}>
                    <Input placeholder="Nội dung đáp án B" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="optionC" label="Phương án C">
                    <Input placeholder="Nội dung đáp án C" />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item name="optionD" label="Phương án D">
                    <Input placeholder="Nội dung đáp án D" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                name="correctAnswer"
                label="Chọn Đáp án Đúng *"
                rules={[{ required: true, message: "Vui lòng chọn đáp án đúng!" }]}
                style={{ marginBottom: 0 }}
              >
                <Input placeholder="Nhập nội dung đáp án đúng chính xác (Ví dụ: giá trị của phương án A)" />
              </Form.Item>
            </Card>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
            <Button onClick={onClose}>Hủy</Button>
            <Button type="primary" htmlType="submit" loading={submitting} icon={<CheckCircleOutlined />}>
              {isEditing ? "Lưu thay đổi" : "Thêm câu hỏi"}
            </Button>
          </div>
        </Form>
      </Drawer>
    );
  }
);

QuestionFormDrawer.displayName = "QuestionFormDrawer";
