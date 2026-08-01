// Quy tắc hiển thị danh sách thông báo: nhóm theo mốc thời gian, thống kê, lọc/sắp xếp.
//
// Tách khỏi useNotifications để kiểm được mà không cần dựng React lẫn socket.
import type {
  INotificationItem,
  NotificationFilterOptions,
  NotificationStats,
} from "../../types/studentNotification";

export const DEFAULT_NOTIFICATION_FILTERS: NotificationFilterOptions = {
  searchQuery: "",
  category: "all",
  sortBy: "newest",
};

const DAY_MS = 1000 * 60 * 60 * 24;

/** Thứ tự hiển thị các nhóm trên bảng tin. */
export const GROUP_ORDER = ["Hôm nay", "Hôm qua", "7 ngày trước", "Tháng này", "Cũ hơn"] as const;

/**
 * Nhóm thời gian của một thông báo.
 *
 * `now` là tham số chứ không đọc Date.now() bên trong: hàm thuần thì test mới cố định được
 * mốc thời gian, thay vì phải giả lập đồng hồ hệ thống.
 */
export const resolveDateGroup = (
  createdAt: string | undefined,
  now: number
): INotificationItem["dateGroup"] => {
  const created = createdAt ? new Date(createdAt).getTime() : now;
  const diffDays = Math.floor((now - created) / DAY_MS);

  if (diffDays === 0) return "Hôm nay";
  if (diffDays === 1) return "Hôm qua";
  if (diffDays <= 7) return "7 ngày trước";
  if (diffDays <= 30) return "Tháng này";
  return "Cũ hơn";
};

export const enrichNotifications = (
  items: INotificationItem[],
  now: number = Date.now()
): INotificationItem[] =>
  items.map((item) => ({ ...item, dateGroup: resolveDateGroup(item.createdAt, now) }));

export const computeNotificationStats = (items: INotificationItem[]): NotificationStats => {
  let unread = 0;
  let read = 0;
  let todayCount = 0;
  let thisWeekCount = 0;

  for (const item of items) {
    if (item.isRead) read += 1;
    else unread += 1;

    if (item.dateGroup === "Hôm nay") todayCount += 1;
    if (
      item.dateGroup === "Hôm nay" ||
      item.dateGroup === "Hôm qua" ||
      item.dateGroup === "7 ngày trước"
    ) {
      thisWeekCount += 1;
    }
  }

  return { total: items.length, unread, read, todayCount, thisWeekCount };
};

/** Trả về mảng MỚI. Dữ liệu gốc nằm trong cache React Query, không được sắp xếp tại chỗ. */
export const filterAndSortNotifications = (
  items: INotificationItem[],
  filters: NotificationFilterOptions
): INotificationItem[] => {
  const q = filters.searchQuery.toLowerCase().trim();

  return items
    .filter((item) => {
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        !!item.className?.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // "unread"/"read" lọc theo trạng thái đọc; các giá trị còn lại lọc theo loại thông báo.
      if (filters.category === "unread") return !item.isRead;
      if (filters.category === "read") return item.isRead;
      if (filters.category !== "all") return item.category === filters.category;
      return true;
    })
    .sort((a, b) => {
      // Sắp theo "quan trọng" thì ưu tiên cao được đẩy lên trước, phần còn lại vẫn theo thời gian.
      if (filters.sortBy === "important") {
        if (a.priority === "high" && b.priority !== "high") return -1;
        if (a.priority !== "high" && b.priority === "high") return 1;
      }
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return filters.sortBy === "oldest" ? timeA - timeB : timeB - timeA;
    });
};

/** Gom theo nhóm thời gian, giữ thứ tự GROUP_ORDER và bỏ nhóm rỗng. */
export const groupByDate = (
  items: INotificationItem[]
): { groupTitle: string; items: INotificationItem[] }[] => {
  const map = new Map<string, INotificationItem[]>(GROUP_ORDER.map((g) => [g, []]));

  for (const item of items) {
    const key = item.dateGroup || "Cũ hơn";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }

  return Array.from(map.entries())
    .filter(([, group]) => group.length > 0)
    .map(([groupTitle, group]) => ({ groupTitle, items: group }));
};
