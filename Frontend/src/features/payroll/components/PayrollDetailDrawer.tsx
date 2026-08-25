import React from "react";
import { Drawer, Typography, Descriptions, Table, Tag, Divider } from "antd";
import type { IPayroll, IPayrollItem, IPayrollPeriod } from "../../../types/payroll";
import { PayrollStatusTag } from "./PayrollStatusTag";
import dayjs from "dayjs";

interface Props {
  open: boolean;
  payroll: IPayroll | null;
  onClose: () => void;
}

const itemColumns = [
  {
    title: "Mô tả",
    dataIndex: "description",
    key: "description",
    ellipsis: true,
  },
  {
    title: "Loại",
    dataIndex: "calculationType",
    key: "calculationType",
    width: 130,
    render: (type: string) => (
      <Tag color={type === "PER_SESSION" ? "blue" : "purple"}>
        {type === "PER_SESSION" ? "Theo buổi" : "Theo khóa"}
      </Tag>
    ),
  },
  {
    title: "Số lượng",
    dataIndex: "quantity",
    key: "quantity",
    width: 80,
    align: "center" as const,
  },
  {
    title: "Đơn giá",
    dataIndex: "unitAmount",
    key: "unitAmount",
    width: 120,
    align: "right" as const,
    render: (v: number) =>
      new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v),
  },
  {
    title: "Thành tiền",
    dataIndex: "totalAmount",
    key: "totalAmount",
    width: 130,
    align: "right" as const,
    render: (v: number) => (
      <Typography.Text strong style={{ color: "#16a34a" }}>
        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v)}
      </Typography.Text>
    ),
  },
];

const formatMoney = (amount: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);

export const PayrollDetailDrawer: React.FC<Props> = ({ open, payroll, onClose }) => {
  if (!payroll) return null;

  const period =
    typeof payroll.payrollPeriodId === "object"
      ? (payroll.payrollPeriodId as IPayrollPeriod)
      : null;

  return (
    <Drawer
      title="Chi tiết bảng lương"
      open={open}
      onClose={onClose}
      width={720}
      destroyOnClose
    >
      <Descriptions column={2} bordered size="small">
        <Descriptions.Item label="Kỳ lương" span={2}>
          {period?.name ?? String(payroll.payrollPeriodId)}
        </Descriptions.Item>
        <Descriptions.Item label="Từ ngày">
          {period ? dayjs(period.startDate).format("DD/MM/YYYY") : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Đến ngày">
          {period ? dayjs(period.endDate).format("DD/MM/YYYY") : "—"}
        </Descriptions.Item>
        <Descriptions.Item label="Số buổi dạy">
          {payroll.sessionCount}
        </Descriptions.Item>
        <Descriptions.Item label="Trạng thái">
          <PayrollStatusTag status={payroll.status} />
        </Descriptions.Item>
        <Descriptions.Item label="Lương cơ bản">
          {formatMoney(payroll.baseAmount)}
        </Descriptions.Item>
        <Descriptions.Item label="Tổng thực nhận">
          <Typography.Text strong style={{ color: "#16a34a", fontSize: 16 }}>
            {formatMoney(payroll.totalAmount)}
          </Typography.Text>
        </Descriptions.Item>
        {payroll.confirmedAt && (
          <Descriptions.Item label="Ngày xác nhận">
            {dayjs(payroll.confirmedAt).format("DD/MM/YYYY HH:mm")}
          </Descriptions.Item>
        )}
        {payroll.paidAt && (
          <Descriptions.Item label="Ngày thanh toán">
            {dayjs(payroll.paidAt).format("DD/MM/YYYY HH:mm")}
          </Descriptions.Item>
        )}
      </Descriptions>

      <Divider>Chi tiết các buổi dạy</Divider>

      <Table<IPayrollItem>
        dataSource={payroll.items}
        columns={itemColumns}
        rowKey={(_, i) => String(i)}
        pagination={false}
        size="small"
        locale={{ emptyText: "Chưa có dữ liệu chi tiết" }}
        summary={() => (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={4} align="right">
              <Typography.Text strong>Tổng cộng</Typography.Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={1} align="right">
              <Typography.Text strong style={{ color: "#16a34a" }}>
                {formatMoney(payroll.totalAmount)}
              </Typography.Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        )}
      />
    </Drawer>
  );
};

export default PayrollDetailDrawer;
