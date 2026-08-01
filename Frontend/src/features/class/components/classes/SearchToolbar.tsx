import React from "react";
import { Row, Col, Input, Select, Button, Space, Card } from "antd";
import { SearchOutlined, ReloadOutlined } from "@ant-design/icons";
import type { StudentClassFilterOptions } from "../../../../types/studentClass";

const { Option } = Select;

interface SearchToolbarProps {
  filters: StudentClassFilterOptions;
  availableSubjects: string[];
  availableSemesters: string[];
  onSearchChange: (value: string) => void;
  onStatusChange: (status: string) => void;
  onSemesterChange: (semester: string) => void;
  onSubjectChange: (subject: string) => void;
  onSortByChange: (sortBy: StudentClassFilterOptions["sortBy"]) => void;
  onReset: () => void;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = React.memo(
  ({
    filters,
    availableSubjects,
    availableSemesters,
    onSearchChange,
    onStatusChange,
    onSemesterChange,
    onSubjectChange,
    onSortByChange,
    onReset,
  }) => {
    const isFiltered =
      filters.search !== "" ||
      filters.status !== "ALL" ||
      filters.semester !== "ALL" ||
      filters.subject !== "ALL" ||
      filters.sortBy !== "name_asc";

    return (
      <Card
        style={{
          borderRadius: 16,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          marginBottom: 24,
          border: "1px solid #f0f0f0",
        }}
        styles={{ body: { padding: 16 } }}
      >
        <Row gutter={[12, 12]} align="middle">
          {/* Search Box */}
          <Col xs={24} sm={12} md={7} lg={6}>
            <Input
              placeholder="Tìm tên lớp, mã lớp, môn học..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              value={filters.search}
              onChange={(e) => onSearchChange(e.target.value)}
              allowClear
              style={{ borderRadius: 8 }}
            />
          </Col>

          {/* Status Filter */}
          <Col xs={12} sm={6} md={4} lg={4}>
            <Select
              value={filters.status}
              onChange={onStatusChange}
              style={{ width: "100%", borderRadius: 8 }}
            >
              <Option value="ALL">Tất cả trạng thái</Option>
              <Option value="Active">Đang học</Option>
              <Option value="Ready">Sắp mở (Ready)</Option>
              <Option value="Completed">Đã hoàn thành</Option>
              <Option value="Paused">Tạm dừng</Option>
            </Select>
          </Col>

          {/* Semester Filter */}
          <Col xs={12} sm={6} md={4} lg={4}>
            <Select
              value={filters.semester}
              onChange={onSemesterChange}
              style={{ width: "100%", borderRadius: 8 }}
            >
              <Option value="ALL">Tất cả học kỳ</Option>
              {availableSemesters.map((sem) => (
                <Option key={sem} value={sem}>
                  {sem}
                </Option>
              ))}
            </Select>
          </Col>

          {/* Subject Filter */}
          <Col xs={12} sm={6} md={4} lg={4}>
            <Select
              value={filters.subject}
              onChange={onSubjectChange}
              style={{ width: "100%", borderRadius: 8 }}
            >
              <Option value="ALL">Tất cả môn học</Option>
              {availableSubjects.map((sub) => (
                <Option key={sub} value={sub}>
                  {sub}
                </Option>
              ))}
            </Select>
          </Col>

          {/* Sort By Dropdown */}
          <Col xs={12} sm={6} md={5} lg={4}>
            <Select
              value={filters.sortBy}
              onChange={onSortByChange}
              style={{ width: "100%", borderRadius: 8 }}
            >
              <Option value="name_asc">Tên lớp: A → Z</Option>
              <Option value="name_desc">Tên lớp: Z → A</Option>
              <Option value="date_desc">Mới nhất</Option>
              <Option value="date_asc">Cũ nhất</Option>
            </Select>
          </Col>

          {/* Reset Filters Button */}
          {isFiltered && (
            <Col xs={24} sm={24} md={2} lg={2} style={{ textAlign: "right" }}>
              <Space>
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={onReset}
                  style={{ color: "#ff4d4f", fontSize: 13 }}
                >
                  Xóa lọc
                </Button>
              </Space>
            </Col>
          )}
        </Row>
      </Card>
    );
  }
);

SearchToolbar.displayName = "SearchToolbar";

export default SearchToolbar;
