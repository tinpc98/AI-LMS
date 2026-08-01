import { Tag } from "antd";
import type { AccountRole } from "./account.types";

interface RoleTagProps {
  role: AccountRole;
}

const roleColorMap: Record<AccountRole, string> = {
  Admin: "blue",
  Teacher: "purple",
  Student: "geekblue",
};

const RoleTag = ({ role }: RoleTagProps) => {
  return <Tag color={roleColorMap[role]}>{role}</Tag>;
};

export default RoleTag;
