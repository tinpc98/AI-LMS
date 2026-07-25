import { Modal, Typography } from "antd";
import { ExclamationCircleOutlined } from "@ant-design/icons";
import type { AccountRecord, ClassRecord } from "./teacherAssignment.types";

interface DeleteAssignmentModalProps {
  open: boolean;
  classRecord?: ClassRecord;
  teacher?: AccountRecord | null;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const DeleteAssignmentModal = ({
  open,
  classRecord,
  teacher,
  onConfirm,
  onCancel,
  loading = false,
}: DeleteAssignmentModalProps) => {
  if (!classRecord) return null;

  return (
    <Modal
      title={
        <span>
          <ExclamationCircleOutlined style={{ color: "#fa8c16", marginRight: 8 }} /> Remove Teacher Assignment
        </span>
      }
      open={open}
      onOk={onConfirm}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="Remove Assignment"
      okButtonProps={{ danger: true }}
      destroyOnClose
    >
      <Typography.Paragraph>
        Are you sure you want to remove teacher{" "}
        <Typography.Text strong>{teacher?.fullName || "assigned teacher"}</Typography.Text> from class{" "}
        <Typography.Text strong>{classRecord.className}</Typography.Text> ({classRecord.classCode})?
      </Typography.Paragraph>
      <Typography.Paragraph type="secondary" style={{ fontSize: 13, margin: 0 }}>
        The class assignment status will be set to <Typography.Text type="warning">Unassigned</Typography.Text>.
      </Typography.Paragraph>
    </Modal>
  );
};

export default DeleteAssignmentModal;
