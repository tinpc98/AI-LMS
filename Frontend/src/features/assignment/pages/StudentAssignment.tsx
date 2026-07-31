import { useState, type ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import { Spin, Alert, Button, Modal, Tag, Space } from "antd";
import { toast } from "../../../utils/toast";
import { useStudentAssignment } from "../../../hooks/useStudentAssignment";
import { AITutorSidebar } from "../components/assignment/AITutorSidebar";

const StudentAssignmentContent = () => {
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const {
    assignment,
    mySubmission,
    loading,
    error,
    isSubmitting,
    fetchAssignmentDetail,
    submitAssignment,
    cancelSubmission,
  } = useStudentAssignment(assignmentId);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [content, setContent] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const filesArray = Array.from(event.target.files ?? []);
    if (!filesArray.length) return;

    if (selectedFiles.length + filesArray.length > 5) {
      toast.warning("Bạn chỉ có thể đính kèm tối đa 5 tệp bài làm.");
      event.target.value = "";
      return;
    }

    setSelectedFiles((prev) => [...prev, ...filesArray]);
    event.target.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleCancelSubmission = () => {
    Modal.confirm({
      title: "Xác nhận hủy bài nộp?",
      content:
        "Sau khi hủy, bài nộp hiện tại sẽ không còn được tính là đã nộp. Bạn cần nộp lại bài trước thời hạn quy định.",
      okText: "Xác nhận hủy",
      okType: "danger",
      cancelText: "Quay lại",
      onOk: cancelSubmission,
    });
  };

  const handleSubmitAssignment = async () => {
    const formData = new FormData();
    formData.append("content", content);
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    const success = await submitAssignment(formData);
    if (success) {
      setIsModalOpen(false);
      setContent("");
      setSelectedFiles([]);
    }
  };

  if (loading) {
    return (
      <main className="ml-[280px] pt-16 h-screen flex items-center justify-center bg-surface">
        <Spin size="large" tip="Đang tải thông tin bài tập..." />
      </main>
    );
  }

  if (error) {
    return (
      <main className="ml-[280px] pt-16 h-screen p-10 bg-surface flex items-center justify-center">
        <Alert
          message="Lỗi nạp bài tập"
          description={error}
          type="error"
          showIcon
          action={
            <Button type="primary" danger onClick={fetchAssignmentDetail}>
              Thử lại
            </Button>
          }
        />
      </main>
    );
  }

  const deadlineFormatted = assignment?.deadline
    ? new Date(assignment.deadline).toLocaleString("vi-VN")
    : "Không có hạn nộp";

  const isGraded = Boolean(
    mySubmission &&
    ((mySubmission.grade !== null && mySubmission.grade !== undefined) ||
      mySubmission.status === "graded")
  );
  const isPassedDeadline = Boolean(
    assignment?.deadline && new Date() > new Date(assignment.deadline)
  );
  const isActiveSubmitted = Boolean(
    mySubmission && ["submitted", "late", "resubmitted"].includes(mySubmission.status)
  );
  const isWithdrawn = Boolean(mySubmission?.status === "withdrawn");

  const canCancel = isActiveSubmitted && !isGraded && !isPassedDeadline;
  const canSubmit = !isGraded && !isPassedDeadline;

  return (
    <main className="ml-[280px] pt-16 h-screen flex flex-col bg-surface relative">
      <div className="flex-1 pb-24 overflow-hidden flex">
        <section className="flex-1 overflow-y-auto custom-scrollbar px-10 py-8">
          <div className="max-w-[800px] mx-auto">
            {isGraded && (
              <Alert
                type="warning"
                message="Bài nộp đã được Giáo viên chấm điểm"
                description={`Điểm số: ${mySubmission?.grade}/100 điểm. ${
                  mySubmission?.feedback ? `Lời phê: "${mySubmission.feedback}"` : ""
                } Bạn không thể nộp lại hoặc hủy bài nộp.`}
                showIcon
                style={{ marginBottom: 24, borderRadius: 12 }}
              />
            )}
            {!isGraded && isPassedDeadline && (
              <Alert
                type="error"
                message="Bài tập đã quá hạn deadline"
                description="Hạn nộp bài tập đã kết thúc. Bạn không thể thực hiện nộp bài hoặc hủy bài nộp nữa."
                showIcon
                style={{ marginBottom: 24, borderRadius: 12 }}
              />
            )}

            <div className="bg-white rounded-xl border border-outline-variant p-8 mb-8 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <Space align="center">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-body-sm font-semibold rounded-full uppercase tracking-wider">
                    {assignment?.title || "Bài tập lớp học"}
                  </span>
                  {isGraded ? (
                    <Tag color="gold" style={{ borderRadius: 6, fontWeight: 700 }}>
                      🏆 Đã chấm: {mySubmission?.grade}/100 điểm
                    </Tag>
                  ) : isActiveSubmitted ? (
                    <Tag color="success" style={{ borderRadius: 6, fontWeight: 700 }}>
                      🟢 Đã nộp bài{" "}
                      {mySubmission?.status === "late"
                        ? "(Muộn)"
                        : mySubmission?.status === "resubmitted"
                          ? "(Đã nộp lại)"
                          : ""}
                    </Tag>
                  ) : isWithdrawn ? (
                    <Tag color="warning" style={{ borderRadius: 6, fontWeight: 700 }}>
                      🟡 Đã hủy bài nộp
                    </Tag>
                  ) : (
                    <Tag color="default" style={{ borderRadius: 6 }}>
                      ⚪ Chưa nộp bài
                    </Tag>
                  )}
                </Space>
                <span className="text-on-surface-variant text-body-sm">
                  Hạn nộp: {deadlineFormatted}
                </span>
              </div>
              <h3 className="font-headline-md text-headline-md text-on-surface mb-4">
                {assignment?.title || "Hướng dẫn làm bài"}
              </h3>
              <p className="text-on-surface-variant leading-relaxed mb-4 whitespace-pre-wrap">
                {assignment?.description ||
                  "Vui lòng đọc kỹ yêu cầu bài tập và hoàn thành bên dưới."}
              </p>
              {assignment?.attachments && assignment.attachments.length > 0 && (
                <div className="mb-4 space-y-2">
                  <h5 className="font-bold text-sm text-on-surface">
                    Tài liệu đính kèm từ Giảng viên:
                  </h5>
                  {assignment.attachments.map((att: any, idx: number) => (
                    <a
                      key={att.publicId || idx}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-primary underline text-body-sm mr-4"
                    >
                      📎 {att.name || "File đính kèm"}
                    </a>
                  ))}
                </div>
              )}
              {mySubmission && mySubmission.attachments && mySubmission.attachments.length > 0 && (
                <div className="mt-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant">
                  <h5 className="font-bold text-sm text-on-surface mb-2">
                    Tệp bài làm hiện tại của bạn:
                  </h5>
                  <div className="space-y-1">
                    {mySubmission.attachments.map((att: any, idx: number) => (
                      <a
                        key={att.publicId || idx}
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 text-primary underline text-body-sm mr-4"
                      >
                        📄 {att.name || "Tệp bài làm"}
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {mySubmission && mySubmission.content && (
                <div className="mt-4 p-4 bg-surface-container-low rounded-xl border border-outline-variant">
                  <h5 className="font-bold text-sm text-on-surface mb-2">Nội dung đã nộp:</h5>
                  <p className="text-sm whitespace-pre-wrap">{mySubmission.content}</p>
                </div>
              )}
            </div>

            {canSubmit && (
              <div className="bg-white rounded-xl border border-outline-variant p-8 shadow-sm">
                <h4 className="text-body-lg font-semibold text-on-surface mb-4">Phần làm bài</h4>
                <textarea
                  className="w-full h-48 rounded-xl border-outline-variant focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all p-4 text-body-md mb-4"
                  placeholder="Nhập nội dung bài làm của bạn tại đây (có thể kèm link)..."
                  style={{ resize: "vertical" }}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
                <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-on-surface">
                      Đính kèm tệp bài làm
                    </label>
                    <span className="text-xs text-on-surface-variant">
                      {selectedFiles.length}/5
                    </span>
                  </div>
                  <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-outline-variant px-4 py-3 text-sm text-primary transition-colors hover:bg-primary/5">
                    <input type="file" multiple className="hidden" onChange={handleFileChange} />
                    <span className="material-symbols-outlined text-[18px]">attach_file</span>
                    <span>Chọn tệp</span>
                  </label>
                  {selectedFiles.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {selectedFiles.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-sm text-on-surface"
                        >
                          <span className="max-w-[85%] truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="text-error hover:text-error-container"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Extracted AI Tutor Sidebar */}
        <AITutorSidebar />
      </div>

      <footer className="fixed bottom-0 right-0 left-[280px] bg-white border-t border-outline-variant h-20 px-10 flex items-center justify-between z-40">
        <div className="flex items-center gap-8">
          <div className="flex flex-col">
            <span className="text-on-surface-variant text-[12px] uppercase font-bold tracking-widest">
              Tiến độ
            </span>
            <div className="flex items-center gap-3">
              <div className="w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${canSubmit ? "w-1/3 bg-warning" : "w-full bg-success"} rounded-full`}
                ></div>
              </div>
              <span className="text-body-sm font-bold text-on-surface">
                {canSubmit ? "Chưa hoàn thành" : "Đã hoàn thành"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {canCancel && (
            <button
              className="px-6 py-2 border border-red-300 text-red-600 font-bold rounded-xl hover:bg-red-50 transition-colors disabled:opacity-50"
              onClick={handleCancelSubmission}
              disabled={isSubmitting}
            >
              Hủy bài nộp
            </button>
          )}
          <button
            className="px-8 py-2 bg-primary text-white font-bold rounded-xl hover:bg-primary-container transition-all active:scale-95 shadow-md shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => setIsModalOpen(true)}
            disabled={!canSubmit || isSubmitting || (!content.trim() && selectedFiles.length === 0)}
          >
            {isActiveSubmitted ? "Nộp lại bài tập" : "Nộp bài tập"}
          </button>
        </div>
      </footer>

      <div
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center ${isModalOpen ? "" : "hidden"}`}
        id="confirm-modal"
      >
        <div className="bg-white rounded-2xl w-[480px] p-8 shadow-2xl scale-100 transform transition-transform duration-300">
          <div className="w-16 h-16 bg-primary-fixed rounded-full flex items-center justify-center mb-6">
            <span
              className="material-symbols-outlined text-primary text-[32px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              cloud_upload
            </span>
          </div>
          <h3 className="font-headline-md text-headline-md text-on-surface mb-2">
            Bạn có chắc muốn nộp bài?
          </h3>
          <p className="text-on-surface-variant mb-8 leading-relaxed text-body-md">
            Sau khi nộp, hệ thống sẽ ghi nhận thời gian nộp bài của bạn. Nếu nộp muộn sau deadline,
            bài nộp sẽ bị đánh dấu "Nộp muộn".
          </p>
          <div className="flex gap-4">
            <button
              className="flex-1 py-3 border border-outline-variant rounded-xl font-bold text-on-surface hover:bg-slate-50 transition-colors"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Quay lại
            </button>
            <button
              className="flex-1 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary-container transition-all shadow-lg shadow-primary/30 disabled:opacity-70"
              onClick={handleSubmitAssignment}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Đang nộp..." : "Xác nhận nộp"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};

export default StudentAssignmentContent;
