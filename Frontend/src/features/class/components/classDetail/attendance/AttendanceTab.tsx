import React from "react";
import { Typography } from "antd";
import AttendanceStatistic from "./AttendanceStatistic";
import AttendanceRateCard from "./AttendanceRateCard";
import AttendanceChart from "./AttendanceChart";
import AttendanceToolbar from "./AttendanceToolbar";
import AttendanceTable from "./AttendanceTable";
import AttendanceTimeline from "./AttendanceTimeline";
import AttendanceEmptyState from "./AttendanceEmptyState";
import AttendanceLoadingSkeleton from "./AttendanceLoadingSkeleton";
import AttendanceDetailDrawer from "./AttendanceDetailDrawer";
import useStudentAttendance from "../../../../attendance/hooks/useStudentAttendance";
import useAttendanceSummary from "../../../../attendance/hooks/useAttendanceSummary";
import type { IAttendanceItem } from "../../../../../interface/attendanceInterface";

const { Title, Text } = Typography;

interface AttendanceTabProps {
  classId: string;
}

export const AttendanceTab: React.FC<AttendanceTabProps> = React.memo(({ classId }) => {
  // Custom Hooks
  const {
    filters,
    stats,
    monthOptions,
    filteredRecords,
    handleSearchChange,
    handleMonthFilterChange,
    handleStatusFilterChange,
    handleViewModeChange,
    loading,
  } = useStudentAttendance(classId);

  const { selectedRecord, isDetailOpen, openDetail, closeDetail } = useAttendanceSummary();

  const isFiltered =
    filters.searchQuery.trim() !== "" ||
    filters.monthFilter !== "all" ||
    filters.statusFilter !== "all";

  return (
    <div style={{ padding: "8px 0" }}>
      {/* 1. Header Banner & Stats Section */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ marginBottom: 16 }}>
          <Title level={4} style={{ margin: "0 0 4px 0", fontWeight: 700, color: "#1f2937" }}>
            📅 Lịch sử điểm danh & Chuyên cần
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Theo dõi lịch sử tham gia các buổi học, tỷ lệ chuyên cần và ghi chú điểm danh từ giảng
            viên.
          </Text>
        </div>

        {/* 5 Statistic Cards */}
        <AttendanceStatistic stats={stats} />
      </div>

      {/* 2. Attendance Rate Progress Circle & Warning Banner */}
      <AttendanceRateCard stats={stats} />

      {/* 3. Distribution Chart */}
      <AttendanceChart stats={stats} />

      {/* 4. Toolbar (Search, Filter Month/Status, View Mode Toggle) */}
      <AttendanceToolbar
        searchQuery={filters.searchQuery}
        monthFilter={filters.monthFilter}
        monthOptions={monthOptions}
        statusFilter={filters.statusFilter}
        viewMode={filters.viewMode}
        onSearchChange={handleSearchChange}
        onMonthFilterChange={handleMonthFilterChange}
        onStatusFilterChange={handleStatusFilterChange}
        onViewModeChange={handleViewModeChange}
      />

      {/* 5. Content Box: Loading / Empty / Table vs Timeline */}
      {loading ? (
        <AttendanceLoadingSkeleton count={6} />
      ) : filteredRecords.length === 0 ? (
        <AttendanceEmptyState
          isFiltered={isFiltered}
          onResetFilters={() => {
            handleSearchChange("");
            handleMonthFilterChange("all");
            handleStatusFilterChange("all");
          }}
        />
      ) : filters.viewMode === "timeline" ? (
        <AttendanceTimeline records={filteredRecords} onDetail={openDetail} />
      ) : (
        <AttendanceTable records={filteredRecords} onDetail={openDetail} />
      )}

      {/* 6. Session Detail Drawer */}
      <AttendanceDetailDrawer open={isDetailOpen} item={selectedRecord} onClose={closeDetail} />
    </div>
  );
});

AttendanceTab.displayName = "AttendanceTab";

export default AttendanceTab;
