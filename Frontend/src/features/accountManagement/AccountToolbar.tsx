import { Button, Col, Input, Row, Select } from "antd";
import { ReloadOutlined, PlusOutlined } from "@ant-design/icons";
import type { AccountFilters, AccountRole, AccountStatus } from "./account.types";

interface AccountToolbarProps {
  filters: AccountFilters;
  onFiltersChange: (filters: AccountFilters) => void;
  onRefresh: () => void;
  onCreate?: () => void;
}

const AccountToolbar = ({ filters, onFiltersChange, onRefresh, onCreate }: AccountToolbarProps) => {
  return (
    <Row gutter={[12, 12]} align="middle">
      <Col xs={24} md={8}>
        <Input
          allowClear
          placeholder="Search by name, email, phone"
          value={filters.search}
          onChange={(event) => onFiltersChange({ ...filters, search: event.target.value })}
        />
      </Col>
      <Col xs={24} sm={12} md={4}>
        <Select
          style={{ width: "100%" }}
          placeholder="Role"
          value={filters.role}
          onChange={(value: AccountRole | "All") => onFiltersChange({ ...filters, role: value })}
          options={[
            { label: "All Roles", value: "All" },
            { label: "Admin", value: "Admin" },
            { label: "Teacher", value: "Teacher" },
            { label: "Student", value: "Student" },
          ]}
        />
      </Col>
      <Col xs={24} sm={12} md={4}>
        <Select
          style={{ width: "100%" }}
          placeholder="Status"
          value={filters.status}
          onChange={(value: AccountStatus | "All") => onFiltersChange({ ...filters, status: value })}
          options={[
            { label: "All Status", value: "All" },
            { label: "Active", value: "Active" },
            { label: "Inactive", value: "Inactive" },
            { label: "Locked", value: "Locked" },
          ]}
        />
      </Col>
      <Col xs={24} sm={12} md={4}>
        <Button icon={<ReloadOutlined />} onClick={onRefresh} block>
          Refresh
        </Button>
      </Col>
      {onCreate && (
        <Col xs={24} sm={12} md={4}>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreate} block>
            Create Account
          </Button>
        </Col>
      )}
    </Row>
  );
};

export default AccountToolbar;
