import { Form, Input, InputNumber, Modal, Select } from "antd";
import { useEffect, forwardRef, useImperativeHandle } from "react";
import type { CourseFormValues, CourseRecord, CourseStatus, CourseSubject } from "./course.types";

interface CourseFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: CourseRecord;
  onSubmit: (values: CourseFormValues) => Promise<void>;
  onCancel: () => void;
}

export interface CourseFormModalHandle {
  submit: () => void;
}

const CourseFormModal = forwardRef<CourseFormModalHandle, CourseFormModalProps>(
  function CourseFormModal({ open, mode, initialValues, onSubmit, onCancel }, ref) {
    const [form] = Form.useForm<CourseFormValues>();

    useEffect(() => {
      if (open) {
        form.setFieldsValue({
          courseName: initialValues?.courseName || "",
          subject: initialValues?.subject || "Mathematics",
          grade: initialValues?.grade || 12,
          description: initialValues?.description || "",
          thumbnail: initialValues?.thumbnail || "",
          tuitionFee: initialValues?.tuitionFee || 0,
          durationWeeks: initialValues?.durationWeeks || 0,
          totalLessons: initialValues?.totalLessons || 0,
          target: initialValues?.target || "",
          status: initialValues?.status || "Draft",
        });
      }
    }, [open, initialValues, form]);

    useImperativeHandle(ref, () => ({
      submit: () => form.submit(),
    }));

    const handleFinish = async (values: CourseFormValues) => {
      const trimmedValues = {
        ...values,
        courseName: values.courseName.trim(),
        description: values.description.trim(),
        thumbnail: values.thumbnail.trim(),
        target: values.target.trim(),
      };

      await onSubmit(trimmedValues);
    };

    return (
      <Modal
        open={open}
        title={mode === "create" ? "Create Course" : "Edit Course"}
        onCancel={onCancel}
        onOk={() => form.submit()}
        okText={mode === "create" ? "Create" : "Save"}
        destroyOnClose
        width={760}
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="thumbnail" label="Thumbnail URL">
            <Input placeholder="Optional thumbnail URL" />
          </Form.Item>
          <Form.Item
            name="courseName"
            label="Course Name"
            rules={[
              { required: true, message: "Course name is required" },
              { whitespace: true, message: "Course name is required" },
            ]}
          >
            <Input placeholder="Enter course name" />
          </Form.Item>
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: "Subject is required" }]}
          >
            <Select
              options={[
                { label: "Mathematics", value: "Mathematics" },
                { label: "Physics", value: "Physics" },
                { label: "Chemistry", value: "Chemistry" },
                { label: "English", value: "English" },
                { label: "Literature", value: "Literature" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="grade"
            label="Grade"
            rules={[{ required: true, message: "Grade is required" }]}
          >
            <InputNumber min={1} max={12} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="tuitionFee"
            label="Tuition Fee"
            rules={[
              { required: true, message: "Tuition fee is required" },
              { type: "number", min: 0, message: "Must be a positive number" },
            ]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="durationWeeks"
            label="Duration (Weeks)"
            rules={[
              { required: true, message: "Duration is required" },
              { type: "number", min: 1, message: "Duration must be at least 1 week" },
            ]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item
            name="totalLessons"
            label="Total Lessons"
            rules={[
              { required: true, message: "Total lessons is required" },
              { type: "number", min: 1, message: "Must be at least 1" },
            ]}
          >
            <InputNumber min={1} style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="target" label="Target">
            <Input placeholder="Who is this course for?" />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <Input.TextArea rows={4} placeholder="Short course description" />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Status is required" }]}
          >
            <Select
              options={[
                { label: "Draft", value: "Draft" },
                { label: "Published", value: "Published" },
                { label: "Closed", value: "Closed" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    );
  }
);

export default CourseFormModal;
