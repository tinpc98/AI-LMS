import { Modal } from "antd";

interface DeleteConfirmModalProps {
  open: boolean;
  className?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal = ({ open, className, onConfirm, onCancel }: DeleteConfirmModalProps) => {
  return (
    <Modal open={open} title="Delete Class" okText="Delete" okType="danger" onOk={onConfirm} onCancel={onCancel}>
      Are you sure you want to delete <strong>{className || "this class"}</strong>? This action cannot be undone.
    </Modal>
  );
};

export default DeleteConfirmModal;
