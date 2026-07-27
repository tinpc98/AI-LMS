import React from "react";
import { Button } from "antd";
import EmptyState from "../../../common/EmptyState";

interface ExamEmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export const ExamEmptyState: React.FC<ExamEmptyStateProps> = React.memo(
  ({ isFiltered = false, onResetFilters }) => {
    return (
      <EmptyState
        title={isFiltered ? "Không tìm thấy bài kiểm tra phù hợp" : "Hiện chưa có bài kiểm tra nào"}
        description={
          isFiltered
            ? "Vui lòng thử lại với từ khóa tìm kiếm hoặc bộ lọc trạng thái khác."
            : "Giảng viên chưa đăng tải hoặc mở bài kiểm tra nào cho lớp học này."
        }
        action={
          isFiltered && onResetFilters ? (
            <Button type="primary" onClick={onResetFilters} style={{ borderRadius: 8 }}>
              Đặt lại bộ lọc
            </Button>
          ) : undefined
        }
        style={{ padding: "48px 0" }}
      />
    );
  }
);

ExamEmptyState.displayName = "ExamEmptyState";

export default ExamEmptyState;
