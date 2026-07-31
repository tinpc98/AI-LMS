import { useState, useMemo, useCallback } from "react";
import type { IAnnouncement } from "../api/announcementApi";
import type {
  IExtendedAnnouncement,
  StudentAnnouncementFilterOptions,
  StudentAnnouncementStats,
  AnnouncementTagType,
} from "../types/studentAnnouncement";

export function useStudentAnnouncements(rawAnnouncements: IAnnouncement[] = []) {
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<StudentAnnouncementFilterOptions>({
    searchQuery: "",
    filterType: "all",
    sortBy: "newest",
  });

  // Enrich raw announcements
  const extendedAnnouncements: IExtendedAnnouncement[] = useMemo(() => {
    const now = new Date().getTime();

    return rawAnnouncements.map((item, idx) => {
      const isRead = readIds.has(item._id);
      const createdTime = item.createdAt ? new Date(item.createdAt).getTime() : now;
      const diffDays = Math.floor((now - createdTime) / (1000 * 60 * 60 * 24));

      // Date group calculation
      let dateGroup: IExtendedAnnouncement["dateGroup"] = "Cũ hơn";
      if (diffDays === 0) dateGroup = "Hôm nay";
      else if (diffDays === 1) dateGroup = "Hôm qua";
      else if (diffDays <= 7) dateGroup = "Tuần này";
      else if (diffDays <= 30) dateGroup = "Tháng này";

      // Tags calculation
      const isPinned =
        idx === 0 ||
        item.title.toLowerCase().includes("ghim") ||
        item.title.toLowerCase().includes("quan trọng");
      const isImportant =
        item.title.toLowerCase().includes("lưu ý") ||
        item.title.toLowerCase().includes("khẩn") ||
        isPinned;

      let tagType: AnnouncementTagType = "General";
      const titleLower = item.title.toLowerCase();
      if (isPinned) tagType = "Pinned";
      else if (isImportant) tagType = "Important";
      else if (titleLower.includes("bài tập") || titleLower.includes("hạn nộp"))
        tagType = "Assignment";
      else if (titleLower.includes("kiểm tra") || titleLower.includes("thi")) tagType = "Exam";
      else if (titleLower.includes("hệ thống")) tagType = "System";

      const authorName =
        typeof item.createdBy === "object" && (item.createdBy as any)?.fullName
          ? (item.createdBy as any).fullName
          : "Giảng viên";

      return {
        ...item,
        isRead,
        isPinned,
        isImportant,
        tagType,
        authorName,
        dateGroup,
      };
    });
  }, [rawAnnouncements, readIds]);

  // Compute stats
  const stats: StudentAnnouncementStats = useMemo(() => {
    const total = extendedAnnouncements.length;
    let unread = 0;
    let read = 0;
    let pinned = 0;

    extendedAnnouncements.forEach((item) => {
      if (item.isRead) read++;
      else unread++;
      if (item.isPinned) pinned++;
    });

    return { total, unread, read, pinned };
  }, [extendedAnnouncements]);

  // Mark an announcement as read
  const markAsRead = useCallback((id: string) => {
    setReadIds((prev) => new Set([...prev, id]));
  }, []);

  // Filter & Sort
  const filteredAnnouncements = useMemo(() => {
    let result = [...extendedAnnouncements];

    // Search filter
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) => item.title.toLowerCase().includes(q) || item.content.toLowerCase().includes(q)
      );
    }

    // Category filter
    if (filters.filterType === "unread") {
      result = result.filter((item) => !item.isRead);
    } else if (filters.filterType === "read") {
      result = result.filter((item) => item.isRead);
    } else if (filters.filterType === "pinned") {
      result = result.filter((item) => item.isPinned);
    } else if (filters.filterType === "this_week") {
      result = result.filter(
        (item) =>
          item.dateGroup === "Hôm nay" ||
          item.dateGroup === "Hôm qua" ||
          item.dateGroup === "Tuần này"
      );
    } else if (filters.filterType === "this_month") {
      result = result.filter((item) => item.dateGroup !== "Cũ hơn");
    }

    // Sort
    result.sort((a, b) => {
      // Pinned items always first
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;

      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      if (filters.sortBy === "newest") return timeB - timeA;
      if (filters.sortBy === "oldest") return timeA - timeB;
      if (filters.sortBy === "important") {
        if (a.isImportant && !b.isImportant) return -1;
        if (!a.isImportant && b.isImportant) return 1;
        return timeB - timeA;
      }
      return 0;
    });

    return result;
  }, [extendedAnnouncements, filters]);

  // Group filtered announcements by Date Group for Activity Feed
  const groupedAnnouncements = useMemo(() => {
    const map = new Map<string, IExtendedAnnouncement[]>();
    const groupsOrder = ["Hôm nay", "Hôm qua", "Tuần này", "Tháng này", "Cũ hơn"];

    groupsOrder.forEach((g) => map.set(g, []));

    filteredAnnouncements.forEach((item) => {
      const g = item.dateGroup || "Cũ hơn";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(item);
    });

    // Remove empty groups
    const result: { groupTitle: string; items: IExtendedAnnouncement[] }[] = [];
    map.forEach((items, groupTitle) => {
      if (items.length > 0) {
        result.push({ groupTitle, items });
      }
    });

    return result;
  }, [filteredAnnouncements]);

  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: value }));
  }, []);

  const handleFilterTypeChange = useCallback(
    (value: StudentAnnouncementFilterOptions["filterType"]) => {
      setFilters((prev) => ({ ...prev, filterType: value }));
    },
    []
  );

  const handleSortChange = useCallback((value: StudentAnnouncementFilterOptions["sortBy"]) => {
    setFilters((prev) => ({ ...prev, sortBy: value }));
  }, []);

  return {
    filters,
    stats,
    filteredAnnouncements,
    groupedAnnouncements,
    markAsRead,
    handleSearchChange,
    handleFilterTypeChange,
    handleSortChange,
  };
}

export default useStudentAnnouncements;
