import { useState, useCallback } from "react";
import type { IExtendedAttendanceRecord } from "../../../types/studentAttendance";

export function useAttendanceSummary() {
  const [selectedRecord, setSelectedRecord] = useState<IExtendedAttendanceRecord | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openDetail = useCallback((item: IExtendedAttendanceRecord) => {
    setSelectedRecord(item);
    setIsDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedRecord(null);
  }, []);

  return {
    selectedRecord,
    isDetailOpen,
    openDetail,
    closeDetail,
  };
}

export default useAttendanceSummary;
