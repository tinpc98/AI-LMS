import React from "react";
import { Input, Select, Row, Col, Space } from "antd";
import { SearchOutlined, FilterOutlined, SortAscendingOutlined } from "@ant-design/icons";
import type { StudentGradeFilterOptions } from "../../../../../types/studentGrade";

const { Option } = Select;

interface GradeToolbarProps {
  searchQuery: string;
  categoryFilter: StudentGradeFilterOptions["categoryFilter"];
  statusFilter: StudentGradeFilterOptions["statusFilter"];
  sortBy: StudentGradeFilterOptions["sortBy"];
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: StudentGradeFilterOptions["categoryFilter"]) => void;
  onStatusFilterChange: (value: StudentGradeFilterOptions["statusFilter"]) => void;
  onSortChange: (value: StudentGradeFilterOptions["sortBy"]) => void;
}

export const GradeToolbar: React.FC<GradeToolbarProps> = React.memo(
  ({
    searchQuery,
    categoryFilter,
    statusFilter,
    sortBy,
    onSearchChange,
    onCategoryFilterChange,
    onStatusFilterChange,
    onSortChange,
  }) => {
    return (
      <div
        style={{
          backgroundColor: "var(--color-surface)",
          padding: "16px 20px",
          borderRadius: 14,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.03)",
          border: "1px solid var(--color-border-default)",
          marginBottom: 24,
        }}
      >
        <Row gutter={[16, 12]} align="middle" justify="space-between">
          {/* Search Input */}
          <Col xs={24} sm={10} md={8} lg={8}>
            <Input
              placeholder="Tìm kiếm tên bài / đầu điểm..."
              prefix={<SearchOutlined style={{ color: "var(--color-text-disabled)" }} />}
              allowClear
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </Col>

          {/* Filters & Sorting */}
          <Col xs={24} sm={14} md={16} lg={16}>
            <Space wrap style={{ width: "100%", justifyContent: "flex-end" }}>
              {/* Category Filter */}
              <Space size={4}>
                <FilterOutlined style={{ color: "var(--color-text-description)" }} />
                <Select
                  value={categoryFilter}
                  onChange={onCategoryFilterChange}
                  style={{ width: 140, borderRadius: 8 }}
                >
                  <Option value="all">Tất cả loại điểm</Option>
                  <Option value="Assignment">Bài tập</Option>
                  <Option value="Exam">Bài thi</Option>
                  <Option value="Quiz">Quiz</Option>
                  <Option value="Attendance">Chuyên cần</Option>
                </Select>
              </Space>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onChange={onStatusFilterChange}
                style={{ width: 140, borderRadius: 8 }}
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="Graded">Đã chấm điểm</Option>
                <Option value="Pending">Chờ chấm điểm</Option>
              </Select>

              {/* Sort By */}
              <Space size={4}>
                <SortAscendingOutlined style={{ color: "var(--color-text-description)" }} />
                <Select
                  value={sortBy}
                  onChange={onSortChange}
                  style={{ width: 150, borderRadius: 8 }}
                >
                  <Option value="highest">Điểm cao nhất</Option>
                  <Option value="lowest">Điểm thấp nhất</Option>
                  <Option value="gradedAt">Mới chấm nhất</Option>
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

GradeToolbar.displayName = "GradeToolbar";

export default GradeToolbar;
