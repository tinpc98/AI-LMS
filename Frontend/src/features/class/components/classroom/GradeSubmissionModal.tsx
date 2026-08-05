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
  Radio,
  Segmented,
  Tooltip,
  Empty,
} from "antd";
import {
  CheckCircleOutlined,
  UserOutlined,
  EditOutlined,
  PaperClipOutlined,
  ClockCircleOutlined,
  LinkOutlined,
  DownloadOutlined,
  EyeOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileImageOutlined,
  FileUnknownOutlined,
  FullscreenOutlined,
} from "@ant-design/icons";
import assignmentApi from "../../../../api/assignmentApi";
import { toast } from "../../../../utils/toast";
import type { IAssignment, ISubmission } from "../../../../interface/assignmentInterface";
import { getApiErrorMessage } from "../../../../shared/utils/apiError";
import SafeHTML from "../../../../shared/components/SafeHTML";
import { PDFViewer } from "../../../lesson/components/PDFViewer";
import { DocxViewer } from "../../../lesson/components/DocxViewer";
import {
  AttachmentViewerModal,
  getFileCategory,
  type AttachmentFile,
} from "../../../../shared/components/AttachmentViewerModal";

const { Text, Paragraph } = Typography;

interface GradeSubmissionModalProps {
  open: boolean;
  onClose: () => void;
  submission: ISubmission | null;
  assignment?: IAssignment | null;
  onGraded?: () => void;
}

