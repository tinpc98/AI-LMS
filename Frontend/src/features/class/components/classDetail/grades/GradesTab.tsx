import React from "react";
import { Alert, Button, Typography } from "antd";
import GradeStatistic from "./GradeStatistic";
import GradeOverview from "./GradeOverview";
import GradeChart from "./GradeChart";
import GradeToolbar from "./GradeToolbar";
import GradeTable from "./GradeTable";
import GradeEmptyState from "./GradeEmptyState";
import GradeLoadingSkeleton from "./GradeLoadingSkeleton";
import GradeDetailDrawer from "./GradeDetailDrawer";
import useStudentGrades from "../../../../grade/hooks/useStudentGrades";
import useGradeDetail from "../../../../grade/hooks/useGradeDetail";
import type { IGrade } from "../../../../../api/gradeApi";
import gradeApi from "../../../../../api/gradeApi";

const { Title, Text } = Typography;

interface GradesTabProps {
  classId: string;
}

export const GradesTab: React.FC<GradesTabProps> = React.memo(({ classId }) => {
  // Custom Hooks
  const {
    filters,
    stats,
    filteredGradeItems,
    handleSearchChange,
    handleCategoryFilterChange,
    handleStatusFilterChange,
    handleSortChange,
    loading,
    error,
    refetch,
  } = useStudentGrades(classId);

  const { selectedGrade, isDetailOpen, openDetail, closeDetail } = useGradeDetail();

  const isFiltered =
    filters.searchQuery.trim() !== "" ||
    filters.categoryFilter !== "all" ||
    filters.statusFilter !== "all";

  return (
    <div style={{ padding: "8px 0" }}>
      {/* 1. Header Banner & Stats Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={4} style={{ margin: "0 0 4px 0", fontWeight: 700, color: "var(--color-text-title)" }}>
            📊 Bảng điểm cá nhân
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Theo dõi toàn bộ điểm số các bài tập, kỳ thi và đánh giá chuyên cần trong lớp học.
          </Text>
        </div>

        {/* Báo lỗi tải dữ liệu — xem ghi chú cùng loại ở AttendanceTab. Trước Wave 5 hook
            nuốt lỗi, nên API hỏng thì học sinh thấy bảng điểm trống, không phân biệt được
            với "giáo viên chưa chấm bài nào". */}
        {error && (
          <Alert
            type="error"
            showIcon
            message="Không tải được bảng điểm"
            description={error}
            action={
              <Button size="small" onClick={() => refetch()}>
                Thử lại
              </Button>
            }
            style={{ marginBottom: 16 }}
          />
        )}

        {/* 6 Statistic Cards */}
        <GradeStatistic stats={stats} />
      </div>

      {/* 2. Progress Overview Dashboard */}
      <GradeOverview stats={stats} />

      {/* 3. Bar Distribution Chart */}
      <GradeChart items={filteredGradeItems} />

      {/* 4. Toolbar (Search, Filter, Sort) */}
      <GradeToolbar
        searchQuery={filters.searchQuery}
        categoryFilter={filters.categoryFilter}
        statusFilter={filters.statusFilter}
        sortBy={filters.sortBy}
        onSearchChange={handleSearchChange}
        onCategoryFilterChange={handleCategoryFilterChange}
        onStatusFilterChange={handleStatusFilterChange}
        onSortChange={handleSortChange}
      />

      {/* 5. Content Box: Loading / Empty / Grade Table */}
      {loading ? (
        <GradeLoadingSkeleton count={6} />
      ) : filteredGradeItems.length === 0 ? (
        <GradeEmptyState
          isFiltered={isFiltered}
          onResetFilters={() => {
            handleSearchChange("");
            handleCategoryFilterChange("all");
            handleStatusFilterChange("all");
          }}
        />
      ) : (
        <GradeTable items={filteredGradeItems} onDetail={openDetail} />
      )}

      {/* 6. Grade Detail Drawer */}
      <GradeDetailDrawer open={isDetailOpen} item={selectedGrade} onClose={closeDetail} />
    </div>
  );
});

GradesTab.displayName = "GradesTab";

export default GradesTab;
