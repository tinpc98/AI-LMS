import React from "react";
import { Input, Select, Row, Col, Space } from "antd";
import { SearchOutlined, FilterOutlined, SortAscendingOutlined } from "@ant-design/icons";
import type { StudentExamFilterOptions } from "../../../../types/studentExam";

const { Option } = Select;

interface ExamToolbarProps {
  searchQuery: string;
  statusFilter: StudentExamFilterOptions["statusFilter"];
  sortBy: StudentExamFilterOptions["sortBy"];
  onSearchChange: (value: string) => void;
  onStatusFilterChange: (value: StudentExamFilterOptions["statusFilter"]) => void;
  onSortChange: (value: StudentExamFilterOptions["sortBy"]) => void;
}

export const ExamToolbar: React.FC<ExamToolbarProps> = React.memo(
  ({ searchQuery, statusFilter, sortBy, onSearchChange, onStatusFilterChange, onSortChange }) => {
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
              placeholder="Tìm kiếm bài kiểm tra..."
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
                  style={{ width: 170, borderRadius: 8 }}
                >
                  <Option value="all">Tất cả bài kiểm tra</Option>
                  <Option value="available">Đang mở thi</Option>
                  <Option value="in_progress">Đang làm dở dang</Option>
                  <Option value="upcoming">Sắp diễn ra</Option>
                  <Option value="completed">Đã hoàn thành</Option>
                  <Option value="expired">Đã đóng / Khóa</Option>
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
                  <Option value="start_asc">Giờ thi gần nhất</Option>
                  <Option value="start_desc">Giờ thi xa nhất</Option>
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

ExamToolbar.displayName = "ExamToolbar";

export default ExamToolbar;
