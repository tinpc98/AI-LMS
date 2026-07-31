import React from "react";
import { Typography } from "antd";
import AnnouncementStatistic from "./AnnouncementStatistic";
import AnnouncementToolbar from "./AnnouncementToolbar";
import AnnouncementFeed from "./AnnouncementFeed";
import AnnouncementEmptyState from "./AnnouncementEmptyState";
import AnnouncementLoadingSkeleton from "./AnnouncementLoadingSkeleton";
import AnnouncementDetailDrawer from "./AnnouncementDetailDrawer";
import useStudentAnnouncements from "../../../../hooks/useStudentAnnouncements";
import useAnnouncementDetail from "../../../../hooks/useAnnouncementDetail";
import type { IAnnouncement } from "../../../../api/announcementApi";

const { Title, Text } = Typography;

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
      handleSearchChange,
      handleFilterTypeChange,
      handleSortChange,
    } = useStudentAnnouncements(rawAnnouncements);

    const { selectedAnnouncement, isDetailOpen, openDetail, closeDetail } =
      useAnnouncementDetail(markAsRead);

    const isFiltered = filters.searchQuery.trim() !== "" || filters.filterType !== "all";

    return (
      <div style={{ padding: "8px 0" }}>
        {/* 1. Header Banner & Stats Section */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <Title level={4} style={{ margin: "0 0 4px 0", fontWeight: 700, color: "#1f2937" }}>
              📢 Thông báo lớp học (Activity Feed)
            </Title>
            <Text type="secondary" style={{ fontSize: 13 }}>
              Theo dõi tin tức, thông báo ghim, lịch học và cập nhật mới nhất từ giảng viên.
            </Text>
          </div>

          {/* 4 Statistic Cards */}
          <AnnouncementStatistic stats={stats} />
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

        {/* 3. Content Box: Loading / Empty / Activity Feed */}
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
          <AnnouncementFeed groups={groupedAnnouncements} onDetail={openDetail} />
        )}

        {/* 4. Announcement Detail Drawer */}
        <AnnouncementDetailDrawer
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
