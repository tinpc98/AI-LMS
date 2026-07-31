import { useState, useEffect, useCallback, useMemo } from "react";
import axiosClient from "../../../api/axiosClient";
import { toast } from "../../../utils/toast";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

export function useQuestionBank() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Toolbar states
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get("/api/questions");
      setQuestions(response.data.data || []);
    } catch (err: unknown) {
      console.error("[useQuestionBank] Fetch error:", err);
      setError(getApiErrorMessage(err, "Không thể tải danh sách câu hỏi từ hệ thống!"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosClient.get("/api/questions");
        if (isMounted) {
          setQuestions(response.data.data || []);
        }
      } catch (err: unknown) {
        if (isMounted) {
          setError(getApiErrorMessage(err, "Không thể tải danh sách câu hỏi từ hệ thống!"));
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredQuestions = useMemo(() => {
    let result = [...questions];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (item) =>
          (item.content || "").toLowerCase().includes(q) ||
          (item.topic || "").toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((item) => item.type === typeFilter);
    }

    if (difficultyFilter !== "all") {
      result = result.filter((item) => item.difficulty === difficultyFilter);
    }

    result.sort((a, b) => {
      if (sortBy === "topic") return (a.topic || "").localeCompare(b.topic || "");
      if (sortBy === "content") return (a.content || "").localeCompare(b.content || "");
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    });

    return result;
  }, [questions, searchQuery, typeFilter, difficultyFilter, sortBy]);

  const handleDeleteQuestion = async (id: string) => {
    if (!id) return;
    try {
      await axiosClient.delete(`/api/questions/${id}`);
      toast.success("Xóa câu hỏi khỏi Ngân hàng thành công!");
      fetchQuestions();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Lỗi khi xóa câu hỏi!"));
    }
  };

  const handleCustomImport = async (options: any) => {
    const { file, onSuccess, onError } = options;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axiosClient.post("/api/questions/import-excel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(res.data?.message || "Nhập bộ câu hỏi từ Excel thành công!");
      onSuccess("OK");
      fetchQuestions();
    } catch (err: unknown) {
      toast.error(getApiErrorMessage(err, "Lỗi khi import file Excel!"));
      onError(err);
    }
  };

  return {
    questions,
    loading,
    error,
    searchQuery,
    setSearchQuery,
    typeFilter,
    setTypeFilter,
    difficultyFilter,
    setDifficultyFilter,
    sortBy,
    setSortBy,
    filteredQuestions,
    fetchQuestions,
    handleDeleteQuestion,
    handleCustomImport,
  };
}
