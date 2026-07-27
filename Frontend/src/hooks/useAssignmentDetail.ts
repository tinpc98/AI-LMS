import { useState, useCallback } from "react";
import type { IExtendedAssignment } from "../types/studentAssignment";

export function useAssignmentDetail() {
  const [selectedAssignment, setSelectedAssignment] = useState<IExtendedAssignment | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  const openDetail = useCallback((item: IExtendedAssignment) => {
    setSelectedAssignment(item);
    setIsDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setSelectedAssignment(null);
  }, []);

  return {
    selectedAssignment,
    isDetailOpen,
    openDetail,
    closeDetail,
  };
}

export default useAssignmentDetail;
