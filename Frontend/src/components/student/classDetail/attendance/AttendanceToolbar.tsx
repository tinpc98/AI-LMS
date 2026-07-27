import React from "react";
import { Input, Select, Row, Col, Space, Segmented } from "antd";
import { SearchOutlined, FilterOutlined, TableOutlined, HistoryOutlined } from "@ant-design/icons";
import type { StudentAttendanceFilterOptions } from "../../../../types/studentAttendance";

const { Option } = Select;

interface AttendanceToolbarProps {
  searchQuery: string;
  monthFilter: string;
  monthOptions: string[];
  statusFilter: StudentAttendanceFilterOptions["statusFilter"];
  viewMode: StudentAttendanceFilterOptions["viewMode"];
  onSearchChange: (value: string) => void;
  onMonthFilterChange: (value: string) => void;
  onStatusFilterChange: (value: StudentAttendanceFilterOptions["statusFilter"]) => void;
  onViewModeChange: (value: StudentAttendanceFilterOptions["viewMode"]) => void;
}

export const AttendanceToolbar: React.FC<AttendanceToolbarProps> = React.memo(
  ({
    searchQuery,
    monthFilter,
    monthOptions,
    statusFilter,
    viewMode,
    onSearchChange,
    onMonthFilterChange,
    onStatusFilterChange,
    onViewModeChange,
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
          <Col xs={24} sm={10} md={8} lg={8}>
            <Input
              placeholder="Tìm kiếm buổi học, ghi chú..."
              prefix={<SearchOutlined style={{ color: "#bfbfbf" }} />}
              allowClear
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              style={{ borderRadius: 8 }}
            />
          </Col>

          {/* Filters & View Mode Segmented */}
          <Col xs={24} sm={14} md={16} lg={16}>
            <Space wrap style={{ width: "100%", justifyContent: "flex-end" }}>
              {/* Month Filter */}
              <Space size={4}>
                <FilterOutlined style={{ color: "#8c8c8c" }} />
                <Select
                  value={monthFilter}
                  onChange={onMonthFilterChange}
                  style={{ width: 140, borderRadius: 8 }}
                >
                  <Option value="all">Tất cả tháng</Option>
                  {monthOptions.map((m) => (
                    <Option key={m} value={m}>
                      Tháng {m}
                    </Option>
                  ))}
                </Select>
              </Space>

              {/* Status Filter */}
              <Select
                value={statusFilter}
                onChange={onStatusFilterChange}
                style={{ width: 140, borderRadius: 8 }}
              >
                <Option value="all">Tất cả trạng thái</Option>
                <Option value="Present">Có mặt</Option>
                <Option value="Late">Đi muộn</Option>
                <Option value="Absent">Vắng mặt</Option>
                <Option value="Excused">Có phép</Option>
              </Select>

              {/* View Mode Segmented Toggle */}
              <Segmented
                value={viewMode}
                onChange={(val) => onViewModeChange(val as any)}
                options={[
                  { label: "Bảng dữ liệu", value: "table", icon: <TableOutlined /> },
                  { label: "Dòng thời gian", value: "timeline", icon: <HistoryOutlined /> },
                ]}
                style={{ borderRadius: 8 }}
              />
            </Space>
          </Col>
        </Row>
      </div>
    );
  }
);

AttendanceToolbar.displayName = "AttendanceToolbar";

export default AttendanceToolbar;
