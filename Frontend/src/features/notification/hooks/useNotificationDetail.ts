import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import type { INotificationItem } from "../../../types/studentNotification";

export function useNotificationDetail(onMarkAsRead?: (id: string) => void) {
  const [selectedNotification, setSelectedNotification] = useState<INotificationItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const openDrawer = useCallback(
    (item: INotificationItem) => {
      setSelectedNotification(item);
      setIsDrawerOpen(true);
      if (onMarkAsRead && !item.isRead) {
        onMarkAsRead(item._id);
      }
    },
    [onMarkAsRead]
  );

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    setSelectedNotification(null);
  }, []);

  const navigateToTarget = useCallback(
    (targetRoute?: string) => {
      if (!targetRoute) return;
      setIsDrawerOpen(false);
      navigate(targetRoute);
    },
    [navigate]
  );

  return {
    selectedNotification,
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    navigateToTarget,
  };
}

export default useNotificationDetail;
