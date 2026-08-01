import React from "react";
import { Button } from "antd";
import EmptyState from "../../../../../shared/components/EmptyState";

interface LiveEmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export const LiveEmptyState: React.FC<LiveEmptyStateProps> = React.memo(
  ({ isFiltered = false, onResetFilters }) => {
    return (
      <EmptyState
        title={isFiltered ? "Không tìm thấy buổi học phù hợp" : "Hiện chưa có buổi học trực tuyến"}
        description={
          isFiltered
            ? "Vui lòng đặt lại bộ lọc để xem các buổi học khác."
            : "Giảng viên chưa kích hoạt hoặc lên lịch buổi học trực tuyến nào cho lớp học này."
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

LiveEmptyState.displayName = "LiveEmptyState";

export default LiveEmptyState;
