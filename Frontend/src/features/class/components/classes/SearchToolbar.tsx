import React, { useState } from "react";
import {
  Row,
  Col,
  Input,
  Select,
  Button,
  Space,
  Card,
  Drawer,
  Badge,
  Typography,
  Divider,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  FilterOutlined,
  CheckOutlined,
} from "@ant-design/icons";
import type { StudentClassFilterOptions } from "../../../../types/studentClass";
import { tokens } from "../../../../shared/theme/tokens";
import { useResponsiveLayout } from "../../../../shared/hooks/useResponsiveLayout";

const { Option } = Select;
const { Text } = Typography;

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
    const { isMobile } = useResponsiveLayout();
    const [drawerOpen, setDrawerOpen] = useState(false);

    const activeFilterCount =
      (filters.status !== "ALL" ? 1 : 0) +
      (filters.semester !== "ALL" ? 1 : 0) +
      (filters.subject !== "ALL" ? 1 : 0) +
      (filters.sortBy !== "name_asc" ? 1 : 0);

    const isFiltered = filters.search !== "" || activeFilterCount > 0;

    return (
      <Card
        style={{
          borderRadius: tokens.radius.lg,
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
          marginBottom: tokens.space[5],
          border: `1px solid ${tokens.color.border.default}`,
        }}
        styles={{ body: { padding: tokens.space[4] } }}
      >
        {isMobile ? (
          /* =======================================================
             MOBILE VIEW (< 768px): Search + Filter Button with Badge
             ======================================================= */
          <div style={{ display: "flex", gap: tokens.space[2], alignItems: "center" }}>
            <Input
              placeholder="Tìm tên, mã lớp, môn học..."
              prefix={<SearchOutlined style={{ color: tokens.color.text.disabled }} />}
              value={filters.search}
              onChange={(e) => onSearchChange(e.target.value)}
              allowClear
              style={{
                borderRadius: tokens.radius.md,
                flex: 1,
                minHeight: 44,
                fontSize: 16,
              }}
            />

            <Badge count={activeFilterCount} overflowCount={9}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setDrawerOpen(true)}
                type={activeFilterCount > 0 ? "primary" : "default"}
                style={{
                  minHeight: 44,
                  padding: "0 16px",
                  borderRadius: tokens.radius.md,
                  display: "flex",
                  alignItems: "center",
                  fontWeight: 600,
                }}
              >
                Bộ lọc
              </Button>
            </Badge>

            {isFiltered && (
              <Button
                type="text"
                danger
                icon={<ReloadOutlined />}
                onClick={onReset}
                title="Xóa tất cả bộ lọc"
                style={{ minHeight: 44, minWidth: 44 }}
                aria-label="Xóa bộ lọc"
              />
            )}

            {/* Mobile Filter Drawer */}
            <Drawer
              title={
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Bộ lọc lớp học</span>
                  {activeFilterCount > 0 && (
                    <Text type="secondary" style={{ fontSize: 13, fontWeight: 400 }}>
                      Đang chọn {activeFilterCount} tiêu chí
                    </Text>
                  )}
                </div>
              }
              placement="bottom"
              onClose={() => setDrawerOpen(false)}
              open={drawerOpen}
              styles={{
                body: { padding: `${tokens.space[5]}px ${tokens.space[5]}px` },
                content: { borderRadius: `${tokens.radius.xl}px ${tokens.radius.xl}px 0 0` },
              }}
              footer={
                <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <Button onClick={onReset} style={{ minHeight: 44, flex: 1 }}>
                    Đặt lại
                  </Button>
                  <Button
                    type="primary"
                    icon={<CheckOutlined />}
                    onClick={() => setDrawerOpen(false)}
                    style={{ minHeight: 44, flex: 1, fontWeight: 600 }}
                  >
                    Áp dụng
                  </Button>
                </div>
              }
            >
              <div style={{ display: "flex", flexDirection: "column", gap: tokens.space[4] }}>
                <div>
                  <Text strong style={{ display: "block", marginBottom: 6 }}>
                    Trạng thái
                  </Text>
                  <Select
                    value={filters.status}
                    onChange={onStatusChange}
                    style={{ width: "100%", height: 44 }}
                  >
                    <Option value="ALL">Tất cả trạng thái</Option>
                    <Option value="Active">Đang học</Option>
                    <Option value="Ready">Sắp mở (Ready)</Option>
                    <Option value="Completed">Đã hoàn thành</Option>
                    <Option value="Paused">Tạm dừng</Option>
                  </Select>
                </div>

                <div>
                  <Text strong style={{ display: "block", marginBottom: 6 }}>
                    Học kỳ
                  </Text>
                  <Select
                    value={filters.semester}
                    onChange={onSemesterChange}
                    style={{ width: "100%", height: 44 }}
                  >
                    <Option value="ALL">Tất cả học kỳ</Option>
                    {availableSemesters.map((sem) => (
                      <Option key={sem} value={sem}>
                        {sem}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Text strong style={{ display: "block", marginBottom: 6 }}>
                    Môn học
                  </Text>
                  <Select
                    value={filters.subject}
                    onChange={onSubjectChange}
                    style={{ width: "100%", height: 44 }}
                  >
                    <Option value="ALL">Tất cả môn học</Option>
                    {availableSubjects.map((sub) => (
                      <Option key={sub} value={sub}>
                        {sub}
                      </Option>
                    ))}
                  </Select>
                </div>

                <div>
                  <Text strong style={{ display: "block", marginBottom: 6 }}>
                    Sắp xếp theo
                  </Text>
                  <Select
                    value={filters.sortBy}
                    onChange={onSortByChange}
                    style={{ width: "100%", height: 44 }}
                  >
                    <Option value="name_asc">Tên lớp: A → Z</Option>
                    <Option value="name_desc">Tên lớp: Z → A</Option>
                    <Option value="date_desc">Mới nhất</Option>
                    <Option value="date_asc">Cũ nhất</Option>
                  </Select>
                </div>
              </div>
            </Drawer>
          </div>
        ) : (
          /* =======================================================
             TABLET & DESKTOP VIEW (>= 768px)
             ======================================================= */
          <Row gutter={[tokens.space[3], tokens.space[3]]} align="middle">
            {/* Search Box */}
            <Col xs={24} md={12} lg={6}>
              <Input
                placeholder="Tìm tên lớp, mã lớp, môn học..."
                prefix={<SearchOutlined style={{ color: tokens.color.text.disabled }} />}
                value={filters.search}
                onChange={(e) => onSearchChange(e.target.value)}
                allowClear
                style={{ borderRadius: tokens.radius.md }}
              />
            </Col>

            {/* Status Filter */}
            <Col xs={12} sm={6} md={6} lg={4}>
              <Select
                value={filters.status}
                onChange={onStatusChange}
                style={{ width: "100%", borderRadius: tokens.radius.md }}
              >
                <Option value="ALL">Tất cả trạng thái</Option>
                <Option value="Active">Đang học</Option>
                <Option value="Ready">Sắp mở (Ready)</Option>
                <Option value="Completed">Đã hoàn thành</Option>
                <Option value="Paused">Tạm dừng</Option>
              </Select>
            </Col>

            {/* Semester Filter */}
            <Col xs={12} sm={6} md={6} lg={4}>
              <Select
                value={filters.semester}
                onChange={onSemesterChange}
                style={{ width: "100%", borderRadius: tokens.radius.md }}
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
            <Col xs={12} sm={6} md={6} lg={4}>
              <Select
                value={filters.subject}
                onChange={onSubjectChange}
                style={{ width: "100%", borderRadius: tokens.radius.md }}
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
            <Col xs={12} sm={6} md={6} lg={4}>
              <Select
                value={filters.sortBy}
                onChange={onSortByChange}
                style={{ width: "100%", borderRadius: tokens.radius.md }}
              >
                <Option value="name_asc">Tên lớp: A → Z</Option>
                <Option value="name_desc">Tên lớp: Z → A</Option>
                <Option value="date_desc">Mới nhất</Option>
                <Option value="date_asc">Cũ nhất</Option>
              </Select>
            </Col>

            {/* Reset Filters Button */}
            {isFiltered && (
              <Col xs={24} md={12} lg={2} style={{ textAlign: "right" }}>
                <Button
                  type="text"
                  icon={<ReloadOutlined />}
                  onClick={onReset}
                  style={{ color: tokens.color.semantic.error.base, fontSize: 13 }}
                >
                  Xóa lọc
                </Button>
              </Col>
            )}
          </Row>
        )}
      </Card>
    );
  }
);

SearchToolbar.displayName = "SearchToolbar";

export default SearchToolbar;
