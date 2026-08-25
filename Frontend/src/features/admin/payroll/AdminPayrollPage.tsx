import React, { useState } from "react";
import {
  Card,
  Tabs,
  Table,
  Button,
  Space,
  Typography,
  Popconfirm,
  message,
  Select,
  Tag,
} from "antd";
import {
  PlusOutlined,
  CalculatorOutlined,
  CheckOutlined,
  DollarOutlined,
} from "@ant-design/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { payrollApi } from "../../../api/payrollApi";
import type {
  IPayroll,
  IPayrollPeriod,
  IPayrollConfig,
  PayrollStatus,
  IPayrollTeacherRef,
} from "../../../types/payroll";
import { PayrollStatusTag, PayrollPeriodStatusTag } from "../../payroll/components/PayrollStatusTag";
import { PayrollDetailDrawer } from "../../payroll/components/PayrollDetailDrawer";
import PayrollPeriodModal from "./PayrollPeriodModal";
import PayrollConfigModal from "./PayrollConfigModal";

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

// ——————————————————————————————————————————————————————————————————
// TAB 1 — Payroll Periods
// ——————————————————————————————————————————————————————————————————
const PeriodsTab: React.FC<{ onCalculate: (periodId: string) => void; calculating: string | null }> = ({
  onCalculate,
  calculating,
}) => {
  const [createOpen, setCreateOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["payrollPeriods"],
    queryFn: () => payrollApi.getPayrollPeriods(),
  });

  const periods = data?.data ?? [];

  const columns = [
    {
      title: "Tên kỳ lương",
      dataIndex: "name",
      key: "name",
      render: (name: string, record: IPayrollPeriod) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{name}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            ID: {record._id.substring(0, 8)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: "Từ ngày",
      dataIndex: "startDate",
      key: "startDate",
      width: 130,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Đến ngày",
      dataIndex: "endDate",
      key: "endDate",
      width: 130,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 130,
      render: (status: IPayrollPeriod["status"]) => (
        <PayrollPeriodStatusTag status={status} />
      ),
    },
    {
      title: "Thao tác",
      key: "action",
      width: 160,
      render: (_: unknown, record: IPayrollPeriod) => (
        <Popconfirm
          title={`Tính lương kỳ "${record.name}"?`}
          description="Thao tác này sẽ tính/cập nhật lại bảng lương cho tất cả giáo viên trong kỳ này."
          onConfirm={() => onCalculate(record._id)}
          okText="Tính lương"
          cancelText="Hủy"
          disabled={["PAID", "LOCKED"].includes(record.status)}
        >
          <Button
            icon={<CalculatorOutlined />}
            size="small"
            loading={calculating === record._id}
            disabled={["PAID", "LOCKED"].includes(record.status)}
          >
            Tính lương
          </Button>
        </Popconfirm>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
        >
          Tạo kỳ lương
        </Button>
      </div>
      <Table<IPayrollPeriod>
        columns={columns}
        dataSource={periods}
        rowKey="_id"
        loading={isLoading}
        pagination={false}
        locale={{ emptyText: "Chưa có kỳ lương nào" }}
      />
      <PayrollPeriodModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
};

// ——————————————————————————————————————————————————————————————————
// TAB 2 — Payrolls
// ——————————————————————————————————————————————————————————————————
const PayrollsTab: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedPeriodId, setSelectedPeriodId] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<PayrollStatus | undefined>();
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [detailPayroll, setDetailPayroll] = useState<IPayroll | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: periodsData } = useQuery({
    queryKey: ["payrollPeriods"],
    queryFn: () => payrollApi.getPayrollPeriods(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ["payrolls", "all", selectedPeriodId, selectedStatus, pagination],
    queryFn: () =>
      payrollApi.getAllPayrolls({
        payrollPeriodId: selectedPeriodId,
        status: selectedStatus,
        page: pagination.page,
        limit: pagination.limit,
      }),
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => payrollApi.confirmPayroll(id),
    onSuccess: () => {
      message.success("Xác nhận lương thành công!");
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Xác nhận lương thất bại";
      message.error(msg);
    },
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => payrollApi.payPayroll(id),
    onSuccess: () => {
      message.success("Đánh dấu thanh toán thành công!");
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Đánh dấu thanh toán thất bại";
      message.error(msg);
    },
  });

  const columns = [
    {
      title: "Giáo viên",
      dataIndex: "teacherId",
      key: "teacher",
      render: (teacherId: IPayroll["teacherId"]) => {
        if (typeof teacherId === "object" && teacherId !== null) {
          const t = teacherId as IPayrollTeacherRef;
          return (
            <Space direction="vertical" size={0}>
              <Typography.Text strong>{t.fullName ?? "—"}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t.email}
              </Typography.Text>
            </Space>
          );
        }
        return <Typography.Text type="secondary">{String(teacherId)}</Typography.Text>;
      },
    },
    {
      title: "Kỳ lương",
      dataIndex: "payrollPeriodId",
      key: "period",
      render: (periodId: IPayroll["payrollPeriodId"]) => {
        if (typeof periodId === "object" && periodId !== null) {
          const p = periodId as IPayrollPeriod;
          return <Typography.Text>{p.name}</Typography.Text>;
        }
        return <Typography.Text type="secondary">{String(periodId)}</Typography.Text>;
      },
    },
    {
      title: "Số buổi",
      dataIndex: "sessionCount",
      key: "sessionCount",
      width: 90,
      align: "center" as const,
    },
    {
      title: "Tổng lương",
      dataIndex: "totalAmount",
      key: "totalAmount",
      width: 150,
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
      render: (status: PayrollStatus) => <PayrollStatusTag status={status} />,
    },
    {
      title: "Thao tác",
      key: "action",
      width: 200,
      render: (_: unknown, record: IPayroll) => (
        <Space>
          <Button
            size="small"
            type="text"
            onClick={() => { setDetailPayroll(record); setDrawerOpen(true); }}
          >
            Chi tiết
          </Button>
          {record.status === "CALCULATED" && (
            <Popconfirm
              title="Xác nhận bảng lương này?"
              onConfirm={() => confirmMutation.mutate(record._id)}
              okText="Xác nhận"
              cancelText="Hủy"
            >
              <Button
                size="small"
                icon={<CheckOutlined />}
                loading={confirmMutation.isPending}
              >
                Xác nhận
              </Button>
            </Popconfirm>
          )}
          {record.status === "CONFIRMED" && (
            <Popconfirm
              title="Đánh dấu đã thanh toán?"
              onConfirm={() => payMutation.mutate(record._id)}
              okText="Thanh toán"
              cancelText="Hủy"
            >
              <Button
                size="small"
                type="primary"
                icon={<DollarOutlined />}
                loading={payMutation.isPending}
              >
                Thanh toán
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Space style={{ marginBottom: 16 }} wrap>
        <Select
          placeholder="Lọc theo kỳ lương"
          allowClear
          style={{ minWidth: 200 }}
          onChange={(v) => { setSelectedPeriodId(v); setPagination({ page: 1, limit: 10 }); }}
          options={(periodsData?.data ?? []).map((p) => ({
            value: p._id,
            label: `${p.name} (${dayjs(p.startDate).format("DD/MM")} — ${dayjs(p.endDate).format("DD/MM/YYYY")})`,
          }))}
        />
        <Select
          placeholder="Lọc theo trạng thái"
          allowClear
          style={{ minWidth: 160 }}
          onChange={(v) => { setSelectedStatus(v as PayrollStatus | undefined); setPagination({ page: 1, limit: 10 }); }}
          options={[
            { value: "DRAFT", label: "Nháp" },
            { value: "CALCULATED", label: "Đã tính" },
            { value: "CONFIRMED", label: "Đã xác nhận" },
            { value: "PAID", label: "Đã thanh toán" },
            { value: "LOCKED", label: "Đã khóa" },
          ]}
        />
      </Space>
      <Table<IPayroll>
        columns={columns}
        dataSource={data?.items ?? []}
        rowKey="_id"
        loading={isLoading}
        locale={{ emptyText: "Chưa có bảng lương nào" }}
        pagination={{
          current: pagination.page,
          pageSize: pagination.limit,
          total: data?.pagination?.totalItems ?? 0,
          showSizeChanger: true,
          showTotal: (total) => `Tổng ${total}`,
        }}
        onChange={(pag) =>
          setPagination({ page: pag.current ?? 1, limit: pag.pageSize ?? 10 })
        }
      />
      <PayrollDetailDrawer
        open={drawerOpen}
        payroll={detailPayroll}
        onClose={() => setDrawerOpen(false)}
      />
    </>
  );
};

// ——————————————————————————————————————————————————————————————————
// TAB 3 — Payroll Configs
// ——————————————————————————————————————————————————————————————————
const ConfigsTab: React.FC = () => {
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["payrollConfigs"],
    queryFn: () => payrollApi.getPayrollConfigs(),
  });

  const configs = data?.data ?? [];

  const columns = [
    {
      title: "Giáo viên",
      dataIndex: "teacherId",
      key: "teacher",
      render: (teacherId: IPayrollConfig["teacherId"]) => {
        if (typeof teacherId === "object" && teacherId !== null) {
          const t = teacherId as IPayrollTeacherRef;
          return (
            <Space direction="vertical" size={0}>
              <Typography.Text strong>{t.fullName ?? "—"}</Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t.email}
              </Typography.Text>
            </Space>
          );
        }
        return <Typography.Text type="secondary">{String(teacherId)}</Typography.Text>;
      },
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 150,
      render: (type: IPayrollConfig["type"]) => (
        <Tag color={type === "PER_SESSION" ? "blue" : "purple"}>
          {type === "PER_SESSION" ? "Theo buổi" : "Theo khóa"}
        </Tag>
      ),
    },
    {
      title: "Mức lương",
      dataIndex: "amount",
      key: "amount",
      width: 150,
      align: "right" as const,
      render: (v: number) => formatMoney(v),
    },
    {
      title: "Từ ngày",
      dataIndex: "effectiveFrom",
      key: "effectiveFrom",
      width: 120,
      render: (v: string) => dayjs(v).format("DD/MM/YYYY"),
    },
    {
      title: "Đến ngày",
      dataIndex: "effectiveTo",
      key: "effectiveTo",
      width: 120,
      render: (v?: string | null) =>
        v ? dayjs(v).format("DD/MM/YYYY") : <Tag>Vô thời hạn</Tag>,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 140,
      render: (s: IPayrollConfig["status"]) => (
        <Tag color={s === "ACTIVE" ? "green" : "default"}>
          {s === "ACTIVE" ? "Đang hiệu lực" : "Ngưng"}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setCreateOpen(true)}
        >
          Tạo cấu hình
        </Button>
      </div>
      <Table<IPayrollConfig>
        columns={columns}
        dataSource={configs}
        rowKey="_id"
        loading={isLoading}
        pagination={{ pageSize: 10, showSizeChanger: true }}
        locale={{ emptyText: "Chưa có cấu hình lương nào" }}
      />
      <PayrollConfigModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
};

// ——————————————————————————————————————————————————————————————————
// MAIN PAGE
// ——————————————————————————————————————————————————————————————————
const AdminPayrollPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [calculating, setCalculating] = useState<string | null>(null);

  const calculateMutation = useMutation({
    mutationFn: (periodId: string) => payrollApi.calculatePayroll(periodId),
    onSuccess: (data, periodId) => {
      message.success(data.message ?? "Tính lương thành công!");
      // Must refetch payroll list after calculate — API returns no data
      queryClient.invalidateQueries({ queryKey: ["payrolls"] });
      queryClient.invalidateQueries({ queryKey: ["payrollPeriods"] });
      setCalculating(null);
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Tính lương thất bại";
      message.error(msg);
      setCalculating(null);
    },
  });

  const handleCalculate = (periodId: string) => {
    setCalculating(periodId);
    calculateMutation.mutate(periodId);
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Quản lý bảng lương
        </Typography.Title>
        <Typography.Paragraph
          style={{ margin: 0, color: "var(--color-text-description)" }}
        >
          Quản lý kỳ lương, tính toán và thanh toán lương cho giáo viên dựa trên
          điểm danh đã xác nhận.
        </Typography.Paragraph>
      </div>

      <Card bordered={false}>
        <Tabs
          defaultActiveKey="periods"
          items={[
            {
              key: "periods",
              label: "Kỳ lương",
              children: (
                <PeriodsTab onCalculate={handleCalculate} calculating={calculating} />
              ),
            },
            {
              key: "payrolls",
              label: "Bảng lương",
              children: <PayrollsTab />,
            },
            {
              key: "configs",
              label: "Cấu hình lương",
              children: <ConfigsTab />,
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default AdminPayrollPage;
