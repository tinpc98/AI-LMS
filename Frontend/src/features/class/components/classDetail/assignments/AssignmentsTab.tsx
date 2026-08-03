import React from "react";
import { Typography } from "antd";
import AssignmentStatistic from "./AssignmentStatistic";
import AssignmentToolbar from "./AssignmentToolbar";
import AssignmentList from "./AssignmentList";
import AssignmentEmptyState from "./AssignmentEmptyState";
import AssignmentLoadingSkeleton from "./AssignmentLoadingSkeleton";
import AssignmentDetailDrawer from "./AssignmentDetailDrawer";
import SubmitAssignmentModal from "../../../../assignment/components/SubmitAssignmentModal";
import useAssignments from "../../../../assignment/hooks/useAssignments";
import useAssignmentDetail from "../../../../assignment/hooks/useAssignmentDetail";
import useSubmission from "../../../../assignment/hooks/useSubmission";
import type { IAssignment, ISubmission } from "../../../../../interface/assignmentInterface";

const { Title, Text } = Typography;

interface AssignmentsTabProps {
  assignments?: IAssignment[];
  submittedIds?: string[];
  submissionsMap?: Record<string, ISubmission>;
  loading?: boolean;
  onRefresh?: () => void;
}

export const AssignmentsTab: React.FC<AssignmentsTabProps> = React.memo(
  ({ assignments = [], submittedIds = [], submissionsMap = {}, loading = false, onRefresh }) => {
    // Custom Hooks
    const {
      filters,
      stats,
      filteredAssignments,
      handleSearchChange,
      handleStatusFilterChange,
      handleSortChange,
    } = useAssignments(assignments, submittedIds, submissionsMap);

    const { selectedAssignment, isDetailOpen, openDetail, closeDetail } = useAssignmentDetail();

    const {
      submittingAssignment,
      isSubmitModalOpen,
      openSubmitModal,
      closeSubmitModal,
      handleCancelSubmission,
    } = useSubmission(onRefresh);

    const isFiltered = filters.searchQuery.trim() !== "" || filters.statusFilter !== "all";

    return (
      <div style={{ padding: "8px 0" }}>
        {/* 1. Header Banner & Stats Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: "0 0 4px 0", fontWeight: 700, color: "var(--color-text-title)" }}>
              📝 Bài tập của tôi
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Theo dõi danh sách bài tập, thời hạn nộp bài, trạng thái và điểm số cá nhân.
            </Text>
          </div>

          {/* 5 Statistic Cards */}
          <AssignmentStatistic stats={stats} />
        </div>

        {/* 2. Toolbar (Search, Filter, Sort) */}
        <AssignmentToolbar
          searchQuery={filters.searchQuery}
          statusFilter={filters.statusFilter}
          sortBy={filters.sortBy}
          onSearchChange={handleSearchChange}
          onStatusFilterChange={handleStatusFilterChange}
          onSortChange={handleSortChange}
        />

        {/* 3. Content Box: Loading / Empty / Assignment List */}
        {loading ? (
          <AssignmentLoadingSkeleton count={8} />
        ) : filteredAssignments.length === 0 ? (
          <AssignmentEmptyState
            isFiltered={isFiltered}
            onResetFilters={() => {
              handleSearchChange("");
              handleStatusFilterChange("all");
            }}
          />
        ) : (
          <AssignmentList
            assignments={filteredAssignments}
            onDetail={openDetail}
            onSubmit={openSubmitModal}
            onFeedback={openDetail}
            onCancelSubmission={handleCancelSubmission}
          />
        )}

        {/* 4. Assignment Detail Drawer */}
        <AssignmentDetailDrawer
          open={isDetailOpen}
          item={selectedAssignment}
          onClose={closeDetail}
          onSubmit={openSubmitModal}
          onCancelSubmission={handleCancelSubmission}
        />

        {/* 5. Submit Assignment Modal */}
        <SubmitAssignmentModal
          isOpen={isSubmitModalOpen}
          onClose={closeSubmitModal}
          assignment={submittingAssignment as any}
          onSuccess={(id) => {
            closeSubmitModal();
            if (onRefresh) onRefresh();
          }}
        />
      </div>
    );
  }
);

AssignmentsTab.displayName = "AssignmentsTab";

export default AssignmentsTab;
