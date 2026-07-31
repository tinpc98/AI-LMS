import React from "react";
import PageContainer from "../../../shared/components/PageContainer";
import NotificationHeader from "../components/NotificationHeader";
import NotificationSummary from "../components/NotificationSummary";
import NotificationToolbar from "../components/NotificationToolbar";
import NotificationFeed from "../components/NotificationFeed";
import NotificationEmptyState from "../components/NotificationEmptyState";
import NotificationLoadingSkeleton from "../components/NotificationLoadingSkeleton";
import NotificationDetailDrawer from "../components/NotificationDetailDrawer";
import useNotifications from "../hooks/useNotifications";
import useNotificationDetail from "../hooks/useNotificationDetail";

export const NotificationCenterPage: React.FC = () => {
  const {
    loading,
    filters,
    stats,
    groupedNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    handleSearchChange,
    handleCategoryChange,
    handleSortChange,
  } = useNotifications();

  const { selectedNotification, isDrawerOpen, openDrawer, closeDrawer, navigateToTarget } =
    useNotificationDetail(markAsRead);

  const isFiltered = filters.searchQuery.trim() !== "" || filters.category !== "all";

  return (
    <PageContainer>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 0" }}>
        {/* 1. Page Header Bar */}
        <NotificationHeader
          unreadCount={stats.unread}
          onMarkAllAsRead={markAllAsRead}
          onRefresh={fetchNotifications}
          loading={loading}
        />

        {/* 2. 5 Statistic Cards */}
        <NotificationSummary stats={stats} />

        {/* 3. Toolbar (Search, Filter, Sort) */}
        <NotificationToolbar
          searchQuery={filters.searchQuery}
          category={filters.category}
          sortBy={filters.sortBy}
          onSearchChange={handleSearchChange}
          onCategoryChange={handleCategoryChange}
          onSortChange={handleSortChange}
        />

        {/* 4. Activity Feed List / Loading / Empty State */}
        {loading ? (
          <NotificationLoadingSkeleton count={5} />
        ) : groupedNotifications.length === 0 ? (
          <NotificationEmptyState
            isFiltered={isFiltered}
            onResetFilters={() => {
              handleSearchChange("");
              handleCategoryChange("all");
            }}
          />
        ) : (
          <NotificationFeed
            groups={groupedNotifications}
            onDetail={openDrawer}
            onNavigate={navigateToTarget}
          />
        )}

        {/* 5. Notification Detail Drawer */}
        <NotificationDetailDrawer
          open={isDrawerOpen}
          item={selectedNotification}
          onClose={closeDrawer}
          onNavigate={navigateToTarget}
        />
      </div>
    </PageContainer>
  );
};

export default NotificationCenterPage;
