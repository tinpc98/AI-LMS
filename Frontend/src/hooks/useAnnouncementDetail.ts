import { useState, useCallback } from "react";
import type { IExtendedAnnouncement } from "../types/studentAnnouncement";

export function useAnnouncementDetail(onMarkAsRead?: (id: string) => void) {
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<IExtendedAnnouncement | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openDetail = useCallback(
    (item: IExtendedAnnouncement) => {
      setSelectedAnnouncement(item);
      setIsDetailOpen(true);
      if (onMarkAsRead) {
        onMarkAsRead(item._id);
      }
    },
    [onMarkAsRead]
  );

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedAnnouncement(null);
  }, []);

  return {
    selectedAnnouncement,
    isDetailOpen,
    openDetail,
    closeDetail,
  };
}

export default useAnnouncementDetail;