export const GradeSubmissionModal: React.FC<GradeSubmissionModalProps> = React.memo(
  ({ open, onClose, submission, assignment, onGraded }) => {
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [selectedAttachmentIndex, setSelectedAttachmentIndex] = useState<number>(0);
    const [previewModalFile, setPreviewModalFile] = useState<AttachmentFile | null>(null);

    const studentObj = typeof submission?.studentId === "object" ? submission.studentId : null;
    const studentName = studentObj?.fullName || "Học sinh";
    const studentEmail = studentObj?.email || "";
    const studentIdStr = (studentObj?._id || submission?.studentId || "").toString();
    const studentCode = studentIdStr ? `STU-${studentIdStr.slice(-6).toUpperCase()}` : "STU-N/A";

    const graderObj =
      typeof (submission as any)?.gradedBy === "object" ? (submission as any).gradedBy : null;
    const graderName = graderObj?.fullName || "";

    const attachments = submission?.attachments || [];
    const hasAttachments = attachments.length > 0;

    useEffect(() => {
      if (open && submission) {
        setSelectedAttachmentIndex(0);
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

    const submissionType = submission?.submissionType || "file";
    const currentAttachment = attachments[selectedAttachmentIndex] || attachments[0] || null;

    const handleDownloadCurrent = () => {
      if (!currentAttachment?.url) return;
      const link = document.createElement("a");
      link.href = currentAttachment.url;
      link.download = currentAttachment.name || "download";
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

    // Render file viewer in the left pane
    const renderAttachmentViewer = () => {
      if (!currentAttachment) return null;

      const category = getFileCategory(currentAttachment.name || currentAttachment.url);

      return (
        <div
          style={{
            height: "100%",
            display: "flex",
            flexDirection: "column",
            backgroundColor: "var(--color-bg-page)",
            borderRadius: 12,
            border: "1px solid var(--color-border-default)",
            overflow: "hidden",
          }}
        >
          {/* Header chọn tệp nếu nộp nhiều file */}
          <div
            style={{
              padding: "8px 12px",
              backgroundColor: "var(--color-surface)",
              borderBottom: "1px solid var(--color-border-default)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0, flex: 1 }}>
              {attachments.length > 1 ? (
                <Segmented
                  size="small"
                  value={selectedAttachmentIndex}
                  onChange={(val) => setSelectedAttachmentIndex(Number(val))}
                  options={attachments.map((att: any, idx: number) => ({
                    value: idx,
                    label: (
                      <span
                        style={{
                          fontSize: 12,
                          maxWidth: 140,
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          display: "inline-block",
                        }}
                        title={att.name}
                      >
                        {att.name || `Tệp ${idx + 1}`}
                      </span>
                    ),
                  }))}
                />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                  <PaperClipOutlined style={{ color: "var(--color-action-primary-bg)" }} />
                  <Text
                    strong
                    style={{
                      fontSize: 13,
                      maxWidth: 320,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                    title={currentAttachment.name}
                  >
                    {currentAttachment.name}
                  </Text>
                </div>
              )}
            </div>

            <Space size={6}>
              <Tooltip title="Xem toàn màn hình">
                <Button
                  size="small"
                  icon={<FullscreenOutlined />}
                  onClick={() => setPreviewModalFile(currentAttachment)}
                />
              </Tooltip>
              <Tooltip title="Tải file về máy">
                <Button
                  size="small"
                  icon={<DownloadOutlined />}
                  onClick={handleDownloadCurrent}
                />
              </Tooltip>
            </Space>
          </div>

          {/* Vùng xem nội dung trực tiếp */}
          <div
            style={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              minHeight: "520px",
              maxHeight: "72vh",
            }}
          >
            {category === "pdf" && (
              <PDFViewer
                url={currentAttachment.url}
                title={currentAttachment.name}
                onDownload={handleDownloadCurrent}
              />
            )}

            {category === "docx" && (
              <DocxViewer
                url={currentAttachment.url}
                title={currentAttachment.name}
                onDownload={handleDownloadCurrent}
              />
            )}

            {category === "image" && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(0,0,0,0.85)",
                  padding: 16,
                  overflow: "auto",
                }}
              >
                <img
                  src={currentAttachment.url}
                  alt={currentAttachment.name}
                  style={{
                    maxWidth: "100%",
                    maxHeight: "68vh",
                    objectFit: "contain",
                    borderRadius: 6,
                    boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                  }}
                />
              </div>
            )}

            {category === "unsupported" && (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 32,
                  textAlign: "center",
                }}
              >
                <Empty
                  description={
                    <span>
                      Định dạng này không hỗ trợ xem trực tiếp.
                      <br />
                      Vui lòng tải về máy để mở.
                    </span>
                  }
                >
                  <Button
                    type="primary"
                    size="small"
                    icon={<DownloadOutlined />}
                    onClick={handleDownloadCurrent}
                  >
                    Tải về {currentAttachment.name}
                  </Button>
                </Empty>
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <>
        <Modal
          title={
            <Space align="center">
              <EditOutlined style={{ color: "var(--color-action-primary-bg)" }} />
              <span>Chấm điểm & Nhận xét bài nộp</span>
            </Space>
          }
          open={open}
          onCancel={onClose}
          footer={null}
          width={hasAttachments ? "92vw" : 780}
          style={{ maxWidth: hasAttachments ? "1300px" : "780px", top: 20 }}
          styles={{
            body: {
              maxHeight: "85vh",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            },
          }}
          destroyOnClose
        >
          {submission && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: hasAttachments ? "1.2fr 1fr" : "1fr",
                gap: 16,
                maxHeight: "80vh",
                overflow: "hidden",
              }}
            >
              {/* CỘT TRÁI: Trình xem bài nộp trực tiếp (nếu có file đính kèm) */}
              {hasAttachments && (
                <div style={{ height: "100%", overflow: "hidden", minHeight: "550px" }}>
                  {renderAttachmentViewer()}
                </div>
              )}

              {/* CỘT PHẢI (hoặc toàn bộ): Thông tin sinh viên & Form chấm điểm */}
              <div
                style={{
                  overflowY: "auto",
                  paddingRight: 6,
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  maxHeight: "78vh",
                }}
              >
                {/* Student Info Card */}
                <Card
                  size="small"
                  style={{ backgroundColor: "var(--color-bg-page)", borderRadius: 8 }}
                  styles={{ body: { padding: 10 } }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 10,
                    }}
                  >
                    <Space size={10}>
                      <Avatar
                        src={(studentObj as any)?.avatar || undefined}
                        icon={!(studentObj as any)?.avatar ? <UserOutlined /> : undefined}
                        style={{ backgroundColor: "var(--color-action-primary-bg)" }}
                      />
                      <div>
                        <Text strong style={{ fontSize: 13, display: "block" }}>
                          {studentName}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11, fontFamily: "monospace" }}>
                          {studentCode} {studentEmail ? `| ${studentEmail}` : ""}
                        </Text>
                      </div>
                    </Space>

                    <Space size={6}>
                      {submissionType === "link" && <Tag color="cyan">🔗 Liên kết</Tag>}
                      {submissionType === "direct" && <Tag color="orange">✍️ Trực tiếp</Tag>}
                      {submissionType === "file" && <Tag color="blue">📁 Tệp đính kèm</Tag>}

                      {submission.status === "graded" && <Tag color="success">🔵 Đã chấm</Tag>}
                      {submission.status === "late" && <Tag color="warning">🟡 Trễ hạn</Tag>}
                      {submission.status === "submitted" && (
                        <Tag color="processing">🟢 Đúng hạn</Tag>
                      )}
                      {submission.status === "resubmitted" && (
                        <Tag color="purple">🟣 Nộp lại</Tag>
                      )}
                    </Space>
                  </div>
                </Card>

                {/* Submission Content Box (Link / Direct Answers / Notes) */}
                <div
                  style={{
                    border: "1px solid var(--color-border-default)",
                    borderRadius: 8,
                    padding: 12,
                    backgroundColor: "var(--color-surface)",
                  }}
                >
                  {/* 1. Dán liên kết (Link Mode) */}
                  {submissionType === "link" && submission.linkUrl && (
                    <div style={{ marginBottom: 12 }}>
                      <Text
                        strong
                        style={{
                          fontSize: 12,
                          color: "var(--color-text-description)",
                          display: "block",
                          marginBottom: 4,
                        }}
                      >
                        🔗 ĐƯỜNG DẪN BÀI LÀM:
                      </Text>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "8px 12px",
                          backgroundColor: "rgba(22, 119, 255, 0.06)",
                          border: "1px solid rgba(22, 119, 255, 0.2)",
                          borderRadius: 6,
                        }}
                      >
                        <LinkOutlined style={{ color: "#1677ff", fontSize: 15 }} />
                        <a
                          href={submission.linkUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            wordBreak: "break-all",
                            fontWeight: 600,
                            color: "#1677ff",
                            fontSize: 13,
                          }}
                        >
                          {submission.linkUrl}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 2. Trực tiếp theo danh sách câu hỏi (Direct Mode) */}
                  {assignment?.questions && assignment.questions.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
                      <Text
                        strong
                        style={{
                          fontSize: 12,
                          color: "var(--color-text-description)",
                          display: "block",
                        }}
                      >
                        📌 CÂU HỎI & BÀI LÀM TRỰC TIẾP:
                      </Text>
                      {assignment.questions.map((q, idx) => {
                        const studentAnswer = submission.answers?.find(
                          (a) => a.questionId?.toString() === q._id?.toString()
                        );
                        return (
                          <div
                            key={q._id || idx}
                            style={{
                              border: "1px solid var(--color-border-default)",
                              borderRadius: 6,
                              overflow: "hidden",
                            }}
                          >
                            <div
                              style={{
                                backgroundColor: "var(--color-bg-page)",
                                padding: "8px 10px",
                                borderBottom: "1px solid var(--color-border-default)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  marginBottom: 2,
                                }}
                              >
                                <Text strong style={{ fontSize: 12 }}>
                                  Câu {q.order || idx + 1}
                                </Text>
                                {q.required && (
                                  <Text type="danger" style={{ fontSize: 11 }}>
                                    (Bắt buộc)
                                  </Text>
                                )}
                              </div>
                              <SafeHTML html={q.content} fallbackText="Không có nội dung câu hỏi" />
                            </div>

                            <div style={{ padding: "8px 10px", backgroundColor: "#fff" }}>
                              <Text
                                type="secondary"
                                style={{ fontSize: 11, fontWeight: 600, display: "block", marginBottom: 4 }}
                              >
                                ✍️ BÀI LÀM CỦA SINH VIÊN:
                              </Text>
                              <SafeHTML
                                html={studentAnswer?.content}
                                fallbackText="(Sinh viên chưa trả lời câu này)"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    submission.content && (
                      <div style={{ marginBottom: 12 }}>
                        <Text
                          strong
                          style={{
                            fontSize: 12,
                            color: "var(--color-text-description)",
                            display: "block",
                            marginBottom: 4,
                          }}
                        >
                          📌 NỘI DUNG BÀI LÀM:
                        </Text>
                        <SafeHTML html={submission.content} />
                      </div>
                    )
                  )}

                  {/* Danh sách tệp (nếu không có cột trái hoặc cần nút mở rộng) */}
                  {!hasAttachments && submission.content && (
                    <div style={{ fontSize: 12, color: "var(--color-text-description)" }}>
                      Không có tệp đính kèm.
                    </div>
                  )}

                  {submission.createdAt && (
                    <div
                      style={{
                        marginTop: 8,
                        paddingTop: 6,
                        borderTop: "1px dashed var(--color-border-default)",
                        fontSize: 11,
                        color: "var(--color-text-description)",
                      }}
                    >
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      Thời gian nộp: {new Date(submission.createdAt).toLocaleString("vi-VN")}
                    </div>
                  )}
                </div>

                {/* Previously Graded Info */}
                {(submission as any).gradedAt && (
                  <div style={{ fontSize: 11, color: "var(--color-text-description)", fontStyle: "italic" }}>
                    ℹ️ Đã chấm bởi <b>{graderName || "Giáo viên"}</b> vào lúc{" "}
                    {new Date((submission as any).gradedAt).toLocaleString("vi-VN")}
                  </div>
                )}

                {/* Form Chấm điểm & Feedback */}
                <Form form={form} layout="vertical" onFinish={handleSubmit}>
                  <Form.Item
                    name="grade"
                    label={`Điểm số (tối đa: ${assignment?.maxScore || 10})`}
                    rules={[
                      { required: true, message: "Vui lòng nhập điểm số!" },
                      { type: "number", min: 0, max: assignment?.maxScore || 10, message: `Điểm số từ 0 đến ${assignment?.maxScore || 10}!` },
                    ]}
                    style={{ marginBottom: 12 }}
                  >
                    <InputNumber
                      min={0}
                      max={assignment?.maxScore || 10}
                      step={0.1}
                      style={{ width: "100%" }}
                      placeholder={`Nhập điểm (từ 0 đến ${assignment?.maxScore || 10})`}
                    />
                  </Form.Item>

                  <Form.Item
                    name="feedback"
                    label="Nhận xét / Lời phê của giáo viên"
                    style={{ marginBottom: 12 }}
                  >
                    <Input.TextArea
                      rows={2}
                      placeholder="Nhập nhận xét chi tiết, khen ngợi hoặc nhắc nhở học sinh..."
                    />
                  </Form.Item>

                  <Form.Item
                    name="aiFeedback"
                    label="Gợi ý đánh giá tự động (AI Feedback)"
                    style={{ marginBottom: 16 }}
                  >
                    <Input.TextArea rows={2} placeholder="Nhập nhận xét từ hệ thống AI (nếu có)..." />
                  </Form.Item>

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
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
              </div>
            </div>
          )}
        </Modal>

        {/* Modal Xem toàn màn hình tệp khi bấm mở rộng */}
        <AttachmentViewerModal
          open={Boolean(previewModalFile)}
          onClose={() => setPreviewModalFile(null)}
          file={previewModalFile}
        />
      </>
    );
  }
);

GradeSubmissionModal.displayName = "GradeSubmissionModal";

export default GradeSubmissionModal;
