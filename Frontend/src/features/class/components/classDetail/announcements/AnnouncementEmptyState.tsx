import React from "react";
import { Button } from "antd";
import EmptyState from "../../../../../shared/components/EmptyState";

interface AnnouncementEmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export const AnnouncementEmptyState: React.FC<AnnouncementEmptyStateProps> = React.memo(
  ({ isFiltered = false, onResetFilters }) => {
    return (
      <EmptyState
        title={isFiltered ? "Không tìm thấy thông báo phù hợp" : "Chưa có thông báo nào"}
        description={
          isFiltered
            ? "Vui lòng thử lại với từ khóa tìm kiếm hoặc bộ lọc trạng thái khác."
            : "Giảng viên chưa đăng tải thông báo nào cho lớp học này."
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

AnnouncementEmptyState.displayName = "AnnouncementEmptyState";

export default AnnouncementEmptyState;
