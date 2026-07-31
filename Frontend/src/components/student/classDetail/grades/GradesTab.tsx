import React from "react";
import { Typography } from "antd";
import GradeStatistic from "./GradeStatistic";
import GradeOverview from "./GradeOverview";
import GradeChart from "./GradeChart";
import GradeToolbar from "./GradeToolbar";
import GradeTable from "./GradeTable";
import GradeEmptyState from "./GradeEmptyState";
import GradeLoadingSkeleton from "./GradeLoadingSkeleton";
import GradeDetailDrawer from "./GradeDetailDrawer";
import useStudentGrades from "../../../../hooks/useStudentGrades";
import useGradeDetail from "../../../../hooks/useGradeDetail";
import type { IGrade } from "../../../../api/gradeApi";
import gradeApi from "../../../../api/gradeApi";

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
          <Title level={4} style={{ margin: "0 0 4px 0", fontWeight: 700, color: "#1f2937" }}>
            📊 Bảng điểm cá nhân
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Theo dõi toàn bộ điểm số các bài tập, kỳ thi và đánh giá chuyên cần trong lớp học.
          </Text>
        </div>

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
