import React from "react";
import { Input, Select, Row, Col, Space } from "antd";
import { SearchOutlined, FilterOutlined, SortAscendingOutlined } from "@ant-design/icons";
import type { MaterialFilterOptions } from "../../../../types/learningMaterial";

const { Option } = Select;

interface MaterialToolbarProps {
  searchQuery: string;
  typeFilter: string;
  sortBy: MaterialFilterOptions["sortBy"];
  onSearchChange: (value: string) => void;
  onTypeChange: (value: string) => void;
  onSortChange: (value: MaterialFilterOptions["sortBy"]) => void;
}

export const MaterialToolbar: React.FC<MaterialToolbarProps> = React.memo(
  ({ searchQuery, typeFilter, sortBy, onSearchChange, onTypeChange, onSortChange }) => {
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
              placeholder="Tìm kiếm theo tên hoặc mô tả tài liệu..."
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
              {/* Type Filter */}
              <Space size={6}>
                <FilterOutlined style={{ color: "#8c8c8c" }} />
                <Select
                  value={typeFilter}
                  onChange={onTypeChange}
                  style={{ width: 150, borderRadius: 8 }}
                >
                  <Option value="all">Tất cả loại tài liệu</Option>
                  <Option value="pdf">PDF Document</Option>
                  <Option value="video">Video bài giảng</Option>
                  <Option value="link">Web Link</Option>
                  <Option value="document">Văn bản Word</Option>
                  <Option value="slide">Slide / PPT</Option>
                </Select>
              </Space>

              {/* Sort By */}
              <Space size={6}>
                <SortAscendingOutlined style={{ color: "#8c8c8c" }} />
                <Select
                  value={sortBy}
                  onChange={onSortChange}
                  style={{ width: 140, borderRadius: 8 }}
                >
                  <Option value="newest">Mới nhất</Option>
                  <Option value="oldest">Cũ nhất</Option>
                  <Option value="name_asc">Tên A-Z</Option>
                  <Option value="name_desc">Tên Z-A</Option>
                </Select>
              </Space>
            </Space>
          </Col>
        </Row>
      </div>
    );
  }
);

MaterialToolbar.displayName = "MaterialToolbar";

export default MaterialToolbar;
