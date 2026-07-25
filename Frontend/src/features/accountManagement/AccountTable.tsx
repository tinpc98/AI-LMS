import { Avatar, Button, Empty, Table, Tooltip } from "antd";
import { EyeOutlined, EditOutlined, UnlockOutlined, LockOutlined, KeyOutlined, DeleteOutlined } from "@ant-design/icons";
import type { AccountRecord } from "./account.types";
import AccountStatusTag from "./AccountStatusTag";
import RoleTag from "./RoleTag";

interface AccountTableProps {
  data: AccountRecord[];
  loading: boolean;
  onView: (account: AccountRecord) => void;
  onEdit: (account: AccountRecord) => void;
  onToggleLock: (account: AccountRecord) => void;
  onResetPassword: (account: AccountRecord) => void;
  onDelete: (account: AccountRecord) => void;
}

const AccountTable = ({
  data,
  loading,
  onView,
  onEdit,
  onToggleLock,
  onResetPassword,
  onDelete,
}: AccountTableProps) => {
  const columns = [
    {
      title: "Avatar",
      dataIndex: "avatar",
      key: "avatar",
      width: 70,
      render: (_: string, record: AccountRecord) => (
        <Avatar src={record.avatar || undefined}>{record.fullName.charAt(0).toUpperCase()}</Avatar>
      ),
    },
    {
      title: "Full Name",
      dataIndex: "fullName",
      key: "fullName",
      sorter: (a: AccountRecord, b: AccountRecord) => a.fullName.localeCompare(b.fullName),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "Phone",
      dataIndex: "phone",
      key: "phone",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      render: (role: AccountRecord["role"]) => <RoleTag role={role} />,
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: AccountRecord["status"]) => <AccountStatusTag status={status} />,
    },
    {
      title: "Created At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (value: string) => new Date(value).toLocaleDateString("en-GB"),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: unknown, record: AccountRecord) => (
        <div style={{ display: "flex", gap: 6 }}>
          <Tooltip title="View">
            <Button size="small" icon={<EyeOutlined />} onClick={() => onView(record)} />
          </Tooltip>
          <Tooltip title="Edit">
            <Button size="small" icon={<EditOutlined />} onClick={() => onEdit(record)} />
          </Tooltip>
          <Tooltip title={record.status === "Locked" ? "Unlock" : "Lock"}>
            <Button size="small" icon={record.status === "Locked" ? <UnlockOutlined /> : <LockOutlined />} onClick={() => onToggleLock(record)} />
          </Tooltip>
          <Tooltip title="Reset Password">
            <Button size="small" icon={<KeyOutlined />} onClick={() => onResetPassword(record)} />
          </Tooltip>
          <Tooltip title="Delete">
            <Button size="small" danger icon={<DeleteOutlined />} onClick={() => onDelete(record)} />
          </Tooltip>
        </div>
      ),
    },
  ];

  return (
    <Table
      rowKey="id"
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={{ pageSize: 6 }}
      locale={{ emptyText: <Empty description="No accounts found" /> }}
    />
  );
};

export default AccountTable;
