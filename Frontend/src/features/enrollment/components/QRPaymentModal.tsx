import React from "react";
import { Modal, Typography, Descriptions, Spin, Alert, Button, Space } from "antd";
import type { Payment } from "../../../types/payment";
import { PaymentStatusTag } from "../../../shared/components/PaymentStatusTag";

interface QRPaymentModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (paymentId: string) => void;
  payment: Payment | null;
  loading?: boolean;
}

const { Text, Title } = Typography;

export const QRPaymentModal: React.FC<QRPaymentModalProps> = ({
  open,
  onCancel,
  onSubmit,
  payment,
  loading = false,
}) => {
  if (!payment) return null;

  const { transferInfo, amount, status, _id } = payment;
  const isPending = status === "PENDING";

  return (
    <Modal
      title="Thanh toán học phí"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Đóng
        </Button>,
        <Button
          key="submit"
          type="primary"
          onClick={() => onSubmit(_id)}
          disabled={!isPending || loading}
          loading={loading}
        >
          Tôi đã chuyển khoản
        </Button>,
      ]}
      width={600}
    >
      <Spin spinning={loading}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Alert
            message="Hướng dẫn thanh toán"
            description="Vui lòng quét mã QR hoặc chuyển khoản theo thông tin bên dưới. Chú ý ghi đúng nội dung chuyển khoản để hệ thống tự động xác nhận."
            type="info"
            showIcon
          />

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Descriptions column={1} bordered size="small" labelStyle={{ width: "140px" }}>
                <Descriptions.Item label="Trạng thái">
                  <PaymentStatusTag status={status} />
                </Descriptions.Item>
                <Descriptions.Item label="Ngân hàng">
                  <Text strong>{transferInfo?.bankName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Chủ tài khoản">
                  <Text strong>{transferInfo?.accountName}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Số tài khoản">
                  <Text copyable strong>{transferInfo?.accountNumber}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="Số tiền">
                  <Text copyable strong style={{ color: "var(--color-error-text)", fontSize: 16 }}>
                    {amount?.toLocaleString()} VND
                  </Text>
                </Descriptions.Item>
                <Descriptions.Item label="Nội dung CK">
                  <Text copyable strong mark>{transferInfo?.transferContent}</Text>
                </Descriptions.Item>
              </Descriptions>
            </div>

            {transferInfo?.qrData && (
              <div style={{ textAlign: "center", border: "1px solid #d9d9d9", padding: 8, borderRadius: 8, backgroundColor: "white" }}>
                <img src={transferInfo.qrData} alt="Mã QR thanh toán" style={{ width: 200, height: 200, display: "block" }} />
                <Text type="secondary" style={{ display: "block", marginTop: 8 }}>Quét mã để thanh toán</Text>
              </div>
            )}
          </div>
        </Space>
      </Spin>
    </Modal>
  );
};

export default QRPaymentModal;
