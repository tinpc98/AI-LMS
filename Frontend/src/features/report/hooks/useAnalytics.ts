import { useState, useCallback } from "react";
import analyticsApi from "../../../api/analyticsApi";
import type { IStudentAnalytics, ITeacherAnalytics } from "../../../api/analyticsApi";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

export function useAnalytics(classId?: string) {
  const [studentDashboard, setStudentDashboard] = useState<IStudentAnalytics | null>(null);
  const [teacherDashboard, setTeacherDashboard] = useState<ITeacherAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentDashboard = useCallback(async () => {
    if (!classId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getStudentDashboard(classId);
      // Backend sendSuccess wraps data in response.data.data
      setStudentDashboard(data);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Không thể tải dữ liệu phân tích học tập."));
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const fetchTeacherDashboard = useCallback(async () => {
    if (!classId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsApi.getTeacherDashboard(classId);
      setTeacherDashboard(data);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Không thể tải dữ liệu phân tích lớp học."));
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const downloadReport = useCallback(() => {
    if (!classId) return;
    const url = analyticsApi.getTeacherExportUrl(classId);

    // Add auth token to query params if needed or rely on cookies
    const token =
      localStorage.getItem("token") ||
      sessionStorage.getItem("token") ||
      localStorage.getItem("accessToken");
    window.open(`${url}?token=${token}`, "_blank");
  }, [classId]);

  return {
    studentDashboard,
    teacherDashboard,
    loading,
    error,
    fetchStudentDashboard,
    fetchTeacherDashboard,
    downloadReport,
  };
}
