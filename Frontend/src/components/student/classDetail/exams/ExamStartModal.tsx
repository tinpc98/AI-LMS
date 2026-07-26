import React from "react";
import { Modal, Typography, Space, Alert } from "antd";
import { PlayCircleOutlined, ClockCircleOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import type { IExtendedExam } from "../../../types/studentExam";

const { Text, Title, Paragraph } = Typography;

interface ExamStartModalProps {
  open: boolean;
  item: IExtendedExam | null;
  onClose: () => void;
  onConfirm: (examId: string, attemptId?: string) => void;
}

export const ExamStartModal: React.FC<ExamStartModalProps> = React.memo(
  ({ open, item, onClose, onConfirm }) => {
    if (!item) return null;

    const questionCount = item.questions ? item.questions.length : item.totalQuestions || 20;

    return (
      <Modal
        open={open}
        onCancel={onClose}
        onOk={() => onConfirm(item._id, item.attempt?._id)}
        okText={item.status === "In Progress" ? "Tiếp tục làm bài" : "Bắt đầu thi ngay"}
        cancelText="Hủy bỏ"
        okButtonProps={{ style: { borderRadius: 8, backgroundColor: "#52c41a" } }}
        cancelButtonProps={{ style: { borderRadius: 8 } }}
        title={
          <Space align="center">
            <PlayCircleOutlined style={{ color: "#52c41a", fontSize: 22 }} />
            <span style={{ fontSize: 16, fontWeight: 700 }}>Xác nhận vào phòng thi</span>
          </Space>
        }
        centered
        width={480}
      >
        <div style={{ padding: "12px 0" }}>
          <Title level={5} style={{ margin: "0 0 8px 0", color: "#1f2937" }}>
            {item.title}
          </Title>

          <Space size={16} style={{ marginBottom: 16 }}>
            <Text type="secondary" style={{ fontSize: 13 }}>
              <ClockCircleOutlined style={{ marginRight: 4 }} />Thời gian: <strong>{item.duration || 45} phút</strong>
            </Text>
            <Text type="secondary" style={{ fontSize: 13 }}>
              <QuestionCircleOutlined style={{ marginRight: 4 }} />Số câu: <strong>{questionCount} câu</strong>
            </Text>
          </Space>

          <Alert
            message="Lưu ý quan trọng trước khi làm bài"
            description="Đồng hồ đếm ngược sẽ bắt đầu ngay khi bạn nhấn Bắt đầu. Đảm bảo kết nối internet ổn định trong quá trình làm bài."
            type="info"
            showIcon
            style={{ borderRadius: 10 }}
          />
        </div>
      </Modal>
    );
  }
);

ExamStartModal.displayName = "ExamStartModal";

export default ExamStartModal;
