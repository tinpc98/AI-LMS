import React, { useState } from "react";
import { Table, Button, message, Space, Typography, Card, Popconfirm, Row, Col, Empty } from "antd";
import { CheckCircleOutlined, SettingOutlined, EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { paymentApi } from "../../api/paymentApi";
import type { Payment } from "../../types/payment";
import PaymentConfigModal from "./PaymentConfigModal";
import PaymentStatusTag from "../../shared/components/PaymentStatusTag";

const { Title, Paragraph } = Typography;

const PaymentManagementPage: React.FC = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  const { data, isLoading } = useQuery({
    queryKey: ["payments", "admin", "pending", pagination],
    queryFn: () => paymentApi.getPayments({ page: pagination.page, limit: pagination.limit }),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => paymentApi.verifyPayment(id),
    onSuccess: () => {
      message.success("Xác nhận thanh toán thành công");
      queryClient.invalidateQueries({ queryKey: ["payments", "admin", "pending"] });
      // Invalidate enrollments as well because confirming payment updates enrollment to APPROVED
      queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || "Xác nhận thất bại");
    },
  });

  const columns = [
    {
      title: "Học viên",
      dataIndex: "studentId",
      key: "student",
      render: (student: any) => (
        <div>
          <div><Typography.Text strong>{student?.fullName}</Typography.Text></div>
          <div style={{ fontSize: "12px", color: "var(--color-text-description)" }}>{student?.email}</div>
        </div>
      ),
    },
    {
      title: "Khóa học",
      dataIndex: "courseId",
      key: "course",
      render: (course: any) => `${course?.code} - ${course?.name}`,
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number, record: Payment) =>
        <Typography.Text strong>{amount?.toLocaleString("vi-VN")} {record.currency}</Typography.Text>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <PaymentStatusTag status={status} />,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleDateString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: Payment) => (
        <Space>
          <Button
            size="small"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/admin/payments/${record._id}`)}
          >
            Chi tiết
          </Button>

          {record.status === "PENDING" && (
            <Popconfirm
              title="Xác nhận đã nhận tiền?"
              description="Sau khi xác nhận, hóa đơn sẽ sang PAID và khóa học được APPROVED."
              onConfirm={() => confirmMutation.mutate(record._id)}
              okButtonProps={{ loading: confirmMutation.isPending }}
            >
              <Button size="small" type="primary" icon={<CheckCircleOutlined />}>
                Xác nhận
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={3} style={{ marginBottom: 4 }}>
              Quản lý thanh toán
            </Title>
            <Paragraph style={{ margin: 0, color: "var(--color-text-description)" }}>
              Duyệt các giao dịch thanh toán đang chờ xử lý từ học viên.
            </Paragraph>
          </Col>
          <Col>
            <Button
              type="primary"
              ghost
              icon={<SettingOutlined />}
              onClick={() => setConfigModalOpen(true)}
            >
              Cấu hình Ngân hàng
            </Button>
          </Col>
        </Row>
      </div>
      <Card bordered={false}>
        <Table
          dataSource={data?.data || []}
          columns={columns}
          rowKey="_id"
          loading={isLoading}
          pagination={{
            current: data?.pagination?.page || pagination.page,
            pageSize: data?.pagination?.limit || pagination.limit,
            total: data?.pagination?.total || 0,
            onChange: (page, limit) => setPagination({ page, limit }),
          }}
          locale={{
            emptyText: isLoading ? null : <Empty description="Không có thanh toán nào đang chờ duyệt" />,
          }}
        />

        <PaymentConfigModal
          open={configModalOpen}
          onClose={() => {
            setConfigModalOpen(false);
          }}
        />
      </Card>
    </div>
  );
};

export default PaymentManagementPage;
