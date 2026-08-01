// Thông báo của người dùng đang đăng nhập.
//
// CHUYỂN SANG REACT QUERY (Wave 5, nhóm A) — chỗ tinh vi nhất trong nhóm vì trộn ba nguồn ghi
// vào cùng một danh sách: tải lần đầu từ API, socket đẩy thông báo mới về, và người dùng đánh
// dấu đã đọc.
//
// Cách làm: cache của React Query là NGUỒN SỰ THẬT DUY NHẤT. Socket và các thao tác đánh dấu
// ghi thẳng vào cache bằng setQueryData thay vì giữ bản sao riêng trong useState.
//
// BỎ HẲN state unreadCount. Bản cũ duy trì nó bằng tay ở ba nơi: lúc tải thì đếm lại, socket
// về thì +1, đánh dấu đã đọc thì -1. Ba nguồn sửa một con số là công thức để nó lệch khỏi
// danh sách — và lệch rồi thì không có gì kéo nó về. Nó vốn được tính từ chính danh sách đó
// (data.filter(n => !n.isRead).length), nên suy ra lúc render là tương đương tuyệt đối, mà
// không thể lệch.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../../shared/api/queryKeys";
import { io, Socket } from "socket.io-client";
import notificationApi, { mapNotificationItem } from "../../../api/notificationApi";
import { toast } from "../../../utils/toast";
import type {
  INotificationItem,
  NotificationFilterOptions,
} from "../../../types/studentNotification";
import {
  DEFAULT_NOTIFICATION_FILTERS,
  computeNotificationStats,
  enrichNotifications,
  filterAndSortNotifications,
  groupByDate,
} from "../notification.logic";

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

// Socket dùng chung cho mọi nơi gọi hook: mở một kết nối, đếm số người đăng ký, người cuối
// cùng rời đi thì đóng.
let globalSocket: Socket | null = null;
let globalSocketSubscribers = 0;

const notificationQueryKey = queryKeys.notification.list;

export function useNotifications() {
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  const {
    data: notifications = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: notificationQueryKey,
    queryFn: notificationApi.getNotifications,
  });

  const [filters, setFilters] = useState<NotificationFilterOptions>(DEFAULT_NOTIFICATION_FILTERS);

  /** Sửa danh sách trong cache. Mọi cập nhật cục bộ đều đi qua đây. */
  const updateCache = useCallback(
    (updater: (prev: INotificationItem[]) => INotificationItem[]) => {
      queryClient.setQueryData<INotificationItem[]>(notificationQueryKey, (prev) =>
        updater(prev ?? [])
      );
    },
    [queryClient]
  );

  // Kết nối socket và lắng nghe thông báo mới.
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;

    if (!globalSocket) {
      globalSocket = io(SOCKET_URL, {
        auth: { token: `Bearer ${token}` },
        transports: ["websocket", "polling"],
        reconnection: true,
      });
    }

    globalSocketSubscribers += 1;
    socketRef.current = globalSocket;

    const handleNewNotification = (raw: unknown) => {
      const item = mapNotificationItem(raw);
      updateCache((prev) =>
        // Máy chủ có thể gửi lại cùng một thông báo khi kết nối lại — bỏ qua bản trùng.
        prev.some((n) => n._id === item._id) ? prev : [item, ...prev]
      );
    };

    globalSocket.on("notification:new", handleNewNotification);

    return () => {
      if (!globalSocket) return;
      globalSocket.off("notification:new", handleNewNotification);
      globalSocketSubscribers -= 1;
      if (globalSocketSubscribers <= 0) {
        globalSocket.disconnect();
        globalSocket = null;
      }
    };
  }, [updateCache]);

  const enriched = useMemo(() => enrichNotifications(notifications), [notifications]);
  const stats = useMemo(() => computeNotificationStats(enriched), [enriched]);
  const filteredNotifications = useMemo(
    () => filterAndSortNotifications(enriched, filters),
    [enriched, filters]
  );
  const groupedNotifications = useMemo(
    () => groupByDate(filteredNotifications),
    [filteredNotifications]
  );

  const markAsRead = useCallback(
    async (id: string) => {
      const target = notifications.find((n) => n._id === id);
      if (!target || target.isRead) return; // đã đọc rồi thì khỏi gọi API

      try {
        await notificationApi.markAsRead(id);
        updateCache((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
      } catch (err: unknown) {
        console.error("[useNotifications] markAsRead error:", err);
        toast.error(
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
            "Không thể cập nhật trạng thái thông báo."
        );
      }
    },
    [notifications, updateCache]
  );

  const markAllAsRead = useCallback(async () => {
    if (!notifications.some((n) => !n.isRead)) return;

    try {
      await notificationApi.markAllAsRead();
      updateCache((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err: unknown) {
      console.error("[useNotifications] markAllAsRead error:", err);
      toast.error(
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          "Không thể đánh dấu tất cả thông báo."
      );
    }
  }, [notifications, updateCache]);

  const updateFilter = useCallback(
    <K extends keyof NotificationFilterOptions>(key: K, value: NotificationFilterOptions[K]) =>
      setFilters((prev) => ({ ...prev, [key]: value })),
    []
  );

  const handleSearchChange = useCallback(
    (value: string) => updateFilter("searchQuery", value),
    [updateFilter]
  );
  const handleCategoryChange = useCallback(
    (value: NotificationFilterOptions["category"]) => updateFilter("category", value),
    [updateFilter]
  );
  const handleSortChange = useCallback(
    (value: NotificationFilterOptions["sortBy"]) => updateFilter("sortBy", value),
    [updateFilter]
  );

  return {
    notifications,
    // Suy từ danh sách, không còn là state riêng — xem ghi chú đầu file.
    unreadCount: stats.unread,
    loading: isLoading,
    filters,
    stats,
    filteredNotifications,
    groupedNotifications,
    fetchNotifications: refetch,
    markAsRead,
    markAllAsRead,
    handleSearchChange,
    handleCategoryChange,
    handleSortChange,
  };
}

export default useNotifications;
