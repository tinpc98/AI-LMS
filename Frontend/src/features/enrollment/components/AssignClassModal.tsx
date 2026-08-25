import React, { useState } from "react";
import { Modal, Select, Button, message, Form } from "antd";
import { useQuery } from "@tanstack/react-query";
import axiosClient from "../../../api/axiosClient";
import type { EnrollmentRecord } from "../enrollment.types";

interface AssignClassModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (classId: string) => void;
  enrollment: EnrollmentRecord | null;
  loading?: boolean;
}

const AssignClassModal: React.FC<AssignClassModalProps> = ({
  open,
  onCancel,
  onSubmit,
  enrollment,
  loading = false,
}) => {
  const [form] = Form.useForm();
  
  // Use generic query to fetch classes for the course
  // Assuming GET /classes?courseId=... exists
  const courseId = typeof enrollment?.courseId === "object" ? enrollment.courseId?._id : enrollment?.courseId;

  const { data: classesData, isLoading: classesLoading } = useQuery({
    queryKey: ["classes", "by-course", courseId],
    queryFn: async () => {
      if (!courseId) return [];
      const res = await axiosClient.get(`/classes`, { params: { courseId, status: "OPEN" } });
      return res.data.data || [];
    },
    enabled: !!courseId && open,
  });

  const handleFinish = (values: { classId: string }) => {
    onSubmit(values.classId);
  };

  return (
    <Modal
      title="Xếp lớp cho học viên"
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="classId"
          label="Chọn lớp học"
          rules={[{ required: true, message: "Vui lòng chọn lớp học" }]}
        >
          <Select
            placeholder="Chọn lớp"
            loading={classesLoading}
            options={classesData?.map((cls: any) => ({
              label: `${cls.code} - ${cls.name}`,
              value: cls._id,
            }))}
          />
        </Form.Item>
        <div style={{ textAlign: "right", marginTop: 24 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Lưu
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default AssignClassModal;
