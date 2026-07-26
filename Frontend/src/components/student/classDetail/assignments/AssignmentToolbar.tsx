import React from "react";
import { Input, Select, Row, Col, Space } from "antd";
import { SearchOutlined, FilterOutlined, SortAscendingOutlined } from "@ant-design/icons";
import type { StudentAssignmentFilterOptions } from "../../../types/studentAssignment";

const { Option } = Select;

interface AssignmentToolbarProps {
  searchQuery: string;
  statusFilter: StudentAssignmentFilterOptions["statusFilter"];
  sortBy: StudentAssignmentFilterOptions["sortBy"];
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StudentAssignmentFilterOptions["statusFilter"]) => void;
  onSortChange: (value: StudentAssignmentFilterOptions["sortBy"]) => void;
}

export const AssignmentToolbar: React.FC<AssignmentToolbarProps> = React.memo(
  ({
    searchQuery,
    statusFilter,
    sortBy,
    onSearchChange,
    onStatusFilterChange,
    onSortChange,
  }) => {
    return (
      <div
        style={{
          backgroundColor: "#fff",
          padding: "16px 20px",
          borderRadius: 14,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          border: "1px solid #f0f0f0",
          marginBottom: 24,
        }}
      >
        <Row gutter={[16, 12]} align="middle" justify="space-between">
          {/* Search Input */}
          <Col xs={24} sm={12} md={10} lg={10}>
            <Input
              placeholder="Tìm kiếm theo tên bài tập..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              allowClear
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </Col>

          {/* Filters & Sorting */}
          <Col xs={24} sm={12} md={14} lg={14}>
            <Space wrap style={{ width: "100%", justifyContent: "flex-end" }}>
              {/* Status Filter */}
              <Space size={6}>
                <FilterOutlined style={{ color: "#8c8c8c" }} />
                <Select
                  value={statusFilter}
                  onChange={onStatusFilterChange}
                  style={{ width: 160, borderRadius: 8 }}
                >
                  <Option value="all">Tất cả trạng thái</Option>
                  <Option value="pending">Chưa nộp bài</Option>
                  <Option value="submitted">Đã nộp bài</Option>
                  <Option value="late">Quá hạn / Trễ</Option>
                  <Option value="graded">Đã chấm điểm</Option>
                </Select>
              </Space>

              {/* Sort By */}
              <Space size={6}>
                <SortAscendingOutlined style={{ color: "#8c8c8c" }} />
                <Select
                  value={sortBy}
                  onChange={onSortChange}
                  style={{ width: 170, borderRadius: 8 }}
                >
                  <Option value="deadline_asc">Deadline gần nhất</Option>
                  <Option value="deadline_desc">Deadline xa nhất</Option>
                  <Option value="newest">Mới tạo nhất</Option>
                  <Option value="name_asc">Tên A-Z</Option>
                </Select>
              </Space>
            </Space>
          </Col>
        </Row>
      </div>
    );
  }
);

AssignmentToolbar.displayName = "AssignmentToolbar";

export default AssignmentToolbar;
