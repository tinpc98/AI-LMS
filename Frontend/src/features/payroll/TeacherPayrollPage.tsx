import React, { useState } from "react";
import {
  Card,
  Table,
  Typography,
  Button,
  Space,
  message,
} from "antd";
import { useQuery } from "@tanstack/react-query";
import { EyeOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import { payrollApi } from "../../api/payrollApi";
import type { IPayroll, IPayrollPeriod, MyPayrollQueryParams } from "../../types/payroll";
import { PayrollStatusTag } from "./components/PayrollStatusTag";
import { PayrollDetailDrawer } from "./components/PayrollDetailDrawer";

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

const TeacherPayrollPage: React.FC = () => {
  const [pagination, setPagination] = useState<MyPayrollQueryParams>({ page: 1, limit: 10 });
  const [selectedPayroll, setSelectedPayroll] = useState<IPayroll | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["payrolls", "my", pagination],
    queryFn: () => payrollApi.getMyPayrolls(pagination),
  });

  const handleTableChange = (pag: { current?: number; pageSize?: number }) => {
    setPagination({ page: pag.current ?? 1, limit: pag.pageSize ?? 10 });
  };

  const openDrawer = (payroll: IPayroll) => {
    setSelectedPayroll(payroll);
    setDrawerOpen(true);
  };

  const columns = [
    {
      title: "Kỳ lương",
      key: "period",
      render: (_: unknown, record: IPayroll) => {
        const period =
          typeof record.payrollPeriodId === "object"
            ? (record.payrollPeriodId as IPayrollPeriod)
            : null;
        return (
          <Space direction="vertical" size={0}>
            <Typography.Text strong>
              {period?.name ?? String(record.payrollPeriodId)}
            </Typography.Text>
            {period && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {dayjs(period.startDate).format("DD/MM/YYYY")} —{" "}
                {dayjs(period.endDate).format("DD/MM/YYYY")}
              </Typography.Text>
            )}
          </Space>
        );
      },
    },
    {
      title: "Số buổi",
      dataIndex: "sessionCount",
      key: "sessionCount",
      width: 100,
      align: "center" as const,
    },
    {
      title: "Tổng thực nhận",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 160,
      align: "right" as const,
      render: (v: number) => (
        <Typography.Text strong style={{ color: "#16a34a" }}>
          {formatMoney(v)}
        </Typography.Text>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (status: IPayroll["status"]) => <PayrollStatusTag status={status} />,
    },
    {
      title: "Ngày tính",
      dataIndex: "calculatedAt",
      key: "calculatedAt",
      width: 140,
      render: (v?: string | null) =>
        v ? dayjs(v).format("DD/MM/YYYY") : <Typography.Text type="secondary">—</Typography.Text>,
    },
    {
      title: "",
      key: "action",
      width: 80,
      render: (_: unknown, record: IPayroll) => (
        <Button
          type="text"
          icon={<EyeOutlined />}
          onClick={() => openDrawer(record)}
          title="Xem chi tiết"
        />
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Bảng lương của tôi
        </Typography.Title>
        <Typography.Paragraph
          style={{ margin: 0, color: "var(--color-text-description)" }}
        >
          Lịch sử bảng lương được tính toán dựa trên số buổi dạy đã xác nhận
          điểm danh trong từng kỳ lương.
        </Typography.Paragraph>
      </div>

      <Card bordered={false}>
        <Table<IPayroll>
          columns={columns}
          dataSource={data?.items ?? []}
          rowKey="_id"
          loading={isLoading}
          locale={{
            emptyText: isError
              ? "Không thể tải dữ liệu"
              : "Chưa có bảng lương nào",
          }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: data?.pagination?.totalItems ?? 0,
            showSizeChanger: true,
            showTotal: (total) => `Tổng ${total} bảng lương`,
          }}
          onChange={(pag) => handleTableChange(pag)}
        />
      </Card>

      <PayrollDetailDrawer
        open={drawerOpen}
        payroll={selectedPayroll}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
};

export default TeacherPayrollPage;
