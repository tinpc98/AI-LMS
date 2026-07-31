import React from "react";
import { Input, Select, Row, Col, Space } from "antd";
import { SearchOutlined, FilterOutlined, SortAscendingOutlined } from "@ant-design/icons";
import type { StudentAnnouncementFilterOptions } from "../../../../types/studentAnnouncement";

const { Option } = Select;

interface AnnouncementToolbarProps {
  searchQuery: string;
  filterType: StudentAnnouncementFilterOptions["filterType"];
  sortBy: StudentAnnouncementFilterOptions["sortBy"];
  onSearchChange: (value: string) => void;
  onFilterTypeChange: (value: StudentAnnouncementFilterOptions["filterType"]) => void;
  onSortChange: (value: StudentAnnouncementFilterOptions["sortBy"]) => void;
}

export const AnnouncementToolbar: React.FC<AnnouncementToolbarProps> = React.memo(
  ({ searchQuery, filterType, sortBy, onSearchChange, onFilterTypeChange, onSortChange }) => {
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
          <Col xs={24} sm={10} md={9} lg={9}>
            <Input
              placeholder="Tìm kiếm thông báo, nội dung..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              allowClear
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </Col>

          {/* Filters & Sort Select Dropdowns */}
          <Col xs={24} sm={14} md={15} lg={15}>
            <Space wrap style={{ width: "100%", justifyContent: "flex-end" }}>
              {/* Category Filter */}
              <Space size={4}>
                <FilterOutlined style={{ color: "#8c8c8c" }} />
                <Select
                  value={filterType}
                  onChange={onFilterTypeChange}
                  style={{ width: 160, borderRadius: 8 }}
                >
                  <Option value="all">Tất cả thông báo</Option>
                  <Option value="unread">Chưa đọc</Option>
                  <Option value="read">Đã đọc</Option>
                  <Option value="pinned">Đã ghim 📌</Option>
                  <Option value="this_week">Tuần này</Option>
                  <Option value="this_month">Tháng này</Option>
                </Select>
              </Space>

              {/* Sort By */}
              <Space size={4}>
                <SortAscendingOutlined style={{ color: "#8c8c8c" }} />
                <Select
                  value={sortBy}
                  onChange={onSortChange}
                  style={{ width: 160, borderRadius: 8 }}
                >
                  <Option value="newest">Mới nhất</Option>
                  <Option value="oldest">Cũ nhất</Option>
                  <Option value="important">Quan trọng trước</Option>
                </Select>
              </Space>
            </Space>
          </Col>
        </Row>
      </div>
    );
  }
);

AnnouncementToolbar.displayName = "AnnouncementToolbar";

export default AnnouncementToolbar;
