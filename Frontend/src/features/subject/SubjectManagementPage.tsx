import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  Table,
  Tag,
  Typography,
  Select,
  message,
  Button,
  Tooltip,
  Space,
  Input,
  Modal,
  Form,
} from "antd";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { subjectService } from "./subjectService";
import type { Subject, SubjectFilters, SubjectStatus } from "./subject.types";

const STATUS_COLOR: Record<SubjectStatus, string> = {
  DRAFT: "orange",
  ACTIVE: "green",
  ARCHIVED: "red",
};

const SubjectManagementPage = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<SubjectFilters>({
    status: "All",
    search: "",
    page: 1,
    limit: 10,
  });
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 10 });
  
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [form] = Form.useForm();

  const loadSubjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await subjectService.getSubjects(filters);
      setSubjects(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } catch {
      message.error("Không thể tải danh sách môn học.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  const handleAction = async (id: string, action: "activate" | "archive", label: string) => {
    try {
      if (action === "activate") {
        await subjectService.activateSubject(id);
      } else {
        await subjectService.archiveSubject(id);
      }
      message.success(`Đã ${label} môn học thành công.`);
      void loadSubjects();
    } catch (err: any) {
      message.error(err.response?.data?.message || `Không thể ${label} môn học.`);
    }
  };

  const handleOpenModal = (subject?: Subject) => {
    if (subject) {
      setEditingSubject(subject);
      form.setFieldsValue(subject);
    } else {
      setEditingSubject(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleSave = async (values: Partial<Subject>) => {
    try {
      if (editingSubject) {
        await subjectService.updateSubject(editingSubject._id, values);
        message.success("Cập nhật môn học thành công");
      } else {
        await subjectService.createSubject(values);
        message.success("Tạo môn học thành công");
      }
      setIsModalVisible(false);
      void loadSubjects();
    } catch (err: any) {
      message.error(err.response?.data?.message || "Có lỗi xảy ra");
    }
  };

  const columns = [
    {
      title: "Mã",
      dataIndex: "code",
      key: "code",
      render: (text: string) => <Typography.Text strong>{text}</Typography.Text>,
    },
    {
      title: "Tên môn học",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
    },
    {
      title: "Số khóa học",
      dataIndex: "courseCount",
      key: "courseCount",
      render: (count: number) => count || 0,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: SubjectStatus) => (
        <Tag color={STATUS_COLOR[status]}>{status}</Tag>
      ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_: unknown, record: Subject) => {
        const s = record.status;
        return (
          <Space size={4}>
            <Tooltip title="Chỉnh sửa">
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() => handleOpenModal(record)}
              />
            </Tooltip>
            {s === "DRAFT" && (
              <Tooltip title="Kích hoạt">
                <Button
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleAction(record._id, "activate", "kích hoạt")}
                />
              </Tooltip>
            )}
            {s === "ACTIVE" && (
              <Tooltip title="Lưu trữ (Archive)">
                <Button
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleAction(record._id, "archive", "lưu trữ")}
                />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: "flex", justifyContent: "space-between" }}>
        <div>
          <Typography.Title level={3} style={{ marginBottom: 4 }}>
            Quản lý môn học
          </Typography.Title>
          <Typography.Paragraph style={{ margin: 0, color: "var(--color-text-description)" }}>
            Tạo, xem và quản lý danh sách môn học của hệ thống.
          </Typography.Paragraph>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenModal()}>
          Tạo môn học
        </Button>
      </div>

      <Card bordered={false}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
          <Input.Search
            placeholder="Tìm theo mã hoặc tên..."
            allowClear
            onSearch={(val) => setFilters((prev) => ({ ...prev, search: val, page: 1 }))}
            style={{ width: 300 }}
          />
          <Select
            value={filters.status}
            onChange={(value) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
            style={{ width: 150 }}
            options={[
              { label: "Tất cả trạng thái", value: "All" },
              { label: "DRAFT", value: "DRAFT" },
              { label: "ACTIVE", value: "ACTIVE" },
              { label: "ARCHIVED", value: "ARCHIVED" },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void loadSubjects()}>
            Làm mới
          </Button>
        </div>

        <Table
          rowKey="_id"
          columns={columns}
          dataSource={subjects}
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            onChange: (page, pageSize) =>
              setFilters((prev) => ({ ...prev, page, limit: pageSize })),
          }}
        />
      </Card>

      <Modal
        title={editingSubject ? "Cập nhật môn học" : "Tạo môn học mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="code"
            label="Mã môn học"
            rules={[
              { required: true, message: "Vui lòng nhập mã" },
              { pattern: /^[A-Z][A-Z0-9_]*$/, message: "Mã không hợp lệ (Viết hoa, không dấu, vd: TOAN)" },
            ]}
          >
            <Input placeholder="TOAN, LY, HOA..." />
          </Form.Item>
          <Form.Item
            name="name"
            label="Tên môn học"
            rules={[{ required: true, message: "Vui lòng nhập tên môn" }]}
          >
            <Input placeholder="Toán, Vật lý..." />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SubjectManagementPage;
