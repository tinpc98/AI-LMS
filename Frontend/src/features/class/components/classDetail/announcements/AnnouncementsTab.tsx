import React from "react";
import { Typography, Space, Button, Tag, Badge } from "antd";
import { CheckOutlined } from "@ant-design/icons";
import AnnouncementToolbar from "./AnnouncementToolbar";
import AnnouncementFeed from "./AnnouncementFeed";
import AnnouncementEmptyState from "./AnnouncementEmptyState";
import AnnouncementLoadingSkeleton from "./AnnouncementLoadingSkeleton";
import SharedAnnouncementDetailModal from "../../../../announcement/components/SharedAnnouncementDetailModal";
import useStudentAnnouncements from "../../../../announcement/hooks/useStudentAnnouncements";
import useAnnouncementDetail from "../../../../announcement/hooks/useAnnouncementDetail";
import type { IAnnouncement } from "../../../../../api/announcementApi";

const { Title, Text } = Typography;
const { CheckableTag } = Tag;

interface AnnouncementsTabProps {
  rawAnnouncements?: IAnnouncement[];
  loading?: boolean;
}

export const AnnouncementsTab: React.FC<AnnouncementsTabProps> = React.memo(
  ({ rawAnnouncements = [], loading = false }) => {
    // Custom Hooks
    const {
      filters,
      stats,
      groupedAnnouncements,
      markAsRead,
      markAllAsRead,
      handleSearchChange,
      handleFilterTypeChange,
      handleSortChange,
    } = useStudentAnnouncements(rawAnnouncements);

    const { selectedAnnouncement, isDetailOpen, openDetail, closeDetail } =
      useAnnouncementDetail(markAsRead);

    const isFiltered = filters.searchQuery.trim() !== "" || filters.filterType !== "all";

    return (
      <div style={{ padding: "8px 0" }}>
        {/* 1. Header Banner */}
        <div style={{ marginBottom: 24 }}>
          <Title level={4} style={{ margin: "0 0 4px 0", fontWeight: 700, color: "var(--color-text-title)" }}>
            📢 Thông báo lớp học
          </Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Theo dõi tin tức, thông báo ghim, lịch học và cập nhật mới nhất từ giảng viên.
          </Text>
        </div>

        {/* 2. Toolbar (Search, Filter, Sort) */}
        <AnnouncementToolbar
          searchQuery={filters.searchQuery}
          filterType={filters.filterType}
          sortBy={filters.sortBy}
          onSearchChange={handleSearchChange}
          onFilterTypeChange={handleFilterTypeChange}
          onSortChange={handleSortChange}
        />

        {/* 3. Filter Chips & Mark All Read */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <Space size={8}>
            <CheckableTag
              checked={filters.filterType === "all"}
              onChange={() => handleFilterTypeChange("all")}
              style={{ border: "1px solid var(--color-border-default)", padding: "4px 12px", borderRadius: 16 }}
            >
              Tất cả ({stats.total})
            </CheckableTag>
            <CheckableTag
              checked={filters.filterType === "unread"}
              onChange={() => handleFilterTypeChange("unread")}
              style={{ border: "1px solid var(--color-border-default)", padding: "4px 12px", borderRadius: 16 }}
            >
              Chưa đọc {stats.unread > 0 && <Badge count={stats.unread} style={{ backgroundColor: 'var(--color-action-primary-bg)', marginLeft: 4, transform: 'scale(0.8)' }} />}
            </CheckableTag>
            <CheckableTag
              checked={filters.filterType === "pinned"}
              onChange={() => handleFilterTypeChange("pinned")}
              style={{ border: "1px solid var(--color-border-default)", padding: "4px 12px", borderRadius: 16 }}
            >
              Đã ghim ({stats.pinned})
            </CheckableTag>
          </Space>

          {stats.unread > 0 && (
            <Button
              type="text"
              size="small"
              icon={<CheckOutlined />}
              onClick={markAllAsRead}
              style={{ color: "var(--color-action-primary-base)", fontWeight: 500 }}
            >
              Đánh dấu tất cả đã đọc
            </Button>
          )}
        </div>

        {/* 4. Content Box: Loading / Empty / Activity Feed */}
        {loading ? (
          <AnnouncementLoadingSkeleton count={6} />
        ) : groupedAnnouncements.length === 0 ? (
          <AnnouncementEmptyState
            isFiltered={isFiltered}
            onResetFilters={() => {
              handleSearchChange("");
              handleFilterTypeChange("all");
            }}
          />
        ) : (
          <AnnouncementFeed groups={groupedAnnouncements} onDetail={openDetail} onMarkAsRead={markAsRead} />
        )}

        {/* 5. Announcement Detail Modal */}
        <SharedAnnouncementDetailModal
          open={isDetailOpen}
          item={selectedAnnouncement}
          onClose={closeDetail}
        />
      </div>
    );
  }
);

AnnouncementsTab.displayName = "AnnouncementsTab";

export default AnnouncementsTab;
