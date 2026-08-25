import React, { useEffect, useState } from "react";
import { Table, Tag, Button, message, Space, Typography, Card } from "antd";
import { EyeOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { paymentApi } from "../../api/paymentApi";
import type { Payment } from "../../types/payment";

const { Title } = Typography;

const MyPaymentsPage: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getMyPayments();
      if (res.success) {
        setPayments(res.data);
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || "Lỗi khi lấy danh sách thanh toán");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "orange";
      case "PAID":
        return "green";
      case "CANCELLED":
        return "red";
      case "REFUNDED":
        return "purple";
      default:
        return "default";
    }
  };

  const columns = [
    {
      title: "Mã khóa học",
      dataIndex: ["courseId", "code"],
      key: "courseCode",
    },
    {
      title: "Khóa học",
      dataIndex: ["courseId", "name"],
      key: "courseName",
    },
    {
      title: "Số tiền",
      dataIndex: "amount",
      key: "amount",
      render: (amount: number, record: Payment) =>
        `${amount.toLocaleString("vi-VN")} ${record.currency}`,
    },
    {
      title: "Phương thức",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      render: (status: string) => <Tag color={getStatusColor(status)}>{status}</Tag>,
    },
    {
      title: "Ngày tạo",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString("vi-VN"),
    },
    {
      title: "Hành động",
      key: "action",
      render: (_: any, record: Payment) => (
        <Space>
          <Button
            type="primary"
            icon={<EyeOutlined />}
            onClick={() => navigate(`/payments/${record._id}`)}
          >
            {record.status === "PENDING" ? "Thanh toán" : "Chi tiết"}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card>
      <Title level={4}>Lịch sử thanh toán</Title>
      <Table
        dataSource={payments}
        columns={columns}
        rowKey="_id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />
    </Card>
  );
};

export default MyPaymentsPage;
