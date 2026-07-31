import { Modal } from "antd";

interface DeleteConfirmModalProps {
  open: boolean;
  accountName?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const DeleteConfirmModal = ({
  open,
  accountName,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) => {
  return (
    <Modal
      open={open}
      title="Delete Account"
      okText="Delete"
      okType="danger"
      onOk={onConfirm}
      onCancel={onCancel}
    >
      Are you sure you want to delete <strong>{accountName || "this account"}</strong>? This action
      cannot be undone.
    </Modal>
  );
};

export default DeleteConfirmModal;
