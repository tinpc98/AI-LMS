import { Tag } from "antd";
import type { AccountStatus } from "./account.types";

interface AccountStatusTagProps {
  status: AccountStatus;
}

const statusColorMap: Record<AccountStatus, string> = {
  Active: "green",
  Inactive: "orange",
  Locked: "red",
};

const AccountStatusTag = ({ status }: AccountStatusTagProps) => {
  return <Tag color={statusColorMap[status]}>{status}</Tag>;
};

export default AccountStatusTag;
