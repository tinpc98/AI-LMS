import React from "react";
import { Modal, Typography } from "antd";
import { AttemptDetailView } from "./AttemptDetailView";
import type { IAssignmentAttempt } from "../../../interface/assignmentInterface";

const { Text } = Typography;

interface StudentSubmissionModalProps {
  open: boolean;
  onClose: () => void;
  attempt: IAssignmentAttempt | null;
  assignmentTitle?: string;
}

export const StudentSubmissionModal: React.FC<StudentSubmissionModalProps> = ({
  open,
  onClose,
  attempt,
  assignmentTitle,
}) => {
  if (!attempt) return null;

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
        <AttemptDetailView attempt={attempt} />
      </div>
    </Modal>
  );
};
