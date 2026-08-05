import { useState, useMemo, useCallback } from "react";
import { toast } from "../../../utils/toast";
import { classifyResource } from "../utils/resourceUtils";
import type {
  ILearningMaterial,
  MaterialFilterOptions,
  MaterialStats,
} from "../../../types/learningMaterial";

export function useLearningMaterials(initialResources: ILearningMaterial[] = []) {
  // Filter & Sort State
  const [filters, setFilters] = useState<MaterialFilterOptions>({
    searchQuery: "",
    typeFilter: "all",
    sortBy: "newest",
  });

  // Modal & Drawer State
  const [previewItem, setPreviewItem] = useState<ILearningMaterial | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [detailItem, setDetailItem] = useState<ILearningMaterial | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Compute Statistics
  const stats: MaterialStats = useMemo(() => {
    const total = initialResources.length;
    let pdf = 0;
    let video = 0;
    let link = 0;
    let slide = 0;
    let other = 0;

    initialResources.forEach((item) => {
      const meta = classifyResource(item);
      if (meta.kind === "pdf") {
        pdf++;
      } else if (meta.kind === "video" || meta.kind === "youtube") {
        video++;
      } else if (meta.kind === "slide") {
        slide++;
      } else if (meta.kind === "link") {
        link++;
      } else {
        other++;
      }
    });

    return { total, pdf, video, link, slide, other };
  }, [initialResources]);

  // Filter & Sort Logic
  const filteredMaterials = useMemo(() => {
    let result = [...initialResources];

    // 1. Search Query
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) => m.title.toLowerCase().includes(q) || (m.description || "").toLowerCase().includes(q)
      );
    }

    // 2. Type Filter
    if (filters.typeFilter !== "all") {
      const targetType = filters.typeFilter.toLowerCase();
      result = result.filter((m) => {
        const meta = classifyResource(m);
        if (targetType === "pdf") return meta.kind === "pdf";
        if (targetType === "video") return meta.kind === "video" || meta.kind === "youtube";
        if (targetType === "link") return meta.kind === "link";
        if (targetType === "slide") return meta.kind === "slide";
        if (targetType === "document") return meta.kind === "docx" || meta.kind === "pdf";
        return meta.kind === targetType || (m.type || "").toLowerCase() === targetType;
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      if (filters.sortBy === "newest") {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return dateB - dateA;
      }
      if (filters.sortBy === "oldest") {
        const dateA = a.uploadedAt ? new Date(a.uploadedAt).getTime() : 0;
        const dateB = b.uploadedAt ? new Date(b.uploadedAt).getTime() : 0;
        return dateA - dateB;
      }
      if (filters.sortBy === "name_asc") {
        return a.title.localeCompare(b.title, "vi");
      }
      if (filters.sortBy === "name_desc") {
        return b.title.localeCompare(a.title, "vi");
      }
      return 0;
    });

    return result;
  }, [initialResources, filters]);

  // Handlers
  const handleSearchChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, searchQuery: value }));
  }, []);

  const handleTypeChange = useCallback((value: string) => {
    setFilters((prev) => ({ ...prev, typeFilter: value }));
  }, []);

  const handleSortChange = useCallback((value: MaterialFilterOptions["sortBy"]) => {
    setFilters((prev) => ({ ...prev, sortBy: value }));
  }, []);

  const openPreview = useCallback((item: ILearningMaterial) => {
    setPreviewItem(item);
    setIsPreviewOpen(true);
  }, []);

  const closePreview = useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewItem(null);
  }, []);

  const openDetail = useCallback((item: ILearningMaterial) => {
    setDetailItem(item);
    setIsDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setIsDetailOpen(false);
    setDetailItem(null);
  }, []);

  const handleCopyLink = useCallback((url: string) => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    toast.success("Đã sao chép đường dẫn tài liệu!", "Sao chép link");
  }, []);

  const handleDownload = useCallback((item: ILearningMaterial) => {
    if (!item.url || (!item.url.startsWith("http://") && !item.url.startsWith("https://"))) {
      toast.error("Tài liệu không có đường dẫn URL hợp lệ (chỉ hỗ trợ http/https).", "Lỗi tải về");
      return;
    }
    window.open(item.url, "_blank", "noopener,noreferrer");
    toast.info(`Đang mở tải về "${item.title}"`, "Tải tài liệu");
  }, []);

  return {
    filters,
    stats,
    filteredMaterials,
    handleSearchChange,
    handleTypeChange,
    handleSortChange,
    previewItem,
    isPreviewOpen,
    openPreview,
    closePreview,
    detailItem,
    isDetailOpen,
    openDetail,
    closeDetail,
    handleCopyLink,
    handleDownload,
  };
}

export default useLearningMaterials;
