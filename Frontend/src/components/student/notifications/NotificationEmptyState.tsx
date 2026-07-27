import React from "react";
import { Button } from "antd";
import EmptyState from "../../common/EmptyState";

interface NotificationEmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export const NotificationEmptyState: React.FC<NotificationEmptyStateProps> = React.memo(
  ({ isFiltered = false, onResetFilters }) => {
    return (
      <EmptyState
        title={isFiltered ? "Không tìm thấy thông báo phù hợp" : "Bạn chưa có thông báo"}
        description={
          isFiltered
            ? "Vui lòng thử lại với từ khóa tìm kiếm hoặc bộ lọc thể loại khác."
            : "Hệ thống và giảng viên chưa có thông báo mới nào dành cho bạn."
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

NotificationEmptyState.displayName = "NotificationEmptyState";

export default NotificationEmptyState;
