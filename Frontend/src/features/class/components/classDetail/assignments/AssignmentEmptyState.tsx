import React from "react";
import { Button } from "antd";
import EmptyState from "../../../../../shared/components/EmptyState";

interface AssignmentEmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export const AssignmentEmptyState: React.FC<AssignmentEmptyStateProps> = React.memo(
  ({ isFiltered = false, onResetFilters }) => {
    return (
      <EmptyState
        title={isFiltered ? "Không tìm thấy bài tập phù hợp" : "Hiện chưa có bài tập nào"}
        description={
          isFiltered
            ? "Vui lòng thử lại với từ khóa tìm kiếm hoặc bộ lọc trạng thái khác."
            : "Giảng viên chưa đăng tải bài tập nào cho lớp học này."
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

AssignmentEmptyState.displayName = "AssignmentEmptyState";

export default AssignmentEmptyState;
