import React from "react";
import { Typography } from "antd";
import ExamStatistic from "./ExamStatistic";
import ExamToolbar from "./ExamToolbar";
import ExamList from "./ExamList";
import ExamEmptyState from "./ExamEmptyState";
import ExamLoadingSkeleton from "./ExamLoadingSkeleton";
import ExamDetailDrawer from "./ExamDetailDrawer";
import ExamStartModal from "./ExamStartModal";
import ExamReviewDrawer from "./ExamReviewDrawer";
import useStudentExams from "../../../../../hooks/useStudentExams";
import useExamDetail from "../../../../../hooks/useExamDetail";
import useExamResult from "../../../../../hooks/useExamResult";
import type { IExam, IExamAttempt } from "../../../../../api/examApi";

const { Title, Text } = Typography;

interface ExamsTabProps {
  exams?: IExam[];
  attemptsMap?: Record<string, IExamAttempt>;
  loading?: boolean;
}

export const ExamsTab: React.FC<ExamsTabProps> = React.memo(
  ({ exams = [], attemptsMap = {}, loading = false }) => {
    // Custom Hooks
    const {
      filters,
      stats,
      filteredExams,
      handleSearchChange,
      handleStatusFilterChange,
      handleSortChange,
    } = useStudentExams(exams, attemptsMap);

    const {
      selectedExam,
      isDetailOpen,
      isStartModalOpen,
      openDetail,
      closeDetail,
      openStartModal,
      closeStartModal,
      handleConfirmStart,
    } = useExamDetail();

    const {
      selectedExam: reviewExam,
      reviewData,
      isReviewOpen,
      loadingReview,
      openReview,
      closeReview,
    } = useExamResult();

    const isFiltered = filters.searchQuery.trim() !== "" || filters.statusFilter !== "all";

    return (
      <div style={{ padding: "8px 0" }}>
        {/* 1. Header Banner & Stats Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: "0 0 4px 0", fontWeight: 700, color: "#1f2937" }}>
              📝 Bài kiểm tra trực tuyến
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Danh sách các bài kiểm tra, kỳ thi trắc nghiệm & tự luận được mở cho lớp học.
            </Text>
          </div>

          {/* 5 Statistic Cards */}
          <ExamStatistic stats={stats} />
        </div>

        {/* 2. Toolbar (Search, Filter, Sort) */}
        <ExamToolbar
          searchQuery={filters.searchQuery}
          statusFilter={filters.statusFilter}
          sortBy={filters.sortBy}
          onSearchChange={handleSearchChange}
          onStatusFilterChange={handleStatusFilterChange}
          onSortChange={handleSortChange}
        />

        {/* 3. Content Box: Loading / Empty / Exam List */}
        {loading ? (
          <ExamLoadingSkeleton count={8} />
        ) : filteredExams.length === 0 ? (
          <ExamEmptyState
            isFiltered={isFiltered}
            onResetFilters={() => {
              handleSearchChange("");
              handleStatusFilterChange("all");
            }}
          />
        ) : (
          <ExamList
            exams={filteredExams}
            onDetail={openDetail}
            onStart={openStartModal}
            onReview={openReview}
          />
        )}

        {/* 4. Exam Detail Drawer (Rules & Specs) */}
        <ExamDetailDrawer
          open={isDetailOpen}
          item={selectedExam}
          onClose={closeDetail}
          onStart={openStartModal}
        />

        {/* 5. Exam Start Modal Confirmation */}
        <ExamStartModal
          open={isStartModalOpen}
          item={selectedExam}
          onClose={closeStartModal}
          onConfirm={handleConfirmStart}
        />

        {/* 6. Exam Review Drawer */}
        <ExamReviewDrawer
          open={isReviewOpen}
          item={reviewExam}
          reviewData={reviewData}
          loading={loadingReview}
          onClose={closeReview}
        />
      </div>
    );
  }
);

ExamsTab.displayName = "ExamsTab";

export default ExamsTab;
