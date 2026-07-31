import { Drawer, Descriptions, Tag } from "antd";
import type { AccountRecord } from "./account.types";
import AccountStatusTag from "./AccountStatusTag";
import RoleTag from "./RoleTag";

interface AccountDetailDrawerProps {
  open: boolean;
  account?: AccountRecord;
  onClose: () => void;
}

const AccountDetailDrawer = ({ open, account, onClose }: AccountDetailDrawerProps) => {
  return (
    <Drawer title="Account Details" placement="right" onClose={onClose} open={open} width={420}>
      {account ? (
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Full Name">{account.fullName}</Descriptions.Item>
          <Descriptions.Item label="Email">{account.email}</Descriptions.Item>
          <Descriptions.Item label="Phone">{account.phone || "—"}</Descriptions.Item>
          <Descriptions.Item label="Role">
            <RoleTag role={account.role} />
          </Descriptions.Item>
          <Descriptions.Item label="Status">
            <AccountStatusTag status={account.status} />
          </Descriptions.Item>
          <Descriptions.Item label="Avatar">{account.avatar || "—"}</Descriptions.Item>
          <Descriptions.Item label="Created At">
            {new Date(account.createdAt).toLocaleString("en-GB")}
          </Descriptions.Item>
          <Descriptions.Item label="Updated At">
            {new Date(account.updatedAt).toLocaleString("en-GB")}
          </Descriptions.Item>
        </Descriptions>
      ) : null}
    </Drawer>
  );
};

export default AccountDetailDrawer;
