import { Form, Input, Modal, Select } from "antd";
import type { FormInstance } from "antd";
import { useEffect, useImperativeHandle, forwardRef } from "react";
import type { AccountFormValues, AccountRecord } from "./account.types";

interface AccountFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  initialValues?: AccountRecord;
  onSubmit: (values: AccountFormValues) => Promise<void>;
  onCancel: () => void;
}

export interface AccountFormModalHandle {
  submit: () => void;
}

const AccountFormModal = forwardRef<AccountFormModalHandle, AccountFormModalProps>(
  function AccountFormModal({ open, mode, initialValues, onSubmit, onCancel }, ref) {
    const [form] = Form.useForm<AccountFormValues>();

    useEffect(() => {
      if (open) {
        form.setFieldsValue({
          fullName: initialValues?.fullName || "",
          email: initialValues?.email || "",
          phone: initialValues?.phone || "",
          role: initialValues?.role || "Student",
          status: initialValues?.status || "Active",
          password: "",
          confirmPassword: "",
          avatar: initialValues?.avatar || "",
        });
      }
    }, [open, initialValues, form]);

    useImperativeHandle(ref, () => ({
      submit: () => form.submit(),
    }));

    const handleFinish = async (values: AccountFormValues) => {
      const trimmedValues = {
        ...values,
        fullName: values.fullName.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim(),
        avatar: values.avatar?.trim() || "",
      };

      await onSubmit(trimmedValues);
    };

    return (
      <Modal
        open={open}
        title={mode === "create" ? "Create Account" : "Edit Account"}
        onCancel={onCancel}
        okText={mode === "create" ? "Create" : "Save"}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleFinish}>
          <Form.Item name="avatar" label="Avatar URL">
            <Input placeholder="Optional avatar URL" />
          </Form.Item>
          <Form.Item
            name="fullName"
            label="Full Name"
            rules={[
              { required: true, message: "Full name is required" },
              { whitespace: true, message: "Full name is required" },
            ]}
          >
            <Input placeholder="Enter full name" />
          </Form.Item>
          <Form.Item
            name="email"
            label="Email"
            rules={[
              { required: true, message: "Email is required" },
              { type: "email", message: "Please enter a valid email" },
              { whitespace: true, message: "Email is required" },
            ]}
          >
            <Input placeholder="Enter email" />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input placeholder="Enter phone number" />
          </Form.Item>
          <Form.Item
            name="role"
            label="Role"
            rules={[{ required: true, message: "Role is required" }]}
          >
            <Select
              options={[
                { label: "Admin", value: "Admin" },
                { label: "Teacher", value: "Teacher" },
                { label: "Student", value: "Student" },
              ]}
            />
          </Form.Item>
          <Form.Item
            name="status"
            label="Status"
            rules={[{ required: true, message: "Status is required" }]}
          >
            <Select
              options={[
                { label: "Active", value: "Active" },
                { label: "Inactive", value: "Inactive" },
                { label: "Locked", value: "Locked" },
              ]}
            />
          </Form.Item>
          {mode === "create" && (
            <>
              <Form.Item
                name="password"
                label="Password"
                rules={[
                  { required: true, message: "Password is required" },
                  { min: 6, message: "Minimum 6 characters" },
                ]}
              >
                <Input.Password placeholder="Enter password" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={["password"]}
                rules={[
                  { required: true, message: "Please confirm your password" },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue("password") === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error("Passwords do not match"));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm password" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    );
  }
);

export default AccountFormModal;
