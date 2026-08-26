import React, { useState, useEffect } from "react";
import dayjs, { type Dayjs } from "dayjs";
import type { IAssignment, IAssignmentQuestion } from "../../../interface/assignmentInterface";
import type { IQuestion } from "../../../types/exam";
import { toast } from "../../../utils/toast";
import assignmentApi from "../../../api/assignmentApi";
import { examApi } from "../../../api/examApi";
import { Modal, Button, Input, Select, InputNumber, Space, DatePicker } from "antd";

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  lessonId?: string;
  initialAssignment?: IAssignment | null;
  hasGradedSubmissions?: boolean;
  onCreated: (newAssignment: IAssignment) => void;
}

export const CreateAssignmentModal: React.FC<CreateAssignmentModalProps> = ({
  isOpen,
  onClose,
  classId,
  initialAssignment,
  hasGradedSubmissions = false,
  onCreated,
}) => {
  const isEditing = Boolean(initialAssignment?._id);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [topicId, setTopicId] = useState<string>("");
  const [questions, setQuestions] = useState<IAssignmentQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  // TÍNH NĂNG MỚI: deadline thật cho Assignment, mirror CreateExamWizardModal.
  const [duration, setDuration] = useState<number>(30);
  const [startAt, setStartAt] = useState<Dayjs | null>(null);
  const [endAt, setEndAt] = useState<Dayjs | null>(null);

  // Bank questions
  const [bankQuestions, setBankQuestions] = useState<IQuestion[]>([]);
  const [topics, setTopics] = useState<Array<{ _id: string; name: string }>>([]);

  useEffect(() => {
    if (isOpen) {
      fetchBankQuestions();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialAssignment) {
      setTitle(initialAssignment.title || "");
      setDescription(initialAssignment.description || "");
      setTopicId(initialAssignment.topicId?._id || initialAssignment.topicId || "");
      setQuestions(initialAssignment.questions || []);
      setDuration(initialAssignment.duration || 30);
      setStartAt(initialAssignment.startAt ? dayjs(initialAssignment.startAt) : null);
      setEndAt(initialAssignment.endAt ? dayjs(initialAssignment.endAt) : null);
    } else {
      setTitle("");
      setDescription("");
      setTopicId("");
      setQuestions([]);
      setDuration(30);
      setStartAt(null);
      setEndAt(null);
    }
  }, [initialAssignment, isOpen]);

  const fetchBankQuestions = async () => {
    try {
      // Assuming examApi.getQuestions returns all questions accessible by the teacher
      const res = await examApi.getQuestions();
      setBankQuestions(res.data);

      // Extract unique topics from questions
      const uniqueTopics = new Map<string, string>();
      res.data.forEach((q) => {
        if (q.topic && typeof q.topic === "string") {
          uniqueTopics.set(q.topic, "Topic " + q.topic);
        }
      });
      setTopics(Array.from(uniqueTopics.entries()).map(([id, name]) => ({ _id: id, name })));
    } catch (err) {
      toast.error("Không thể tải danh sách câu hỏi");
    }
  };

  const handleAddQuestion = (qId: string) => {
    if (questions.find((q) => q.questionId === qId)) return;
    setQuestions([...questions, { questionId: qId, order: questions.length + 1, points: 1 }]);
  };

  const handleRemoveQuestion = (qId: string) => {
    setQuestions(questions.filter((q) => q.questionId !== qId));
  };

  const handleUpdatePoints = (qId: string, points: number) => {
    setQuestions(questions.map((q) => (q.questionId === qId ? { ...q, points } : q)));
  };

  const handleSubmit = async () => {
    if (!title.trim() || !topicId) {
      toast.error("Vui lòng nhập tiêu đề và chọn chủ đề (Topic)");
      return;
    }

    if (questions.length === 0) {
      toast.error("Vui lòng chọn ít nhất 1 câu hỏi");
      return;
    }

    if (!duration || duration < 1) {
      toast.error("Vui lòng nhập thời gian làm bài (phút)");
      return;
    }

    if (startAt && endAt && !startAt.isBefore(endAt)) {
      toast.error("Thời gian bắt đầu phải trước thời gian kết thúc");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        topicId,
        title,
        description,
        questions: questions.map((q) => ({
          questionId: q.questionId,
          order: q.order,
          points: q.points,
        })),
        duration,
        startAt: startAt ? startAt.toISOString() : null,
        endAt: endAt ? endAt.toISOString() : null,
        status: "PUBLISHED" as const, // Auto publish for simplicity
      };

      if (isEditing && initialAssignment?._id) {
        toast.error("Chức năng cập nhật bài tập đang được bảo trì.");
      } else {
        const res = await assignmentApi.createAssignment(payload);
        toast.success("Tạo bài tập thành công");
        onCreated(res);
        onClose();
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Có lỗi xảy ra khi lưu bài tập");
    } finally {
      setLoading(false);
    }
  };

  // Filter bank questions by selected topic
  const availableQuestions = bankQuestions.filter((q) => {
    return q.topic === topicId;
  });

  return (
    <Modal
      title={isEditing ? "Chỉnh sửa bài tập" : "Tạo bài tập mới"}
      open={isOpen}
      onCancel={onClose}
      width={1000}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={loading}>
          Hủy
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          disabled={hasGradedSubmissions}
        >
          Lưu
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: "100%" }} size="large">
        <div>
          <label className="block mb-2 font-semibold">Chủ đề (Topic) *</label>
          <Select
            style={{ width: "100%" }}
            placeholder="Chọn chủ đề"
            value={topicId || undefined}
            onChange={(val) => {
              setTopicId(val);
              setQuestions([]); // Reset questions when topic changes
            }}
            options={topics.map((t) => ({ label: t.name, value: t._id }))}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Tiêu đề bài tập *</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ví dụ: Bài tập trắc nghiệm Đạo hàm"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Mô tả thêm</label>
          <Input.TextArea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ghi chú thêm cho học sinh..."
          />
        </div>

        <div className="flex gap-4">
          <div style={{ flex: 1 }}>
            <label className="block mb-2 font-semibold">Thời gian làm bài (Phút) *</label>
            <InputNumber
              min={1}
              max={600}
              value={duration}
              onChange={(val) => setDuration(val || 1)}
              style={{ width: "100%" }}
              placeholder="Ví dụ: 30 phút"
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="block mb-2 font-semibold">Thời gian mở (tùy chọn)</label>
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              value={startAt}
              onChange={(val) => setStartAt(val)}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label className="block mb-2 font-semibold">Thời gian đóng (tùy chọn)</label>
            <DatePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              value={endAt}
              onChange={(val) => setEndAt(val)}
              style={{ width: "100%" }}
            />
          </div>
        </div>

        {topicId && (
          <div className="flex gap-4">
            <div className="flex-1 border p-4 rounded bg-gray-50">
              <h4 className="font-semibold mb-2">Ngân hàng câu hỏi (Topic đã chọn)</h4>
              <div className="max-h-64 overflow-y-auto">
                {availableQuestions.length === 0 && (
                  <p className="text-gray-500">Không có câu hỏi nào</p>
                )}
                {availableQuestions.map((q) => {
                  const isSelected = questions.some((sq) => sq.questionId === q._id);
                  return (
                    <div
                      key={q._id}
                      className="flex justify-between items-center bg-white p-2 mb-2 border rounded"
                    >
                      <div className="flex-1 truncate pr-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded mr-2">
                          {q.type}
                        </span>
                        <span className="text-sm">{q.content || "Câu hỏi..."}</span>
                      </div>
                      <Button
                        size="small"
                        type={isSelected ? "default" : "primary"}
                        onClick={() =>
                          isSelected ? handleRemoveQuestion(q._id) : handleAddQuestion(q._id)
                        }
                      >
                        {isSelected ? "Bỏ chọn" : "Chọn"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex-1 border p-4 rounded">
              <h4 className="font-semibold mb-2">Câu hỏi đã chọn ({questions.length})</h4>
              <div className="max-h-64 overflow-y-auto">
                {questions.length === 0 && <p className="text-gray-500">Chưa chọn câu hỏi nào</p>}
                {questions.map((q, idx) => {
                  const bq = bankQuestions.find((bq) => bq._id === q.questionId);
                  return (
                    <div
                      key={q.questionId}
                      className="flex flex-col bg-gray-50 p-2 mb-2 border rounded"
                    >
                      <div className="flex justify-between mb-2">
                        <span className="font-medium">Câu {idx + 1}</span>
                        <Button
                          size="small"
                          danger
                          onClick={() => handleRemoveQuestion(q.questionId)}
                        >
                          Xóa
                        </Button>
                      </div>
                      <div className="text-sm truncate mb-2 text-gray-600">
                        {bq?.content || "Câu hỏi..."}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Điểm:</span>
                        <InputNumber
                          min={0}
                          value={q.points}
                          onChange={(val) => handleUpdatePoints(q.questionId, val || 0)}
                          size="small"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Space>
    </Modal>
  );
};
