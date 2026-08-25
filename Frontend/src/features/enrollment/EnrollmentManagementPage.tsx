import React, { useState } from "react";
import {
  Card,
  Table,
  Typography,
  Select,
  message,
  Button,
  Tooltip,
  Empty,
  Space,
  Row,
  Col,
} from "antd";
import {
  ReloadOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  TeamOutlined,
  TrophyOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollmentService } from "./enrollmentService";
import type {
  EnrollmentRecord,
  EnrollmentCourse,
  EnrollmentStudent,
  EnrollmentStatus,
  EnrollmentFilters,
} from "./enrollment.types";
import EnrollmentStatusTag from "../../shared/components/EnrollmentStatusTag";
import AssignClassModal from "./components/AssignClassModal";

const EnrollmentManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<EnrollmentFilters>({
    status: "All",
    page: 1,
    limit: 10,
  });
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedEnrollment, setSelectedEnrollment] = useState<EnrollmentRecord | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["enrollments", "admin", filters],
    queryFn: () => enrollmentService.getAllEnrollments(filters),
  });

  const transitionMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "complete" | "cancel" }) =>
      enrollmentService.transitionStatus(id, action),
    onSuccess: (data, variables) => {
      let actionLabel = "thực hiện";
      if (variables.action === "approve") actionLabel = "duyệt";
      if (variables.action === "complete") actionLabel = "hoàn thành";
      if (variables.action === "cancel") actionLabel = "hủy";
      
      message.success(`Đã ${actionLabel} thành công.`);
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || `Không thể thực hiện.`);
    },
  });

  const assignClassMutation = useMutation({
    mutationFn: ({ id, classId }: { id: string; classId: string }) =>
      enrollmentService.assignClass(id, classId),
    onSuccess: () => {
      message.success(`Đã xếp lớp thành công.`);
      setAssignModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || `Không thể xếp lớp.`);
    },
  });

  const handleAction = (id: string, action: "approve" | "complete" | "cancel") => {
    transitionMutation.mutate({ id, action });
  };

  const openAssignClass = (record: EnrollmentRecord) => {
    setSelectedEnrollment(record);
    setAssignModalOpen(true);
  };

  const getStudent = (record: EnrollmentRecord): EnrollmentStudent | null => {
    if (typeof record.studentId === "object" && record.studentId !== null) {
      return record.studentId as EnrollmentStudent;
    }
    return null;
  };

  const getCourse = (record: EnrollmentRecord): EnrollmentCourse | null => {
    if (typeof record.courseId === "object" && record.courseId !== null) {
      return record.courseId as EnrollmentCourse;
    }
    return null;
  };

  const columns = [
    {
      title: "Học sinh",
      key: "student",
      render: (_: unknown, record: EnrollmentRecord) => {
        const student = getStudent(record);
        return student ? (
          <div>
            <Typography.Text strong>{student.fullName}</Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {student.email}
            </Typography.Text>
          </div>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        );
      },
    },
    {
      title: "Khóa học",
      key: "course",
      render: (_: unknown, record: EnrollmentRecord) => {
        const course = getCourse(record);
        return course ? (
          <div>
            <Typography.Text strong>{course.name}</Typography.Text>
            <br />
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {course.code} • {course.subject}
            </Typography.Text>
          </div>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        );
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (status: EnrollmentStatus) => <EnrollmentStatusTag status={status} />,
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 140,
      render: (value: string) => new Date(value).toLocaleDateString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "actions",
      width: 180,
      render: (_: unknown, record: EnrollmentRecord) => {
        const s = record.status;
        return (
          <Space size={4}>
            {s === "PAID" && (
              <Tooltip title="Duyệt">
                <Button
                  size="small"
                  type="primary"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleAction(record._id, "approve")}
                  loading={transitionMutation.isPending && transitionMutation.variables?.action === "approve"}
                />
              </Tooltip>
            )}
            {s === "APPROVED" && (
              <Tooltip title="Xếp lớp">
                <Button
                  size="small"
                  type="primary"
                  icon={<TeamOutlined />}
                  onClick={() => openAssignClass(record)}
                />
              </Tooltip>
            )}
            {s === "CLASS_ASSIGNED" && (
              <Tooltip title="Hoàn thành">
                <Button
                  size="small"
                  icon={<TrophyOutlined />}
                  onClick={() => handleAction(record._id, "complete")}
                  loading={transitionMutation.isPending && transitionMutation.variables?.action === "complete"}
                />
              </Tooltip>
            )}
            {["PENDING_PAYMENT", "PAID", "APPROVED", "PAYMENT_PENDING_CONFIRMATION"].includes(s) && (
              <Tooltip title="Hủy">
                <Button
                  size="small"
                  danger
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleAction(record._id, "cancel")}
                  loading={transitionMutation.isPending && transitionMutation.variables?.action === "cancel"}
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
      <div style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Typography.Title level={3} style={{ marginBottom: 4 }}>
              Quản lý đăng ký khóa học
            </Typography.Title>
            <Typography.Paragraph style={{ margin: 0, color: "var(--color-text-description)" }}>
              Xem, duyệt và xếp lớp cho học sinh.
            </Typography.Paragraph>
          </Col>
        </Row>
      </div>

      <Card bordered={false}>
        <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
          <Select
            value={filters.status}
            onChange={(value) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
            style={{ width: 200 }}
            options={[
              { label: "Tất cả trạng thái", value: "All" },
              { label: "Chờ thanh toán", value: "PENDING_PAYMENT" },
              { label: "Đang chờ xác nhận", value: "PAYMENT_PENDING_CONFIRMATION" },
              { label: "Đã thanh toán", value: "PAID" },
              { label: "Đã duyệt", value: "APPROVED" },
              { label: "Đã xếp lớp", value: "CLASS_ASSIGNED" },
              { label: "Hoàn thành", value: "COMPLETED" },
              { label: "Đã hủy", value: "CANCELLED" },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => queryClient.invalidateQueries({ queryKey: ["enrollments"] })}>
            Làm mới
          </Button>
        </div>

        <Table
          rowKey="_id"
          columns={columns}
          dataSource={data?.data || []}
          loading={isLoading}
          pagination={{
            current: data?.pagination?.page || filters.page,
            pageSize: data?.pagination?.limit || filters.limit,
            total: data?.pagination?.total || 0,
            onChange: (page, limit) => setFilters((prev) => ({ ...prev, page, limit })),
          }}
          locale={{
            emptyText: isLoading ? null : <Empty description="Chưa có đăng ký nào" />,
          }}
        />
      </Card>

      <AssignClassModal
        open={assignModalOpen}
        enrollment={selectedEnrollment}
        onCancel={() => setAssignModalOpen(false)}
        onSubmit={(classId) => {
          if (selectedEnrollment) {
            assignClassMutation.mutate({ id: selectedEnrollment._id, classId });
          }
        }}
        loading={assignClassMutation.isPending}
      />
    </div>
  );
};

export default EnrollmentManagementPage;
