import React, { useEffect, useState } from "react";
import {
  Modal,
  Form,
  InputNumber,
  Input,
  Button,
  Typography,
  Space,
  Tag,
  Avatar,
  Card,
} from "antd";
import {
  CheckCircleOutlined,
  UserOutlined,
  EditOutlined,
  PaperClipOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import assignmentApi from "../../../../api/assignmentApi";
import { toast } from "../../../../utils/toast";
import type { ISubmission } from "../../../../interface/assignmentInterface";
import { getApiErrorMessage } from "../../../../shared/utils/apiError";

const { Text, Paragraph } = Typography;

interface GradeSubmissionModalProps {
  open: boolean;
  onClose: () => void;
  submission: ISubmission | null;
  onGraded?: () => void;
}

export const GradeSubmissionModal: React.FC<GradeSubmissionModalProps> = React.memo(
  ({ open, onClose, submission, onGraded }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);

    const studentObj = typeof submission?.studentId === "object" ? submission.studentId : null;
    const studentName = studentObj?.fullName || "Học sinh";
    const studentEmail = studentObj?.email || "";
    const studentIdStr = (studentObj?._id || submission?.studentId || "").toString();
    const studentCode = studentIdStr ? `STU-${studentIdStr.slice(-6).toUpperCase()}` : "STU-N/A";

    const graderObj =
      typeof (submission as any)?.gradedBy === "object" ? (submission as any).gradedBy : null;
    const graderName = graderObj?.fullName || "";

    useEffect(() => {
      if (open && submission) {
        form.setFieldsValue({
          grade:
            submission.grade !== null && submission.grade !== undefined ? submission.grade : 10,
          feedback: submission.feedback || "",
          aiFeedback: (submission as any).aiFeedback || "",
        });
      }
    }, [open, submission, form]);

    const handleSubmit = async (values: any) => {
      if (!submission?._id) return;
      setSubmitting(true);

      try {
        await assignmentApi.gradeSubmission(submission._id, {
          grade: Number(values.grade),
          feedback: values.feedback?.trim() || "",
          aiFeedback: values.aiFeedback?.trim() || "",
        });

        toast.success(`Đã lưu kết quả chấm điểm cho ${studentName} thành công!`);
        onClose();
        if (onGraded) onGraded();
      } catch (err: unknown) {
        toast.error(getApiErrorMessage(err, "Lỗi khi chấm bài!"));
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Modal
        title={
          <Space align="center">
            <EditOutlined style={{ color: "#1890ff" }} />
            <span>Chấm điểm & Nhận xét bài nộp</span>
          </Space>
        }
        open={open}
        onCancel={onClose}
        footer={null}
        width={680}
        destroyOnClose
      >
        {submission && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
            {/* Student Info Card */}
            <Card
              size="small"
              style={{ backgroundColor: "#f8f9fa", borderRadius: 8 }}
              styles={{ body: { padding: 12 } }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <Space size={12}>
                  <Avatar
                    src={(studentObj as any)?.avatar || undefined}
                    icon={!(studentObj as any)?.avatar ? <UserOutlined /> : undefined}
                    style={{ backgroundColor: "#1890ff" }}
                  />
                  <div>
                    <Text strong style={{ fontSize: 14, display: "block" }}>
                      {studentName}
                    </Text>
                    <Text type="secondary" style={{ fontSize: 12, fontFamily: "monospace" }}>
                      {studentCode} {studentEmail ? `| ${studentEmail}` : ""}
                    </Text>
                  </div>
                </Space>

                <div>
                  {submission.status === "graded" && <Tag color="success">🔵 Đã chấm điểm</Tag>}
                  {submission.status === "late" && <Tag color="warning">🟡 Nộp trễ hạn</Tag>}
                  {submission.status === "submitted" && (
                    <Tag color="processing">🟢 Nộp đúng hạn</Tag>
                  )}
                </div>
              </div>
            </Card>

            {/* Submission Content & Attachments Box */}
            <div
              style={{
                border: "1px solid #e8e8e8",
                borderRadius: 8,
                padding: 16,
                backgroundColor: "#fff",
              }}
            >
              <Text
                strong
                style={{ fontSize: 13, color: "#8c8c8c", display: "block", marginBottom: 6 }}
              >
                📌 NỘI DUNG BÀI LÀM CỦA HỌC SINH:
              </Text>
              {submission.content ? (
                <Paragraph style={{ fontSize: 14, whiteSpace: "pre-wrap", marginBottom: 12 }}>
                  {submission.content}
                </Paragraph>
              ) : (
                <Text
                  type="secondary"
                  style={{ fontStyle: "italic", fontSize: 13, display: "block", marginBottom: 12 }}
                >
                  (Học sinh không nhập nội dung văn bản)
                </Text>
              )}

              {submission.attachments && submission.attachments.length > 0 && (
                <div>
                  <Text
                    strong
                    style={{ fontSize: 12, color: "#8c8c8c", display: "block", marginBottom: 6 }}
                  >
                    📎 TỆP ĐÍNH KÈM ({submission.attachments.length}):
                  </Text>
                  <Space wrap size={8}>
                    {submission.attachments.map((att: any, idx: number) => (
                      <Button
                        key={att.publicId || idx}
                        type="default"
                        size="small"
                        icon={<PaperClipOutlined />}
                        onClick={() => window.open(att.url, "_blank")}
                        style={{ borderRadius: 6 }}
                      >
                        {att.name || `Tệp ${idx + 1}`}
                      </Button>
                    ))}
                  </Space>
                </div>
              )}

              {submission.createdAt && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 8,
                    borderTop: "1px dashed #f0f0f0",
                    fontSize: 12,
                    color: "#8c8c8c",
                  }}
                >
                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                  Thời gian nộp: {new Date(submission.createdAt).toLocaleString("vi-VN")}
                </div>
              )}
            </div>

            {/* Previously Graded Info */}
            {(submission as any).gradedAt && (
              <div style={{ fontSize: 12, color: "#8c8c8c", fontStyle: "italic" }}>
                ℹ️ Được chấm bởi <b>{graderName || "Giáo viên"}</b> vào lúc{" "}
                {new Date((submission as any).gradedAt).toLocaleString("vi-VN")}
              </div>
            )}
          </div>
        )}

        {/* Form Chấm điểm & Feedback */}
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="grade"
            label="Điểm số (Thang điểm 100 hoặc 10)"
            rules={[
              { required: true, message: "Vui lòng nhập điểm số!" },
              { type: "number", min: 0, max: 100, message: "Điểm số từ 0 đến 100!" },
            ]}
          >
            <InputNumber
              min={0}
              max={100}
              step={0.5}
              style={{ width: "100%" }}
              placeholder="Nhập điểm số (Ví dụ: 85 hoặc 8.5)"
            />
          </Form.Item>

          <Form.Item name="feedback" label="Nhận xét / Lời phê của giáo viên">
            <Input.TextArea
              rows={3}
              placeholder="Nhập nhận xét chi tiết, khen ngợi hoặc nhắc nhở học sinh..."
            />
          </Form.Item>

          <Form.Item name="aiFeedback" label="Gợi ý đánh giá tự động (AI Feedback)">
            <Input.TextArea rows={2} placeholder="Nhập nhận xét từ hệ thống AI (nếu có)..." />
          </Form.Item>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 24 }}>
            <Button onClick={onClose}>Hủy</Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              icon={<CheckCircleOutlined />}
            >
              Lưu kết quả chấm
            </Button>
          </div>
        </Form>
      </Modal>
    );
  }
);

GradeSubmissionModal.displayName = "GradeSubmissionModal";
