import React from "react";
import EmptyState from "../../common/EmptyState";

interface EmptyClassStateProps {
  isFiltered?: boolean;
  onResetFilters?: () => void;
}

export const EmptyClassState: React.FC<EmptyClassStateProps> = React.memo(
  ({ isFiltered = false, onResetFilters }) => {
    if (isFiltered) {
      return (
        <EmptyState
          description="Không tìm thấy lớp học nào phù hợp với bộ lọc của bạn."
          actionText="Xóa bộ lọc"
          onAction={onResetFilters}
          style={{ marginTop: 24 }}
        />
      );
    }

    return (
      <EmptyState
        description="Bạn chưa được phân vào lớp học nào. Vui lòng liên hệ Giáo vụ hoặc Admin để được xếp lớp."
        style={{ marginTop: 24 }}
      />
    );
  }
);

EmptyClassState.displayName = "EmptyClassState";

export default EmptyClassState;
