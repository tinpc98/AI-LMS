import React, { useState } from "react";
import {
  Modal,
  Form,
  Input,
  DatePicker,
  Button,
  message,
} from "antd";
import dayjs from "dayjs";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { payrollApi } from "../../../api/payrollApi";
import type { CreatePayrollPeriodPayload } from "../../../types/payroll";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface FormValues {
  name: string;
  dateRange: [dayjs.Dayjs, dayjs.Dayjs];
}

const PayrollPeriodModal: React.FC<Props> = ({ open, onClose }) => {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  const createMutation = useMutation({
    mutationFn: (payload: CreatePayrollPeriodPayload) =>
      payrollApi.createPayrollPeriod(payload),
    onSuccess: () => {
      message.success("Tạo kỳ lương thành công!");
      queryClient.invalidateQueries({ queryKey: ["payrollPeriods"] });
      form.resetFields();
      onClose();
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Tạo kỳ lương thất bại";
      message.error(msg);
    },
  });

  const handleOk = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      const payload: CreatePayrollPeriodPayload = {
        name: values.name.trim(),
        startDate: values.dateRange[0].startOf("day").toISOString(),
        endDate: values.dateRange[1].endOf("day").toISOString(),
      };
      await createMutation.mutateAsync(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Tạo kỳ lương mới"
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Tạo"
      cancelText="Hủy"
      confirmLoading={submitting}
      destroyOnClose
    >
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          name="name"
          label="Tên kỳ lương"
          rules={[{ required: true, message: "Vui lòng nhập tên kỳ lương" }]}
        >
          <Input placeholder="VD: Tháng 09/2026" />
        </Form.Item>
        <Form.Item
          name="dateRange"
          label="Khoảng thời gian"
          rules={[{ required: true, message: "Vui lòng chọn khoảng thời gian" }]}
        >
          <DatePicker.RangePicker
            format="DD/MM/YYYY"
            style={{ width: "100%" }}
            placeholder={["Ngày bắt đầu", "Ngày kết thúc"]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PayrollPeriodModal;
