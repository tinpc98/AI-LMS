import { Modal } from "antd";

interface DeleteConfirmModalProps {
  open: boolean;
  courseName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal = ({ open, courseName, onConfirm, onCancel }: DeleteConfirmModalProps) => {
  return (
    <Modal
      open={open}
      title="Delete Course"
      okText="Delete"
      okType="danger"
      onOk={onConfirm}
      onCancel={onCancel}
    >
      Are you sure you want to delete <strong>{courseName || "this course"}</strong>? This action
      cannot be undone.
    </Modal>
  );
};

export default DeleteConfirmModal;
