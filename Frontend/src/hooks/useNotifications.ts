import { useState, useEffect, useMemo, useCallback } from "react";
import notificationApi from "../api/notificationApi";
import { toast } from "../utils/toast";
import type {
  INotificationItem,
  NotificationFilterOptions,
  NotificationStats,
} from "../types/studentNotification";

export function useNotifications() {
  const [notifications, setNotifications] = useState<INotificationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [filters, setFilters] = useState<NotificationFilterOptions>({
    searchQuery: "",
    category: "all",
    sortBy: "newest",
  });

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const data = await notificationApi.getNotifications();
      setNotifications(data);
    } catch (err) {
      console.warn("Không thể tải thông báo từ API:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Enrich notifications with Date Group
  const enrichedNotifications: INotificationItem[] = useMemo(() => {
    const now = Date.now();

    return notifications.map((item) => {
      const createdTime = item.createdAt ? new Date(item.createdAt).getTime() : now;
      const diffDays = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24));

      let dateGroup: INotificationItem["dateGroup"] = "Cũ hơn";
      if (diffDays === 0) dateGroup = "Hôm nay";
      else if (diffDays === 1) dateGroup = "Hôm qua";
      else if (diffDays <= 7) dateGroup = "7 ngày trước";
      else if (diffDays <= 30) dateGroup = "Tháng này";

      return {
        ...item,
        dateGroup,
      };
    });
  }, [notifications]);

  // Calculate 5 Statistic Metrics
  const stats: NotificationStats = useMemo(() => {
    const total = enrichedNotifications.length;
    let unread = 0;
    let read = 0;
    let todayCount = 0;
    let thisWeekCount = 0;

    enrichedNotifications.forEach((item) => {
      if (item.isRead) read++;
      else unread++;

      if (item.dateGroup === "Hôm nay") todayCount++;
      if (item.dateGroup === "Hôm nay" || item.dateGroup === "Hôm qua" || item.dateGroup === "7 ngày trước") {
        thisWeekCount++;
      }
    });

    return { total, unread, read, todayCount, thisWeekCount };
  }, [enrichedNotifications]);

  // Filter & Sort
  const filteredNotifications = useMemo(() => {
    let result = [...enrichedNotifications];

    // Search query filter
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.className && item.className.toLowerCase().includes(q))
      );
    }

    // Category filter
    if (filters.category === "unread") {
      result = result.filter((item) => !item.isRead);
    } else if (filters.category === "read") {
      result = result.filter((item) => item.isRead);
    } else if (filters.category !== "all") {
      result = result.filter((item) => item.category === filters.category);
    }

    // Sort
    result.sort((a, b) => {
      // High priority items first if sorting by important
      if (filters.sortBy === "important") {
        if (a.priority === "high" && b.priority !== "high") return -1;
        if (a.priority !== "high" && b.priority === "high") return 1;
      }

      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (filters.sortBy === "oldest") return timeA - timeB;
      return timeB - timeA; // newest default
    });

    return result;
  }, [enrichedNotifications, filters]);

  // Group notifications by Date Group for Activity Feed
  const groupedNotifications = useMemo(() => {
    const map = new Map<string, INotificationItem[]>();
    const groupsOrder = ["Hôm nay", "Hôm qua", "7 ngày trước", "Tháng này", "Cũ hơn"];

    groupsOrder.forEach((g) => map.set(g, []));

    filteredNotifications.forEach((item) => {
      const g = item.dateGroup || "Cũ hơn";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(item);
    });

    // Remove empty groups
    const result: { groupTitle: string; items: INotificationItem[] }[] = [];
    map.forEach((items, groupTitle) => {
      if (items.length > 0) {
        result.push({ groupTitle, items });
      }
    });

    return result;
  }, [filteredNotifications]);

  // Handlers
  const markAsRead = useCallback(async (id: string) => {
    const targetItem = notifications.find((n) => n._id === id);
    if (!targetItem || targetItem.isRead) return; // Không gọi lại API nếu thông báo đã đọc

    try {
      await notificationApi.markAsRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item._id === id ? { ...item, isRead: true } : item))
      );
    } catch (err: any) {
      console.error("[useNotifications] markAsRead error:", err);
      toast.error(err.response?.data?.message || "Không thể cập nhật trạng thái thông báo.");
    }
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    const hasUnread = notifications.some((n) => !n.isRead);
    if (!hasUnread) return;

    try {
      await notificationApi.markAllAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch (err: any) {
      console.error("[useNotifications] markAllAsRead error:", err);
      toast.error(err.response?.data?.message || "Không thể đánh dấu tất cả thông báo.");
    }
  }, [notifications]);

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: value }));
  }, []);

  const handleCategoryChange = useCallback((value: NotificationFilterOptions["category"]) => {
    setFilters((prev) => ({ ...prev, category: value }));
  }, []);

  const handleSortChange = useCallback((value: NotificationFilterOptions["sortBy"]) => {
    setFilters((prev) => ({ ...prev, sortBy: value }));
  }, []);

  return {
    loading,
    filters,
    stats,
    filteredNotifications,
    groupedNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    handleSearchChange,
    handleCategoryChange,
    handleSortChange,
  };
}

export default useNotifications;
