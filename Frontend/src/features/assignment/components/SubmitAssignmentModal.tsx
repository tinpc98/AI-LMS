import React, { useState, useEffect, type ChangeEvent, useMemo } from "react";
import assignmentApi from "../../../api/assignmentApi";
import type { IAssignment, SubmissionMode } from "../../../interface/assignmentInterface";
import { getApiErrorMessage } from "../../../shared/utils/apiError";
import { useAuth } from "../../../shared/hooks/useAuth";
import useAssignmentDraft from "../hooks/useAssignmentDraft";
import RichTextEditor from "../../../shared/components/RichTextEditor";
import SafeHTML from "../../../shared/components/SafeHTML";
import { toast } from "../../../utils/toast";

import { Button, Input, Space } from "antd";
import { LinkOutlined } from "@ant-design/icons";

interface SubmitAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: IAssignment | null;
  initialSubmission?: any;
  onSuccess: (assignmentId: string) => void;
}

export default function SubmitAssignmentModal({
  isOpen,
  onClose,
  assignment,
  initialSubmission,
  onSuccess,
}: SubmitAssignmentModalProps) {
  const { user } = useAuth();
  const userId = user?._id || "guest";

  const assignmentMode: SubmissionMode = assignment?.submissionMode || "file";
  const [activeType, setActiveType] = useState<"file" | "link" | "direct">("file");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const {
    draftState,
    updateField,
    updateAnswer,
    saveStatus,
    lastSavedAt,
    hasRestoredLocal,
    saveToServer,
    clearDraft,
  } = useAssignmentDraft({
    assignmentId: assignment?._id || "",
    userId,
    initialSubmission,
    enabled: isOpen && Boolean(assignment?._id),
  });

  // Sync activeType with assignment mode or draft ONLY ON MOUNT or mode change
  useEffect(() => {
    if (!assignment) return;
    if (assignmentMode === "any") {
      setActiveType(draftState.submissionType || "file");
    } else {
      setActiveType(assignmentMode as "file" | "link" | "direct");
      updateField("submissionType", assignmentMode as "file" | "link" | "direct");
    }
  }, [assignment, assignmentMode]);

  const questions = useMemo(
    () => assignment?.questions || [],
    [assignment?.questions]
  );

  // Tính số câu hỏi đã trả lời (luôn chạy hook useMemo ổn định)
  const answeredCount = useMemo(() => {
    if (!questions.length || !draftState?.answers) return 0;
    return questions.filter((q) => {
      const ans = draftState.answers.find((a) => a.questionId === q._id?.toString());
      return ans && ans.content && ans.content.replace(/<[^>]+>/g, "").trim().length > 0;
    }).length;
  }, [questions, draftState?.answers]);

  const handleTypeChange = (type: "file" | "link" | "direct") => {
    setActiveType(type);
    updateField("submissionType", type);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const filesArray = Array.from(e.target.files ?? []);
    if (!filesArray.length) return;

    if (selectedFiles.length + filesArray.length > 5) {
      setErrorMsg("Bạn chỉ có thể đính kèm tối đa 5 tệp bài làm.");
      e.target.value = "";
      return;
    }

    setErrorMsg("");
    setSelectedFiles((prev) => [...prev, ...filesArray]);
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveDraftManual = async () => {
    try {
      await saveToServer();
      toast.success("Đã lưu bản nháp thành công!");
    } catch {
      toast.error("Không thể lưu bản nháp. Vui lòng thử lại!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    // Validate theo activeType
    if (activeType === "link") {
      const trimmedUrl = draftState.linkUrl.trim();
      if (!trimmedUrl) {
        setErrorMsg("Vui lòng nhập đường dẫn liên kết bài làm của bạn.");
        return;
      }
      if (!/^https?:\/\//i.test(trimmedUrl)) {
        setErrorMsg("Đường dẫn liên kết phải bắt đầu bằng http:// hoặc https://");
        return;
      }
    } else if (activeType === "direct") {
      if (questions.length > 0) {
        // Kiểm tra các câu hỏi bắt buộc
        for (const q of questions) {
          if (q.required) {
            const ans = draftState.answers.find((a) => a.questionId === q._id?.toString());
            const text = ans?.content ? ans.content.replace(/<[^>]+>/g, "").trim() : "";
            if (!text) {
              setErrorMsg(`Vui lòng hoàn thành câu hỏi số ${q.order || 1} (Bắt buộc).`);
              return;
            }
          }
        }
      } else if (!draftState.content.trim()) {
        setErrorMsg("Vui lòng nhập nội dung bài làm trực tiếp.");
        return;
      }
    } else if (activeType === "file") {
      if (selectedFiles.length === 0 && !draftState.content.trim()) {
        setErrorMsg("Vui lòng đính kèm ít nhất 1 tệp bài làm.");
        return;
      }
    }

    if (!assignment?._id) return;

    try {
      setIsSubmitting(true);
      setErrorMsg("");

      const formData = new FormData();
      formData.append("submissionType", activeType);

      if (activeType === "link") {
        formData.append("linkUrl", draftState.linkUrl.trim());
      } else if (activeType === "direct") {
        if (questions.length > 0) {
          formData.append("answers", JSON.stringify(draftState.answers));
        }
        if (draftState.content.trim()) {
          formData.append("content", draftState.content.trim());
        }
      }

      if (activeType !== "direct" && draftState.content.trim()) {
        formData.append("content", draftState.content.trim());
      }

      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      await assignmentApi.submitAssignment(assignment._id, formData);

      clearDraft();
      setSelectedFiles([]);
      toast.success("Nộp bài tập thành công!");
      onSuccess(assignment._id);
      onClose();
    } catch (err: unknown) {
      console.error("Lỗi khi nộp bài:", err);
      const msg = getApiErrorMessage(err, "Không thể nộp bài tập. Vui lòng thử lại!");
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !assignment) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-outline-variant max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-outline-variant shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-2xl">
                {activeType === "link"
                  ? "link"
                  : activeType === "direct"
                  ? "edit_document"
                  : "cloud_upload"}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-on-surface truncate">Nộp bài: {assignment.title}</h3>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="flex items-center gap-0.5 text-error">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  Hạn: {new Date(assignment.deadline).toLocaleString("vi-VN")}
                </span>
                {/* Auto-save status badge */}
                {saveStatus === "saving" && (
                  <span className="flex items-center gap-1 text-primary animate-pulse">
                    <span className="material-symbols-outlined text-[14px]">sync</span>
                    Đang lưu nháp...
                  </span>
                )}
                {saveStatus === "saved" && lastSavedAt && (
                  <span className="flex items-center gap-1 text-green-600">
                    <span className="material-symbols-outlined text-[14px]">cloud_done</span>
                    Đã lưu nháp {lastSavedAt.toLocaleTimeString("vi-VN")}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="text-on-surface-variant hover:text-on-surface p-1.5 rounded-full hover:bg-surface-container transition shrink-0"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
          {hasRestoredLocal && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 text-xs flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600 text-base">restore</span>
              <span>Đã tự động khôi phục nội dung bản nháp từ phiên làm việc trước của bạn.</span>
            </div>
          )}

          {assignment.description && (
            <div className="p-3 bg-surface-container-lowest rounded-xl text-xs text-on-surface-variant leading-relaxed border border-outline-variant">
              <strong className="text-on-surface font-semibold">Mô tả đề bài:</strong>{" "}
              {assignment.description}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-error-container/20 border border-error/30 rounded-xl text-error text-xs">
              {errorMsg}
            </div>
          )}

          {/* Mode Selector (Khi assignmentMode === 'any') */}
          {assignmentMode === "any" && (
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1.5">
                Chọn hình thức nộp bài:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleTypeChange("file")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    activeType === "file"
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-outline-variant text-on-surface hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  Tải file
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("link")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    activeType === "link"
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-outline-variant text-on-surface hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">link</span>
                  Dán link
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange("direct")}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    activeType === "direct"
                      ? "border-primary bg-primary/10 text-primary shadow-xs"
                      : "border-outline-variant text-on-surface hover:bg-surface-container"
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">edit_document</span>
                  Làm trực tiếp
                </button>
              </div>
            </div>
          )}

          {/* 1. Dán liên kết (Link Mode) */}
          {activeType === "link" && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1.5">
                  Đường dẫn liên kết bài làm <span className="text-error">*</span>
                </label>
                <Input
                  prefix={<LinkOutlined className="text-on-surface-variant mr-1" />}
                  value={draftState.linkUrl}
                  onChange={(e) => updateField("linkUrl", e.target.value)}
                  placeholder="https://drive.google.com/... hoặc https://github.com/..."
                  className="rounded-xl border-outline-variant py-2.5 text-sm w-full"
                />
                <p className="mt-1 text-[11px] text-on-surface-variant">
                  Hỗ trợ đường link Google Drive, GitHub, Figma, Notion, YouTube, v.v. Đảm bảo đã bật quyền truy cập!
                </p>
              </div>
            </div>
          )}

          {/* 2. Làm bài trực tiếp (Direct Mode) */}
          {activeType === "direct" && (
            <div className="space-y-4">
              {questions.length > 0 ? (
                <>
                  <div className="flex items-center justify-between text-xs text-on-surface-variant">
                    <span className="font-semibold text-on-surface">Danh sách câu hỏi:</span>
                    <span>
                      Đã trả lời <strong className="text-primary">{answeredCount}</strong> /{" "}
                      {questions.length} câu
                    </span>
                  </div>

                  <div className="space-y-4">
                    {questions.map((q, idx) => {
                      const ans = draftState.answers.find(
                        (a) => a.questionId === q._id?.toString()
                      );
                      const answerContent = ans?.content || "";

                      return (
                        <div
                          key={q._id || idx}
                          className="p-4 rounded-xl border border-outline-variant bg-surface-container-lowest space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[11px]">
                                {q.order || idx + 1}
                              </span>
                              Câu hỏi {q.order || idx + 1}
                            </span>
                            {q.required ? (
                              <span className="text-[11px] text-error font-medium">
                                * Bắt buộc
                              </span>
                            ) : (
                              <span className="text-[11px] text-on-surface-variant">Tùy chọn</span>
                            )}
                          </div>

                          {/* Nội dung câu hỏi của giáo viên */}
                          <div className="p-3 rounded-lg bg-white border border-outline-variant/60">
                            <SafeHTML html={q.content} fallbackText="Chưa có đề bài" />
                          </div>

                          {/* Trình soạn thảo câu trả lời của học sinh */}
                          <div>
                            <label className="block text-[11px] font-semibold text-on-surface mb-1">
                              Câu trả lời của bạn:
                            </label>
                            <RichTextEditor
                              content={answerContent}
                              onChange={(html) => updateAnswer(q._id?.toString() || "", html)}
                              placeholder="Nhập câu trả lời chi tiết..."
                              minHeight={120}
                              maxHeight={260}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* Trường hợp direct nhưng không có câu hỏi cấu trúc */
                <div>
                  <label className="block text-xs font-bold text-on-surface mb-1.5">
                    Nội dung bài làm trực tiếp <span className="text-error">*</span>
                  </label>
                  <RichTextEditor
                    content={draftState.content}
                    onChange={(html) => updateField("content", html)}
                    placeholder="Soạn thảo nội dung bài làm của bạn..."
                    minHeight={200}
                    maxHeight={350}
                  />
                </div>
              )}
            </div>
          )}

          {/* 3. Tải file (File Mode hoặc Đính kèm thêm) */}
          {(activeType === "file" || activeType === "link" || activeType === "direct") && (
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-on-surface">
                  {activeType === "file" ? "Đính kèm tệp bài làm" : "Tệp đính kèm bổ sung (tùy chọn)"}
                </label>
                <span className="text-[11px] text-on-surface-variant">
                  {selectedFiles.length}/5 tệp
                </span>
              </div>
              <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-outline-variant rounded-xl cursor-pointer hover:bg-primary/5 transition text-xs text-primary font-medium">
                <input type="file" multiple className="hidden" onChange={handleFileChange} />
                <span className="material-symbols-outlined text-lg">attach_file</span>
                <span>Chọn hoặc kéo thả tệp (PDF, Word, Zip, Ảnh...)</span>
              </label>

              {selectedFiles.length > 0 && (
                <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                  {selectedFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      className="flex items-center justify-between p-2 bg-surface-container-lowest rounded-lg border border-outline-variant text-xs"
                    >
                      <span className="truncate max-w-[80%] text-on-surface">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="text-error hover:text-error/80 p-1"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Ghi chú chung */}
          {activeType !== "direct" && (
            <div>
              <label className="block text-xs font-bold text-on-surface mb-1">
                Ghi chú thêm cho giáo viên (tùy chọn)
              </label>
              <textarea
                rows={2}
                value={draftState.content}
                onChange={(e) => updateField("content", e.target.value)}
                placeholder="Nhập lời nhắn hoặc ghi chú thêm..."
                className="w-full p-2.5 text-xs rounded-xl border border-outline-variant focus:ring-2 focus:ring-primary focus:border-primary text-on-surface"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-outline-variant shrink-0 gap-3">
          <Button
            type="default"
            onClick={handleSaveDraftManual}
            disabled={isSubmitting || saveStatus === "saving"}
            className="rounded-xl font-bold border-outline-variant flex items-center gap-1.5"
            size="large"
          >
            <span className="material-symbols-outlined text-[16px]">save</span>
            Lưu bản nháp
          </Button>

          <div className="flex gap-3">
            <Button
              onClick={onClose}
              disabled={isSubmitting}
              className="rounded-xl font-semibold border-outline-variant"
              size="large"
            >
              Hủy
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              disabled={isSubmitting}
              loading={isSubmitting}
              className="rounded-xl font-bold shadow-sm flex items-center justify-center"
              size="large"
            >
              Xác nhận nộp bài
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
