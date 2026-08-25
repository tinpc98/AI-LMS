import React from "react";
import { Modal, Form, Select, Button, message } from "antd";
import { useQuery } from "@tanstack/react-query";
import { courseService } from "../../course/courseService";
import type { CourseLevel } from "../../course/course.types";

interface EnrollCourseModalProps {
  open: boolean;
  onCancel: () => void;
  onSubmit: (values: { courseId: string; level: CourseLevel }) => void;
  loading?: boolean;
}

const EnrollCourseModal: React.FC<EnrollCourseModalProps> = ({
  open,
  onCancel,
  onSubmit,
  loading = false,
}) => {
  const [form] = Form.useForm();

  // Fetch available courses
  const { data: coursesData, isLoading: loadingCourses } = useQuery({
    queryKey: ["courses", "active"],
    queryFn: () => courseService.getCourses({ search: "", subjectId: "All", status: "PUBLISHED" }),
    enabled: open,
  });

  const handleFinish = (values: { courseId: string; level: CourseLevel }) => {
    onSubmit(values);
  };

  return (
    <Modal
      title="Đăng ký khóa học mới"
      open={open}
      onCancel={() => {
        form.resetFields();
        onCancel();
      }}
      footer={null}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="courseId"
          label="Chọn khóa học"
          rules={[{ required: true, message: "Vui lòng chọn khóa học." }]}
        >
          <Select
            placeholder="Chọn khóa học để đăng ký"
            loading={loadingCourses}
            options={coursesData?.data?.map((c) => ({
              label: `${c.code} - ${c.name} (Lớp ${c.grade})`,
              value: c.id,
            }))}
          />
        </Form.Item>

        <Form.Item
          name="level"
          label="Chọn trình độ (Level)"
          rules={[{ required: true, message: "Vui lòng chọn trình độ." }]}
        >
          <Select
            placeholder="Chọn trình độ mong muốn"
            options={[
              { label: "Foundation", value: "FOUNDATION" },
              { label: "Intermediate", value: "INTERMEDIATE" },
              { label: "Advanced", value: "ADVANCED" },
            ]}
          />
        </Form.Item>

        <div style={{ textAlign: "right", marginTop: 24 }}>
          <Button onClick={onCancel} style={{ marginRight: 8 }}>
            Hủy
          </Button>
          <Button type="primary" htmlType="submit" loading={loading}>
            Đăng ký
          </Button>
        </div>
      </Form>
    </Modal>
  );
};

export default EnrollCourseModal;
