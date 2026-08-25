import React, { useEffect, useState } from "react";
import { Modal, Form, Input, Switch, Button, message, Spin } from "antd";
import { paymentApi } from "../../api/paymentApi";
import type { PaymentConfig } from "../../types/payment";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PaymentConfigModal: React.FC<Props> = ({ open, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchConfig();
    }
  }, [open]);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getConfig();
      if (res.success && res.data) {
        form.setFieldsValue(res.data);
      }
    } catch (error: any) {
      message.error("Không thể tải cấu hình thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: Partial<PaymentConfig>) => {
    setLoading(true);
    try {
      const res = await paymentApi.updateConfig(values);
      if (res.success) {
        message.success("Cập nhật cấu hình thành công");
        onClose();
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Cấu hình Thông tin Thanh toán (Bank Transfer)"
      open={open}
      onCancel={onClose}
      footer={null}
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="bankName"
            label="Tên Ngân Hàng (VD: Vietcombank, Techcombank, MB)"
            rules={[{ required: true, message: "Vui lòng nhập tên ngân hàng" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="accountNumber"
            label="Số Tài Khoản"
            rules={[{ required: true, message: "Vui lòng nhập số tài khoản" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="accountName"
            label="Tên Chủ Tài Khoản"
            rules={[{ required: true, message: "Vui lòng nhập tên chủ tài khoản" }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="transferPrefix"
            label="Tiền tố nội dung chuyển khoản (VD: EDU)"
            rules={[{ required: true, message: "Vui lòng nhập tiền tố" }]}
            help="Hệ thống sẽ tự động ghép tiền tố này với mã ID ghi danh (VD: EDU A1B2C3D4)"
          >
            <Input />
          </Form.Item>

          <Form.Item name="isActive" label="Kích hoạt thanh toán" valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item style={{ textAlign: "right", marginBottom: 0 }}>
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              Hủy
            </Button>
            <Button type="primary" htmlType="submit" loading={loading}>
              Lưu cấu hình
            </Button>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default PaymentConfigModal;
// Spin needs to be imported, let me quickly fix it in next call or here
