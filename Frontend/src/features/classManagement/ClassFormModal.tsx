import { Checkbox, Form, Input, InputNumber, Modal, Select } from "antd";
import { forwardRef, useEffect, useImperativeHandle, useMemo } from "react";
import type { ClassFormValues, ClassRecord, CourseOption, TeacherOption } from "./class.types";

interface ClassFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: ClassRecord;
  onSubmit: (values: ClassFormValues) => Promise<void>;
  onCancel: () => void;
  courseOptions: CourseOption[];
  teacherOptions: TeacherOption[];
}

export interface ClassFormModalHandle {
  submit: () => void;
}

const ClassFormModal = forwardRef<ClassFormModalHandle, ClassFormModalProps>(function ClassFormModal(
  { open, mode, initialValues, onSubmit, onCancel, courseOptions, teacherOptions },
  ref,
) {
  const [form] = Form.useForm<ClassFormValues>();

  const mergedTeacherOptions = useMemo(() => {
    const options = [...teacherOptions];
    if (initialValues?.teacher) {
      const exists = options.some(opt => opt.id === initialValues.teacher?.id);
      if (!exists) {
        options.push({ id: initialValues.teacher.id, label: initialValues.teacher.fullName });
      }
    }
    return options;
  }, [teacherOptions, initialValues]);

  useEffect(() => {
    if (open) {
      form.setFieldsValue({
        className: initialValues?.className || "",
        classCode: initialValues?.classCode || "",
        courseId: initialValues?.courseId || undefined,
        teacherId: initialValues?.teacherId || undefined,
        joinCode: initialValues?.joinCode || "",
        classRoom: initialValues?.classRoom || "",
        learningMode: initialValues?.learningMode || "Offline",
        startDate: initialValues?.startDate ? new Date(initialValues.startDate).toISOString().split('T')[0] : "",
        endDate: initialValues?.endDate ? new Date(initialValues.endDate).toISOString().split('T')[0] : "",
        schedule: initialValues?.schedule || { days: [], startTime: "", endTime: "" },
        maxStudents: initialValues?.maxStudents || 20,
        description: initialValues?.description || "",
        note: initialValues?.note || "",
        isEnrollmentOpen: initialValues?.isEnrollmentOpen ?? true,
        status: initialValues?.status || "Draft",
      });
    }
  }, [open, initialValues, form]);

  useImperativeHandle(ref, () => ({
    submit: () => form.submit(),
  }));

  const handleFinish = async (values: ClassFormValues) => {
    const trimmedValues = {
      ...values,
      className: values.className.trim(),
      classCode: values.classCode?.trim(),
      joinCode: values.joinCode?.trim(),
      classRoom: values.classRoom?.trim(),
      description: values.description?.trim(),
      note: values.note?.trim(),
      schedule: {
        ...values.schedule,
        days: values.schedule?.days?.map((day) => day.trim()).filter(Boolean) || [],
        startTime: values.schedule?.startTime?.trim() || "",
        endTime: values.schedule?.endTime?.trim() || "",
      },
    };

    await onSubmit(trimmedValues);
  };

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Create Class" : "Edit Class"}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText={mode === "create" ? "Create" : "Save"}
      destroyOnClose
      width={760}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish}>
        <Form.Item
          name="className"
          label="Class Name"
          rules={[{ required: true, message: "Class name is required" }, { whitespace: true, message: "Class name is required" }]}
        >
          <Input placeholder="Enter class name" />
        </Form.Item>
        <Form.Item name="classCode" label="Class Code" rules={[{ required: true, message: "Class code is required" }]}>
          <Input placeholder="Class code" />
        </Form.Item>
        <Form.Item name="courseId" label="Course" rules={[{ required: true, message: "Course is required" }]}>
          <Select options={courseOptions.map((item) => ({ label: item.label, value: item.id }))} />
        </Form.Item>
        <Form.Item name="teacherId" label="Teacher">
          <Select
            allowClear
            options={mergedTeacherOptions.map((item) => ({ label: item.label, value: item.id }))}
            disabled={
              mode === "edit" &&
              ["Completed", "Cancelled", "Archived"]
                .includes(initialValues?.status || "")
            }
          />
        </Form.Item>
        <Form.Item name="learningMode" label="Learning Mode" rules={[{ required: true, message: "Learning mode is required" }]}>
          <Select
            options={[
              { label: "Offline", value: "Offline" },
              { label: "Online", value: "Online" },
              { label: "Hybrid", value: "Hybrid" },
            ]}
          />
        </Form.Item>
        <Form.Item name="classRoom" label="Room">
          <Input placeholder="Optional room or classroom" />
        </Form.Item>
        <Form.Item name="joinCode" label="Join Code">
          <Input placeholder="Optional join code" />
        </Form.Item>
        <Form.Item name="startDate" label="Start Date" rules={[{ required: true, message: "Start date is required" }]}>
          <Input type="date" />
        </Form.Item>
        <Form.Item
          name="endDate"
          label="End Date"
          dependencies={["startDate"]}
          rules={[
            { required: true, message: "End date is required" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                const startDate = getFieldValue("startDate");
                if (!value || !startDate || new Date(value) >= new Date(startDate)) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("End date must be after start date"));
              },
            }),
          ]}
        >
          <Input type="date" />
        </Form.Item>
        <Form.Item label="Schedule">
          <Input.Group compact>
            <Form.Item name={["schedule", "days"]} noStyle>
              <Select mode="tags" style={{ width: '40%' }} placeholder="Days (e.g. Monday)" />
            </Form.Item>
            <Form.Item name={["schedule", "startTime"]} noStyle>
              <Input style={{ width: '30%' }} placeholder="Start (08:00)" />
            </Form.Item>
            <Form.Item name={["schedule", "endTime"]} noStyle>
              <Input style={{ width: '30%' }} placeholder="End (10:00)" />
            </Form.Item>
          </Input.Group>
        </Form.Item>
        <Form.Item name="maxStudents" label="Max Students" rules={[{ required: true, message: "Max students is required" }, { type: "number", min: 1, message: "Must be greater than 0" }]}>
          <InputNumber min={1} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} placeholder="Short class description" />
        </Form.Item>
        <Form.Item name="note" label="Note">
          <Input.TextArea rows={3} placeholder="Additional notes" />
        </Form.Item>
        <Form.Item name="isEnrollmentOpen" valuePropName="checked">
          <Checkbox>Enrollment Open</Checkbox>
        </Form.Item>
        <Form.Item name="status" label="Status" rules={[{ required: true, message: "Status is required" }]}>
          <Select
            options={[
              { label: "Draft", value: "Draft" },
              { label: "Ready", value: "Ready" },
              { label: "Ongoing", value: "Ongoing" },
              { label: "Completed", value: "Completed" },
              { label: "Cancelled", value: "Cancelled" },
              { label: "Archived", value: "Archived" },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
});

export default ClassFormModal;
