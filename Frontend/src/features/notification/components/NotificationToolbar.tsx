import React from "react";
import { Input, Select, Row, Col, Space } from "antd";
import { SearchOutlined, FilterOutlined, SortAscendingOutlined } from "@ant-design/icons";
import type { NotificationFilterOptions } from "../../../types/studentNotification";

const { Option } = Select;

interface NotificationToolbarProps {
  searchQuery: string;
  category: NotificationFilterOptions["category"];
  sortBy: NotificationFilterOptions["sortBy"];
  onSearchChange: (value: string) => void;
  onCategoryChange: (value: NotificationFilterOptions["category"]) => void;
  onSortChange: (value: NotificationFilterOptions["sortBy"]) => void;
}

export const NotificationToolbar: React.FC<NotificationToolbarProps> = React.memo(
  ({ searchQuery, category, sortBy, onSearchChange, onCategoryChange, onSortChange }) => {
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
          <Col xs={24} sm={10} md={9} lg={9}>
            <Input
              placeholder="Tìm kiếm tiêu đề, nội dung, tên lớp..."
              prefix={<SearchOutlined style={{ color: "var(--color-text-disabled)" }} />}
              allowClear
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </Col>

          {/* Filters & Sort */}
          <Col xs={24} sm={14} md={15} lg={15}>
            <Space wrap style={{ width: "100%", justifyContent: "flex-end" }}>
              {/* Category Filter */}
              <Space size={4}>
                <FilterOutlined style={{ color: "var(--color-text-description)" }} />
                <Select
                  value={category}
                  onChange={onCategoryChange}
                  style={{ width: 170, borderRadius: 8 }}
                >
                  <Option value="all">Tất cả thể loại</Option>
                  <Option value="unread">Chưa đọc 🔵</Option>
                  <Option value="read">Đã đọc</Option>
                  <Option value="assignment">📘 Bài tập</Option>
                  <Option value="exam">📝 Bài thi / Kiểm tra</Option>
                  <Option value="grade">📊 Bảng điểm</Option>
                  <Option value="attendance">📅 Điểm danh</Option>
                  <Option value="live">🎥 Lớp học trực tuyến</Option>
                  <Option value="announcement">📢 Thông báo lớp</Option>
                  <Option value="system">⚙ Hệ thống</Option>
                </Select>
              </Space>

              {/* Sort By */}
              <Space size={4}>
                <SortAscendingOutlined style={{ color: "var(--color-text-description)" }} />
                <Select
                  value={sortBy}
                  onChange={onSortChange}
                  style={{ width: 160, borderRadius: 8 }}
                >
                  <Option value="newest">Mới nhất</Option>
                  <Option value="oldest">Cũ nhất</Option>
                  <Option value="important">Quan trọng trước 🔥</Option>
                </Select>
              </Space>
            </Space>
          </Col>
        </Row>
      </div>
    );
  }
);

NotificationToolbar.displayName = "NotificationToolbar";

export default NotificationToolbar;
