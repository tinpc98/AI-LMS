import React, { useState } from "react";
import { Modal, Form, Input, InputNumber, Button, Select } from "antd";
import aiApi from "../../../api/aiApi";
import { toast } from "../../../utils/toast";

interface AIQuestionGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonId: string;
  folderId?: string;
  onSuccess: () => void;
}

export function AIQuestionGeneratorModal({
  isOpen,
  onClose,
  lessonId,
  folderId,
  onSuccess,
}: AIQuestionGeneratorModalProps) {
  const [form] = Form.useForm();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (values: any) => {
    if (!lessonId) {
      toast.error("Không tìm thấy Lesson ID để sinh câu hỏi.");
      return;
    }

    const {
      title,
      questionCount,
      mcqCount,
      tfCount,
      shortCount,
      essayCount,
      easyCount,
      mediumCount,
      hardCount,
    } = values;

    const totalTypes = (mcqCount || 0) + (tfCount || 0) + (shortCount || 0) + (essayCount || 0);
    if (totalTypes !== questionCount) {
      toast.error(
        `Tổng số câu hỏi phân bổ theo loại (${totalTypes}) phải bằng Tổng số câu (${questionCount})`
      );
      return;
    }

    const totalDiff = (easyCount || 0) + (mediumCount || 0) + (hardCount || 0);
    if (totalDiff !== questionCount) {
      toast.error(
        `Tổng số câu hỏi phân bổ theo độ khó (${totalDiff}) phải bằng Tổng số câu (${questionCount})`
      );
      return;
    }

    setIsGenerating(true);
    try {
      const payload = {
        folderId: folderId || "default", // Need a valid folderId in reality, but backend might validate it. If no folderId, the component should probably pass a valid one or we use a fallback.
        title,
        questionCount,
        questionTypes: {
          multiple_choice: mcqCount || 0,
          true_false: tfCount || 0,
          short_answer: shortCount || 0,
          essay: essayCount || 0,
        },
        difficultyDistribution: {
          easy: easyCount || 0,
          medium: mediumCount || 0,
          hard: hardCount || 0,
        },
      };

      await aiApi.generateQuestionSet(lessonId, payload);
      toast.success("AI đã sinh câu hỏi thành công và lưu vào Ngân hàng!");
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Lỗi khi sinh câu hỏi bằng AI");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 text-indigo-700">
          <span className="material-symbols-outlined">auto_awesome</span>
          <span>Sinh câu hỏi tự động (AI)</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleGenerate}
        initialValues={{
          title: "Bộ câu hỏi sinh bởi AI",
          questionCount: 10,
          mcqCount: 5,
          tfCount: 3,
          shortCount: 2,
          essayCount: 0,
          easyCount: 4,
          mediumCount: 4,
          hardCount: 2,
        }}
      >
        <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 mb-6 text-sm text-indigo-800 flex flex-col gap-2">
          <p>
            Hệ thống AI sẽ phân tích nội dung bài học để sinh ra bộ câu hỏi trắc nghiệm và tự luận
            phù hợp nhất.
          </p>
          <div className="flex items-center gap-1.5 text-amber-600 font-medium bg-amber-50 p-2 rounded border border-amber-100 w-fit">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Nội dung do AI đề xuất — giáo viên cần kiểm tra kỹ trước khi xuất bản.
          </div>
        </div>

        <Form.Item
          label="Tên bộ câu hỏi / Chủ đề"
          name="title"
          rules={[{ required: true, message: "Vui lòng nhập tên!" }]}
        >
          <Input placeholder="Nhập chủ đề để AI tập trung..." />
        </Form.Item>

        <Form.Item
          label="Tổng số câu cần sinh"
          name="questionCount"
          rules={[{ required: true, message: "Vui lòng nhập số lượng!" }]}
        >
          <InputNumber min={1} max={50} className="w-full" />
        </Form.Item>

        <div className="grid grid-cols-2 gap-4">
          <div className="border border-gray-200 p-4 rounded-lg">
            <h4 className="font-bold mb-3 text-gray-700">Phân bổ theo loại</h4>
            <Form.Item label="Trắc nghiệm (MCQ)" name="mcqCount" className="mb-2">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
            <Form.Item label="Đúng/Sai" name="tfCount" className="mb-2">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
            <Form.Item label="Trả lời ngắn" name="shortCount" className="mb-2">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
            <Form.Item label="Tự luận" name="essayCount" className="mb-0">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          </div>

          <div className="border border-gray-200 p-4 rounded-lg">
            <h4 className="font-bold mb-3 text-gray-700">Phân bổ độ khó</h4>
            <Form.Item label="Dễ" name="easyCount" className="mb-2">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
            <Form.Item label="Trung bình" name="mediumCount" className="mb-2">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
            <Form.Item label="Khó" name="hardCount" className="mb-0">
              <InputNumber min={0} className="w-full" />
            </Form.Item>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button onClick={onClose} disabled={isGenerating}>
            Hủy
          </Button>
          <Button
            type="primary"
            htmlType="submit"
            loading={isGenerating}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isGenerating ? "Đang xử lý..." : "Bắt đầu sinh"}
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
