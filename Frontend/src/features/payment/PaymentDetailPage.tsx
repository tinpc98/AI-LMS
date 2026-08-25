import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Typography, Row, Col, Spin, Alert, Button, Divider, message, Tag, Space } from "antd";
import { ArrowLeftOutlined, CloseCircleOutlined } from "@ant-design/icons";
import { paymentApi } from "../../api/paymentApi";
import type { Payment } from "../../types/payment";

const { Title, Text, Paragraph } = Typography;

const PaymentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (id) fetchPayment(id);
  }, [id]);

  const fetchPayment = async (paymentId: string) => {
    setLoading(true);
    try {
      const res = await paymentApi.getPaymentDetail(paymentId);
      if (res.success) {
        setPayment(res.data);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi tải thông tin thanh toán");
      navigate(-1);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id) return;
    setCancelling(true);
    try {
      const res = await paymentApi.cancelPayment(id);
      if (res.success) {
        message.success("Đã hủy thanh toán thành công");
        fetchPayment(id);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Không thể hủy thanh toán");
    } finally {
      setCancelling(false);
    }
  };

  if (loading || !payment) {
    return <Spin style={{ display: "block", margin: "50px auto" }} />;
  }

  const { transferInfo } = payment;
  const isPending = payment.status === "PENDING";

  return (
    <Card
      title={
        <Space>
          <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
          Thanh toán khóa học
        </Space>
      }
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} md={12}>
          <Title level={4}>Chi tiết đơn hàng</Title>
          <p>
            <Text type="secondary">Khóa học: </Text>
            <Text strong>{payment.courseId?.name}</Text>
          </p>
          <p>
            <Text type="secondary">Số tiền: </Text>
            <Text strong style={{ color: "#d9363e", fontSize: 18 }}>
              {payment.amount.toLocaleString("vi-VN")} {payment.currency}
            </Text>
          </p>
          <p>
            <Text type="secondary">Trạng thái: </Text>
            <Tag color={isPending ? "orange" : payment.status === "PAID" ? "green" : "red"}>
              {payment.status}
            </Tag>
          </p>

          <Divider />

          <Title level={5}>Thông tin chuyển khoản</Title>
          <Alert
            message="Lưu ý quan trọng"
            description="Vui lòng nhập đúng NỘI DUNG CHUYỂN KHOẢN để hệ thống ghi nhận tự động (nếu có) hoặc để trung tâm dễ dàng đối soát."
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
          />

          <p>
            <Text type="secondary">Ngân hàng: </Text>
            <Text strong>{transferInfo.bankName}</Text>
          </p>
          <p>
            <Text type="secondary">Tên tài khoản: </Text>
            <Text strong>{transferInfo.accountName}</Text>
          </p>
          <p>
            <Text type="secondary">Số tài khoản: </Text>
            <Paragraph copyable strong>
              {transferInfo.accountNumber}
            </Paragraph>
          </p>
          <p>
            <Text type="secondary">Nội dung chuyển khoản: </Text>
            <Paragraph copyable strong>
              {transferInfo.transferContent}
            </Paragraph>
          </p>

          {isPending && (
            <Button
              danger
              icon={<CloseCircleOutlined />}
              loading={cancelling}
              onClick={handleCancel}
              style={{ marginTop: 16 }}
            >
              Hủy thanh toán
            </Button>
          )}
        </Col>

        <Col xs={24} md={12} style={{ textAlign: "center" }}>
          {isPending ? (
            <>
              <Title level={4}>Quét mã QR để thanh toán</Title>
              {transferInfo.qrData ? (
                <img
                  src={transferInfo.qrData}
                  alt="QR Code"
                  style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 8, border: "1px solid #d9d9d9", padding: 16 }}
                />
              ) : (
                <Text type="secondary">Không có dữ liệu QR</Text>
              )}
            </>
          ) : (
            <Alert
              message={`Thanh toán này hiện đang ở trạng thái: ${payment.status}`}
              type={payment.status === "PAID" ? "success" : "error"}
              showIcon
              style={{ marginTop: 40 }}
            />
          )}
        </Col>
      </Row>
    </Card>
  );
};

export default PaymentDetailPage;
