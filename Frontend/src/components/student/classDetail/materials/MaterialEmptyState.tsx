import React from "react";
import { Button } from "antd";
import EmptyState from "../../../common/EmptyState";

interface MaterialEmptyStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export const MaterialEmptyState: React.FC<MaterialEmptyStateProps> = React.memo(
  ({ isFiltered = false, onResetFilters }) => {
    return (
      <EmptyState
        title={isFiltered ? "Không tìm thấy tài liệu phù hợp" : "Chưa có tài liệu học tập"}
        description={
          isFiltered
            ? "Vui lòng thử lại với từ khóa hoặc bộ lọc loại tài liệu khác."
            : "Giáo viên chưa chia sẻ tài liệu nào cho lớp học này."
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

MaterialEmptyState.displayName = "MaterialEmptyState";

export default MaterialEmptyState;
