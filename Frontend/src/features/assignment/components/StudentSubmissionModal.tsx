import React from "react";
import { Modal, Typography } from "antd";
import { SubmissionDetailView, type ISubmissionDetail } from "./SubmissionDetailView";

const { Text } = Typography;

interface StudentSubmissionModalProps {
  open: boolean;
  onClose: () => void;
  submission: ISubmissionDetail | null;
  assignmentTitle?: string;
}

export const StudentSubmissionModal: React.FC<StudentSubmissionModalProps> = ({
  open,
  onClose,
  submission,
  assignmentTitle,
}) => {
  if (!submission) return null;

  return (
    <Modal
      title={
        <div>
          <Text strong style={{ fontSize: 18, display: "block" }}>
            Chi tiết bài nộp
          </Text>
          {assignmentTitle && (
            <Text type="secondary" style={{ fontSize: 13, fontWeight: "normal" }}>
              Bài tập: {assignmentTitle}
            </Text>
          )}
        </div>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
      destroyOnClose
    >
      <div style={{ paddingTop: 16 }}>
        <SubmissionDetailView submission={submission} />
      </div>
    </Modal>
  );
};
