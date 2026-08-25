import React, { useState } from "react";
import { Modal, Form, InputNumber, DatePicker, Select, message } from "antd";
import dayjs from "dayjs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { payrollApi } from "../../../api/payrollApi";
import type {
  CreatePayrollConfigPayload,
  PayrollConfigType,
  PayrollConfigStatus,
} from "../../../types/payroll";
import axiosClient from "../../../api/axiosClient";

interface Props {
  open: boolean;
  onClose: () => void;
}

interface TeacherOption {
  _id: string;
  fullName?: string;
  email?: string;
}

interface FormValues {
  teacherId: string;
  type: PayrollConfigType;
  amount: number;
  effectiveFrom: dayjs.Dayjs;
  effectiveTo?: dayjs.Dayjs | null;
  status?: PayrollConfigStatus;
}

const PayrollConfigModal: React.FC<Props> = ({ open, onClose }) => {
  const [form] = Form.useForm<FormValues>();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);

  // Lấy danh sách Teacher từ API /users
  const { data: teachersData } = useQuery({
    queryKey: ["users", "teachers"],
    queryFn: async (): Promise<TeacherOption[]> => {
      const res = await axiosClient.get<{ data: TeacherOption[] }>("/users", {
        // limit tối đa validatePagination cho phép là 100
        params: { role: "Teacher", limit: 100 },
      });
      return res.data.data ?? [];
    },
    enabled: open,
  });

  const createMutation = useMutation({
    mutationFn: (payload: CreatePayrollConfigPayload) => payrollApi.createPayrollConfig(payload),
    onSuccess: () => {
      message.success("Tạo cấu hình lương thành công!");
      queryClient.invalidateQueries({ queryKey: ["payrollConfigs"] });
      form.resetFields();
      onClose();
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Tạo cấu hình lương thất bại";
      message.error(msg);
    },
  });

  const handleOk = async () => {
    try {
      setSubmitting(true);
      const values = await form.validateFields();
      const payload: CreatePayrollConfigPayload = {
        teacherId: values.teacherId,
        type: values.type,
        amount: values.amount,
        effectiveFrom: values.effectiveFrom.startOf("day").toISOString(),
        effectiveTo: values.effectiveTo ? values.effectiveTo.endOf("day").toISOString() : undefined,
        status: values.status ?? "ACTIVE",
      };
      await createMutation.mutateAsync(payload);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title="Tạo cấu hình lương giáo viên"
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
          name="teacherId"
          label="Giáo viên"
          rules={[{ required: true, message: "Vui lòng chọn giáo viên" }]}
        >
          <Select
            placeholder="Chọn giáo viên"
            showSearch
            optionFilterProp="label"
            options={(teachersData ?? []).map((t) => ({
              value: t._id,
              label: t.fullName ?? t.email ?? t._id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="type"
          label="Loại lương"
          rules={[{ required: true }]}
          initialValue="PER_SESSION"
        >
          <Select
            options={[
              { value: "PER_SESSION", label: "Theo buổi (PER_SESSION)" },
              { value: "PER_COURSE", label: "Theo khóa (PER_COURSE)" },
            ]}
          />
        </Form.Item>

        <Form.Item
          name="amount"
          label="Mức lương (VNĐ)"
          rules={[
            { required: true, message: "Vui lòng nhập mức lương" },
            { type: "number", min: 0, message: "Lương không được âm" },
          ]}
        >
          <InputNumber
            style={{ width: "100%" }}
            formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
            parser={(v) => Number(v?.replace(/,/g, "") ?? 0) as unknown as 0}
            placeholder="VD: 300000"
            min={0}
          />
        </Form.Item>

        <Form.Item
          name="effectiveFrom"
          label="Hiệu lực từ ngày"
          rules={[{ required: true, message: "Vui lòng chọn ngày hiệu lực" }]}
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item name="effectiveTo" label="Hiệu lực đến ngày (để trống = vô thời hạn)">
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} allowClear />
        </Form.Item>

        <Form.Item name="status" label="Trạng thái" initialValue="ACTIVE">
          <Select
            options={[
              { value: "ACTIVE", label: "Đang hiệu lực (ACTIVE)" },
              { value: "INACTIVE", label: "Ngưng hiệu lực (INACTIVE)" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default PayrollConfigModal;
