import React from "react";
import { Button } from "antd";
import EmptyState from "../../../common/EmptyState";

interface AttendanceEmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export const AttendanceEmptyState: React.FC<AttendanceEmptyStateProps> = React.memo(
  ({ isFiltered = false, onResetFilters }) => {
    return (
      <EmptyState
        title={isFiltered ? "Không tìm thấy kết quả phù hợp" : "Hiện chưa có dữ liệu điểm danh"}
        description={
          isFiltered
            ? "Vui lòng thử lại với từ khóa tìm kiếm, bộ lọc tháng hoặc trạng thái khác."
            : "Giảng viên chưa tạo lượt điểm danh nào cho lớp học này."
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

AttendanceEmptyState.displayName = "AttendanceEmptyState";

export default AttendanceEmptyState;
