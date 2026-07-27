import { useState, useCallback } from "react";
import type { IGradeItem } from "../types/studentGrade";

export function useGradeDetail() {
  const [selectedGrade, setSelectedGrade] = useState<IGradeItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openDetail = useCallback((item: IGradeItem) => {
    setSelectedGrade(item);
    setIsDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedGrade(null);
  }, []);

  return {
    selectedGrade,
    isDetailOpen,
    openDetail,
    closeDetail,
  };
}

export default useGradeDetail;
