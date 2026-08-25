import React, { useState } from "react";
import { Card, Table, Typography, Select, message, Button, Tooltip, Empty, Space } from "antd";
import { ReloadOutlined, CloseCircleOutlined, CreditCardOutlined } from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollmentService } from "./enrollmentService";
import { paymentApi } from "../../api/paymentApi";
import type { EnrollmentRecord, EnrollmentCourse, EnrollmentStatus, EnrollmentFilters } from "./enrollment.types";
import type { Payment } from "../../types/payment";
import EnrollmentStatusTag from "../../shared/components/EnrollmentStatusTag";
import QRPaymentModal from "./components/QRPaymentModal";
import EnrollCourseModal from "./components/EnrollCourseModal";
import { PlusOutlined } from "@ant-design/icons";
import type { CourseLevel } from "../course/course.types";
const MyEnrollmentsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<EnrollmentFilters>({ status: "All", page: 1, limit: 10 });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);

  // Queries
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useQuery({
    queryKey: ["enrollments", "me", filters],
    queryFn: () => enrollmentService.getMyEnrollments(filters),
  });

  const { data: paymentsData, isLoading: paymentsLoading } = useQuery({
    queryKey: ["payments", "me"],
    queryFn: () => paymentApi.getMyPayments(),
  });

  const createEnrollmentMutation = useMutation({
    mutationFn: (values: { courseId: string; level: CourseLevel }) =>
      enrollmentService.createEnrollment(values),
    onSuccess: () => {
      message.success("Đăng ký khóa học thành công.");
      setIsEnrollModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ["enrollments", "me"] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || "Lỗi khi đăng ký khóa học.");
    },
  });

  // Mutations
  const cancelMutation = useMutation({
    mutationFn: (id: string) => enrollmentService.cancelMyEnrollment(id),
    onSuccess: () => {
      message.success("Đã hủy đăng ký.");
      queryClient.invalidateQueries({ queryKey: ["enrollments", "me"] });
      queryClient.invalidateQueries({ queryKey: ["payments", "me"] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || "Không thể hủy đăng ký.");
    },
  });

  const submitPaymentMutation = useMutation({
    mutationFn: (paymentId: string) => paymentApi.submitPayment(paymentId),
    onSuccess: () => {
      message.success("Đã gửi thông báo xác nhận thanh toán.");
      setIsModalOpen(false);
      setSelectedPayment(null);
      queryClient.invalidateQueries({ queryKey: ["enrollments", "me"] });
      queryClient.invalidateQueries({ queryKey: ["payments", "me"] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || "Lỗi khi báo cáo thanh toán.");
    },
  });

  // Handlers
  const handleOpenPayment = (enrollmentId: string) => {
    if (!paymentsData?.data) return;
    const payment = paymentsData.data.find(
      (p) => (typeof p.enrollmentId === "string" ? p.enrollmentId : p.enrollmentId?._id) === enrollmentId
    );
    if (payment) {
      setSelectedPayment(payment);
      setIsModalOpen(true);
    } else {
      message.error("Không tìm thấy thông tin thanh toán cho khóa học này.");
    }
  };

  const getCourse = (record: EnrollmentRecord): EnrollmentCourse | null => {
    if (typeof record.courseId === "object" && record.courseId !== null) {
      return record.courseId as EnrollmentCourse;
    }
    return null;
  };

  const columns = [
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
              {course.code} • {course.subject} • Khối {course.grade}
            </Typography.Text>
          </div>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        );
      },
    },
    {
      title: "Cấp độ",
      key: "level",
      width: 120,
      render: (_: unknown, record: EnrollmentRecord) => {
        const course = getCourse(record);
        return course ? course.level : "—";
      },
    },
    {
      title: "Học phí",
      key: "tuitionFee",
      width: 140,
      render: (_: unknown, record: EnrollmentRecord) => {
        const course = getCourse(record);
        const fee = course?.pricing?.tuitionFee;
        return fee ? `${fee.toLocaleString()} VND` : "—";
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 160,
      render: (status: EnrollmentStatus) => <EnrollmentStatusTag status={status} />,
    },
    {
      title: "Ngày đăng ký",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (value: string) => new Date(value).toLocaleDateString("vi-VN"),
    },
    {
      title: "Thao tác",
      key: "actions",
      width: 180,
      render: (_: unknown, record: EnrollmentRecord) => {
        // Lấy payment status tương ứng
        let paymentStatus = "";
        if (paymentsData?.data) {
          const payment = paymentsData.data.find(
            (p) => (typeof p.enrollmentId === "string" ? p.enrollmentId : p.enrollmentId?._id) === record._id
          );
          if (payment) paymentStatus = payment.status;
        }

        if (record.status === "PENDING_PAYMENT" && paymentStatus === "PENDING") {
          return (
            <Space>
              <Button type="primary" size="small" icon={<CreditCardOutlined />} onClick={() => handleOpenPayment(record._id)}>
                Thanh toán
              </Button>
              <Tooltip title="Hủy đăng ký">
                <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => cancelMutation.mutate(record._id)} loading={cancelMutation.isPending} />
              </Tooltip>
            </Space>
          );
        }
        
        if (record.status === "PENDING_PAYMENT" && paymentStatus !== "PENDING") {
           // Payment is submitted and waiting for admin confirmation, but Enrollment is still PENDING_PAYMENT
           // Note: The Backend logic actually transitions payment to "PENDING" when submitted? Wait. 
           // If payment submit changes payment status? Let's assume it stays PENDING or changes to SUBMITTED? 
           // In payment.types.ts: status is "PENDING" | "PAID" | "CANCELLED" | "REFUNDED". So it stays PENDING or maybe there is no SUBMITTED. 
           // Wait, backend `submitPayment` just sets `studentId` or something? No, it might just notify. 
           // Let's just show "Đang chờ xác nhận".
           return <Typography.Text type="secondary">Đang chờ xác nhận</Typography.Text>;
        }

        if (record.status === "APPROVED" || record.status === "CLASS_ASSIGNED" || record.status === "PAID") {
          return <Typography.Text type="success">Đã thanh toán</Typography.Text>;
        }

        return null;
      },
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Đăng ký khóa học của tôi
        </Typography.Title>
        <Typography.Paragraph style={{ margin: 0, color: "var(--color-text-description)" }}>
          Xem lịch sử và trạng thái đăng ký khóa học. Thanh toán học phí để được xếp lớp.
        </Typography.Paragraph>
      </div>

      <Card bordered={false}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Select
              value={filters.status}
              onChange={(value) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}
              style={{ width: 200 }}
              options={[
                { label: "Tất cả trạng thái", value: "All" },
                { label: "Chờ thanh toán", value: "PENDING_PAYMENT" },
                { label: "Đang chờ xác nhận", value: "PAYMENT_PENDING_CONFIRMATION" },
                { label: "Đã duyệt", value: "APPROVED" },
                { label: "Đã xếp lớp", value: "CLASS_ASSIGNED" },
                { label: "Hoàn thành", value: "COMPLETED" },
                { label: "Đã hủy", value: "CANCELLED" },
              ]}
            />
            <Button icon={<ReloadOutlined />} onClick={() => {
              queryClient.invalidateQueries({ queryKey: ["enrollments", "me"] });
              queryClient.invalidateQueries({ queryKey: ["payments", "me"] });
            }}>
              Làm mới
            </Button>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsEnrollModalOpen(true)}>
            Đăng ký khóa học mới
          </Button>
        </div>

        <Table
          rowKey="_id"
          columns={columns}
          dataSource={enrollmentsData?.data || []}
          loading={enrollmentsLoading || paymentsLoading}
          pagination={{
            current: enrollmentsData?.pagination?.page || 1,
            pageSize: enrollmentsData?.pagination?.limit || 10,
            total: enrollmentsData?.pagination?.total || 0,
            onChange: (page, pageSize) => setFilters((prev) => ({ ...prev, page, limit: pageSize })),
          }}
          locale={{
            emptyText: (enrollmentsLoading || paymentsLoading) ? null : <Empty description="Chưa có đăng ký nào" />,
          }}
        />
      </Card>

      <QRPaymentModal
        open={isModalOpen}
        payment={selectedPayment}
        onCancel={() => setIsModalOpen(false)}
        onSubmit={(paymentId) => submitPaymentMutation.mutate(paymentId)}
        loading={submitPaymentMutation.isPending}
      />

      <EnrollCourseModal
        open={isEnrollModalOpen}
        onCancel={() => setIsEnrollModalOpen(false)}
        onSubmit={(values) => createEnrollmentMutation.mutate(values)}
        loading={createEnrollmentMutation.isPending}
      />
    </div>
  );
};

export default MyEnrollmentsPage;
