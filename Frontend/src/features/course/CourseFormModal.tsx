import { Form, Input, InputNumber, Modal, Select } from "antd";
import { useEffect, useState, forwardRef, useImperativeHandle } from "react";
import type { CourseFormValues, CourseRecord } from "./course.types";
import { subjectService } from "../subject/subjectService";
import type { Subject } from "../subject/subject.types";

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
          name: initialValues?.name || "",
          code: initialValues?.code || "",
          subjectId: typeof initialValues?.subjectId === "object" 
            ? (initialValues.subjectId as any)._id 
            : initialValues?.subjectId || undefined,
          grade: initialValues?.grade || 12,
          level: initialValues?.level || "FOUNDATION",
          description: initialValues?.description || "",
          thumbnail: initialValues?.thumbnail || "",
          pricing: initialValues?.pricing || { tuitionFee: 0 },
          duration: initialValues?.duration || { value: 1, unit: "WEEK" },
          status: initialValues?.status || "DRAFT",
        });
      }
    }, [open, initialValues, form]);

    const [subjects, setSubjects] = useState<Subject[]>([]);
    
    useEffect(() => {
      if (open) {
        subjectService.getSubjects({ status: "ACTIVE", limit: 100 })
          .then(res => setSubjects(res.data || []))
          .catch(() => {});
      }
    }, [open]);

    useImperativeHandle(ref, () => ({
      submit: () => form.submit(),
    }));

    const handleFinish = async (values: CourseFormValues) => {
      const trimmedValues = {
        ...values,
        name: values.name.trim(),
        code: values.code.trim().toUpperCase(),
        description: values.description.trim(),
        thumbnail: values.thumbnail.trim(),
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
            name="name"
            label="Course Name"
            rules={[
              { required: true, message: "Course name is required" },
              { whitespace: true, message: "Course name is required" },
            ]}
          >
            <Input placeholder="Enter course name" />
          </Form.Item>
          <Form.Item
            name="code"
            label="Course Code"
            rules={[
              { required: true, message: "Course code is required" },
              { whitespace: true, message: "Course code is required" },
            ]}
          >
            <Input placeholder="e.g. MATH12-FND" style={{ textTransform: "uppercase" }} />
          </Form.Item>
          <Form.Item
            name="subjectId"
            label="Subject"
            rules={[{ required: true, message: "Subject is required" }]}
          >
            <Select
              placeholder="Select a subject"
              options={subjects.map((s) => ({ label: s.name, value: s._id }))}
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
            name="level"
            label="Level"
            rules={[{ required: true, message: "Level is required" }]}
          >
            <Select
              options={[
                { label: "Nền tảng", value: "FOUNDATION" },
                { label: "Trung cấp", value: "INTERMEDIATE" },
                { label: "Nâng cao", value: "ADVANCED" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name={["pricing", "tuitionFee"]}
            label="Tuition Fee"
            rules={[
              { required: true, message: "Tuition fee is required" },
              { type: "number", min: 0, message: "Must be a positive number" },
            ]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
          
          <div style={{ display: "flex", gap: "16px" }}>
            <Form.Item
              name={["duration", "value"]}
              label="Duration Value"
              style={{ flex: 1 }}
              rules={[
                { required: true, message: "Duration value is required" },
                { type: "number", min: 1, message: "Must be at least 1" },
              ]}
            >
              <InputNumber min={1} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item
              name={["duration", "unit"]}
              label="Duration Unit"
              style={{ flex: 1 }}
              rules={[{ required: true, message: "Duration unit is required" }]}
            >
              <Select
                options={[
                  { label: "Day", value: "DAY" },
                  { label: "Week", value: "WEEK" },
                  { label: "Month", value: "MONTH" },
                ]}
              />
            </Form.Item>
          </div>

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
                { label: "Draft", value: "DRAFT" },
                { label: "Published", value: "PUBLISHED" },
                { label: "Archived", value: "ARCHIVED" },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    );
  }
);

export default CourseFormModal;
