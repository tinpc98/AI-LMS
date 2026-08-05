import React, { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import type { IAssignment, IAssignmentQuestion, SubmissionMode } from "../../../interface/assignmentInterface";
import { toast } from "../../../utils/toast";
import assignmentApi from "../../../api/assignmentApi";
import RichTextEditor from "../../../shared/components/RichTextEditor";
import SafeHTML from "../../../shared/components/SafeHTML";
import { Button } from "antd";

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  lessonId?: string;
  initialAssignment?: IAssignment | null;
  hasGradedSubmissions?: boolean;
  onCreated: (newAssignment: IAssignment) => void;
}

const MAX_FILES = 5;

const SUBMISSION_MODES: Array<{
  id: SubmissionMode;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    id: "file",
    label: "Tải file lên",
    icon: "upload_file",
    description: "Sinh viên nộp bài bằng file (PDF, DOCX, ZIP...)",
  },
  {
    id: "link",
    label: "Dán liên kết",
    icon: "link",
    description: "Sinh viên nộp liên kết Google Drive, GitHub, Figma...",
  },
  {
    id: "direct",
    label: "Làm trực tiếp",
    icon: "edit_document",
    description: "Sinh viên trả lời câu hỏi trực tiếp bằng trình soạn thảo",
  },
  {
    id: "any",
    label: "Tự chọn",
    icon: "rule",
    description: "Sinh viên tự do chọn 1 trong 3 hình thức trên",
  },
];

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  classId,
  lessonId,
  initialAssignment,
  hasGradedSubmissions = false,
  onCreated,
}) => {
  const isEditing = Boolean(initialAssignment?._id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submissionMode, setSubmissionMode] = useState<SubmissionMode>("file");
  const [questions, setQuestions] = useState<IAssignmentQuestion[]>([]);
  const [deadline, setDeadline] = useState("");
  const [maxScore, setMaxScore] = useState<number>(10);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewTab, setPreviewTab] = useState<"edit" | "preview">("edit");

  // Load initial data when editing or opening
  useEffect(() => {
    if (initialAssignment) {
      setTitle(initialAssignment.title || "");
      setDescription(initialAssignment.description || "");
      setSubmissionMode(initialAssignment.submissionMode || "file");
      setQuestions(
        initialAssignment.questions?.map((q, idx) => ({
          _id: q._id,
          order: q.order || idx + 1,
          content: q.content || "",
          required: q.required !== false,
        })) || []
      );
      if (initialAssignment.deadline) {
        try {
          const dt = new Date(initialAssignment.deadline);
          const localIso = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16);
          setDeadline(localIso);
        } catch {
          setDeadline("");
        }
      }
      setMaxScore(initialAssignment.maxScore || 10);
    } else {
      resetForm();
    }
  }, [initialAssignment, isOpen]);

  if (!isOpen) return null;

  function resetForm() {
    setTitle("");
    setDescription("");
    setSubmissionMode("file");
    setQuestions([]);
    setDeadline("");
    setMaxScore(10);
    setSelectedFiles([]);
    setPreviewTab("edit");
  }

  const handleAddQuestion = () => {
    setQuestions((prev) => [
      ...prev,
      {
        order: prev.length + 1,
        content: "",
        required: true,
      },
    ]);
  };

  const handleUpdateQuestion = (index: number, content: string) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], content };
      return updated;
    });
  };

  const handleToggleQuestionRequired = (index: number) => {
    setQuestions((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], required: !updated[index].required };
      return updated;
    });
  };

  const handleMoveQuestion = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === questions.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    setQuestions((prev) => {
      const updated = [...prev];
      const temp = updated[index];
      updated[index] = updated[targetIndex];
      updated[targetIndex] = temp;
      // Re-assign orders
      return updated.map((q, i) => ({ ...q, order: i + 1 }));
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions((prev) => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((q, i) => ({ ...q, order: i + 1 }));
    });
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const filesArray = Array.from(event.target.files ?? []);
    if (!filesArray.length) return;

    if (selectedFiles.length + filesArray.length > MAX_FILES) {
      toast.warning("Chỉ được đính kèm tối đa 5 tệp đề bài.");
      event.target.value = "";
      return;
    }

    setSelectedFiles((prev) => [...prev, ...filesArray]);
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (!trimmedTitle) {
      toast.warning("Vui lòng nhập tiêu đề bài tập.");
      return;
    }

    if (!deadline) {
      toast.warning("Vui lòng chọn hạn nộp bài tập.");
      return;
    }

    // Kiểm tra câu hỏi nếu chọn mode direct
    if (submissionMode === "direct" && questions.length === 0) {
      toast.warning("Hình thức làm bài trực tiếp yêu cầu ít nhất 1 câu hỏi.");
      return;
    }

    // Kiểm tra câu hỏi có rỗng không
    if (["direct", "any"].includes(submissionMode)) {
      for (let i = 0; i < questions.length; i++) {
        if (!questions[i].content.trim()) {
          toast.warning(`Câu hỏi số ${i + 1} chưa có nội dung.`);
          return;
        }
      }
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("title", trimmedTitle);
      formData.append("description", trimmedDescription);
      formData.append("submissionMode", submissionMode);
      formData.append("maxScore", maxScore.toString());
      formData.append("deadline", new Date(deadline).toISOString());
      formData.append("classId", classId);
      if (lessonId) {
        formData.append("lessonId", lessonId);
      }

      if (["direct", "any"].includes(submissionMode) && questions.length > 0) {
        formData.append("questions", JSON.stringify(questions));
      }

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      let resultAssignment: IAssignment;
      if (isEditing && initialAssignment) {
        resultAssignment = await assignmentApi.updateAssignment(initialAssignment._id, formData);
        toast.success("Cập nhật bài tập thành công!");
      } else {
        resultAssignment = await assignmentApi.createAssignment(formData);
        toast.success("Giao bài tập mới thành công!");
      }

      onCreated(resultAssignment);
      resetForm();
      onClose();
    } catch (error) {
      console.error("Lỗi khi lưu bài tập:", error);
      toast.error(isEditing ? "Cập nhật bài tập thất bại." : "Tạo bài tập thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-[720px] overflow-y-auto rounded-2xl bg-white p-6 md:p-8 shadow-2xl max-h-[90vh]">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-on-surface">
            {isEditing ? "Chỉnh sửa bài tập" : "Giao bài tập mới"}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Tiêu đề */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Tiêu đề bài tập <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="w-full rounded-xl border border-outline-variant px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
              placeholder="Ví dụ: Bài tập tuần 1 - Giải thuật nâng cao"
              required
            />
          </div>

          {/* Hình thức nộp bài */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-semibold text-on-surface">
                Hình thức nộp bài <span className="text-error">*</span>
              </label>
              {isEditing && hasGradedSubmissions && (
                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  Đã có bài nộp - Khóa thay đổi hình thức
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUBMISSION_MODES.map((mode) => {
                const isSelected = submissionMode === mode.id;
                const isDisabled = isEditing && hasGradedSubmissions && !isSelected;

                return (
                  <div
                    key={mode.id}
                    onClick={() => {
                      if (!isDisabled) setSubmissionMode(mode.id);
                    }}
                    className={`relative flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-2 ring-primary/20 shadow-xs"
                        : "border-outline-variant bg-white hover:border-primary/40 hover:bg-surface-container-lowest"
                    } ${isDisabled ? "opacity-40 cursor-not-allowed" : ""}`}
                  >
                    <div
                      className={`p-2 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected ? "bg-primary text-white" : "bg-surface-container text-on-surface-variant"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[20px]">{mode.icon}</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-on-surface flex items-center gap-1.5">
                        {mode.label}
                        {isSelected && (
                          <span className="material-symbols-outlined text-[16px] text-primary">
                            check_circle
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5 leading-snug">
                        {mode.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danh sách câu hỏi (cho mode direct hoặc any) */}
          {["direct", "any"].includes(submissionMode) && (
            <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-outline-variant pb-3">
                <div>
                  <h4 className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary text-[20px]">
                      format_list_numbered
                    </span>
                    Danh sách câu hỏi bài làm
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Học sinh sẽ trả lời từng câu hỏi bằng trình soạn thảo riêng
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex bg-surface-container p-0.5 rounded-lg text-xs">
                    <button
                      type="button"
                      onClick={() => setPreviewTab("edit")}
                      className={`px-3 py-1 rounded-md font-semibold transition ${
                        previewTab === "edit"
                          ? "bg-white text-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Soạn thảo
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab("preview")}
                      className={`px-3 py-1 rounded-md font-semibold transition ${
                        previewTab === "preview"
                          ? "bg-white text-primary shadow-xs"
                          : "text-on-surface-variant hover:text-on-surface"
                      }`}
                    >
                      Xem trước ({questions.length})
                    </button>
                  </div>
                </div>
              </div>

              {previewTab === "edit" ? (
                <div className="space-y-4">
                  {questions.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-outline-variant rounded-xl bg-white">
                      <span className="material-symbols-outlined text-[32px] text-on-surface-variant mb-1">
                        quiz
                      </span>
                      <p className="text-sm font-medium text-on-surface">Chưa có câu hỏi nào</p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Nhấn nút bên dưới để thêm câu hỏi đầu tiên
                      </p>
                    </div>
                  ) : (
                    questions.map((q, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-outline-variant bg-white p-4 space-y-3 shadow-xs"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs">
                              {idx + 1}
                            </span>
                            <span className="text-sm font-bold text-on-surface">
                              Câu hỏi {idx + 1}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Reorder Buttons */}
                            <button
                              type="button"
                              onClick={() => handleMoveQuestion(idx, "up")}
                              disabled={idx === 0}
                              className="p-1 rounded text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                              title="Di chuyển lên"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                arrow_upward
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveQuestion(idx, "down")}
                              disabled={idx === questions.length - 1}
                              className="p-1 rounded text-on-surface-variant hover:bg-surface-container disabled:opacity-30"
                              title="Di chuyển xuống"
                            >
                              <span className="material-symbols-outlined text-[18px]">
                                arrow_downward
                              </span>
                            </button>

                            {/* Required Checkbox */}
                            <label className="flex items-center gap-1.5 text-xs font-medium text-on-surface cursor-pointer ml-2">
                              <input
                                type="checkbox"
                                checked={q.required}
                                onChange={() => handleToggleQuestionRequired(idx)}
                                className="rounded border-outline-variant text-primary focus:ring-primary"
                              />
                              Bắt buộc
                            </label>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleRemoveQuestion(idx)}
                              className="p-1 rounded text-error hover:bg-error/10 ml-2"
                              title="Xóa câu hỏi"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </div>

                        <RichTextEditor
                          content={q.content}
                          onChange={(html) => handleUpdateQuestion(idx, html)}
                          placeholder={`Nhập nội dung đề bài cho câu hỏi ${idx + 1}...`}
                          minHeight={100}
                          maxHeight={250}
                        />
                      </div>
                    ))
                  )}

                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-primary/40 text-primary font-semibold text-sm hover:bg-primary/5 transition"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    Thêm câu hỏi mới
                  </button>
                </div>
              ) : (
                /* Preview Tab */
                <div className="space-y-4 max-h-[400px] overflow-y-auto p-2">
                  {questions.length === 0 ? (
                    <p className="text-sm text-on-surface-variant text-center py-4">
                      Chưa có câu hỏi để xem trước
                    </p>
                  ) : (
                    questions.map((q, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl border border-outline-variant bg-white p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between font-bold text-sm text-on-surface">
                          <span>
                            Câu {idx + 1} {q.required && <span className="text-error">*</span>}
                          </span>
                          {q.required && (
                            <span className="text-xs text-error font-normal">(Bắt buộc)</span>
                          )}
                        </div>
                        <SafeHTML html={q.content} fallbackText="Chưa có nội dung câu hỏi" />
                        <div className="mt-2 rounded-lg border border-dashed border-outline-variant p-3 bg-surface-container-lowest text-xs text-on-surface-variant italic">
                          [Ô soạn thảo trả lời của sinh viên sẽ hiển thị tại đây]
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* Mô tả chung */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Mô tả / Hướng dẫn bài tập
            </label>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              className="h-24 w-full resize-none rounded-xl border border-outline-variant px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
              placeholder="Nhập yêu cầu chung, tiêu chí chấm điểm, cách thức làm bài..."
            />
          </div>

          {/* Deadline và Thang điểm */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-on-surface">
                Hạn nộp (Deadline) <span className="text-error">*</span>
              </label>
              <input
                type="datetime-local"
                value={deadline}
                onChange={(event) => setDeadline(event.target.value)}
                className="w-full rounded-xl border border-outline-variant px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm"
                required
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center justify-between text-sm font-semibold text-on-surface">
                <span>Thang điểm tối đa <span className="text-error">*</span></span>
                {isEditing && hasGradedSubmissions && (
                  <span className="text-[10px] text-amber-600 font-normal bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">Đã khóa (có bài được chấm)</span>
                )}
              </label>
              <input
                type="number"
                min="1"
                max="1000"
                value={maxScore}
                onChange={(event) => setMaxScore(Number(event.target.value))}
                disabled={isEditing && hasGradedSubmissions}
                className={`w-full rounded-xl border border-outline-variant px-4 py-2.5 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 text-sm ${
                  isEditing && hasGradedSubmissions ? "bg-surface-container opacity-60 cursor-not-allowed" : ""
                }`}
                placeholder="Ví dụ: 10, 100..."
                required
              />
              <p className="mt-1 text-[11px] text-on-surface-variant">Thường dùng thang 10 hoặc 100</p>
            </div>
          </div>

          {/* Tài liệu đính kèm */}
          <div>
            <label className="mb-1.5 block text-sm font-semibold text-on-surface">
              Tài liệu / File đề bài (Tối đa 5 files)
            </label>
            <div className="relative cursor-pointer rounded-xl border-2 border-dashed border-outline-variant p-4 text-center transition-colors hover:border-primary">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
              <span className="material-symbols-outlined mb-1 text-[28px] text-on-surface-variant">
                upload_file
              </span>
              <p className="text-sm font-medium text-on-surface">
                Nhấp hoặc kéo thả file đề bài vào đây
              </p>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                PDF, Word, Excel, ZIP hoặc ảnh...
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {selectedFiles.map((file, index) => (
                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between rounded-lg border border-outline-variant bg-surface p-2"
                  >
                    <span className="max-w-[85%] truncate text-xs text-on-surface font-medium">
                      {file.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-error hover:text-error-container p-1 rounded"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 border-t border-outline-variant pt-4">
            <Button
              onClick={onClose}
              className="flex-1 rounded-xl px-4 py-2.5 font-bold text-on-surface text-sm"
              disabled={loading}
              size="large"
            >
              Hủy bỏ
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              className="flex-1 rounded-xl px-4 py-2.5 font-bold text-sm"
              loading={loading}
              disabled={loading}
              size="large"
            >
              {isEditing ? "Lưu thay đổi" : "Giao bài tập"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssignmentModal;
