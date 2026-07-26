import React from "react";
import { Button } from "antd";
import EmptyState from "../../../common/EmptyState";

interface GradeEmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export const GradeEmptyState: React.FC<GradeEmptyStateProps> = React.memo(
  ({ isFiltered = false, onResetFilters }) => {
    return (
      <EmptyState
        title={isFiltered ? "Không tìm thấy kết quả phù hợp" : "Hiện chưa có kết quả học tập"}
        description={
          isFiltered
            ? "Vui lòng thử lại với từ khóa tìm kiếm hoặc bộ lọc danh mục khác."
            : "Chưa có đầu điểm nào được ghi nhận cho tài khoản của bạn trong lớp học này."
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

GradeEmptyState.displayName = "GradeEmptyState";

export default GradeEmptyState;
