import { useState, useCallback } from "react";
import learningApi from "../api/learningApi";
import type { ILessonProgress, ILearningActivity, IStudentBadge, IRankingResponse, IStudentRank } from "../api/learningApi";
import { toast } from "../utils/toast";

export function useLearningAnalytics(classId?: string) {
  const [progressData, setProgressData] = useState<ILessonProgress[]>([]);
  const [activities, setActivities] = useState<ILearningActivity[]>([]);
  const [badges, setBadges] = useState<IStudentBadge[]>([]);
  const [classRanking, setClassRanking] = useState<IRankingResponse | null>(null);
  const [myRank, setMyRank] = useState<IStudentRank | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStudentProgress = useCallback(async () => {
    if (!classId) return;
    try {
      setLoading(true);
      const data = await learningApi.getStudentProgress(classId);
      setProgressData(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const updateProgress = useCallback(async (lessonId: string, progress: number, durationSeconds?: number) => {
    if (!classId) return;
    try {
      const data = await learningApi.updateLessonProgress({ classId, lessonId, progress, durationSeconds });
      // Update local state
      setProgressData(prev => {
        const idx = prev.findIndex(p => p.lessonId === lessonId);
        if (idx >= 0) {
          const newArr = [...prev];
          newArr[idx] = data;
          return newArr;
        }
        return [...prev, data];
      });
    } catch (error) {
      console.error(error);
    }
  }, [classId]);

  const fetchClassRanking = useCallback(async (params?: any) => {
    if (!classId) return;
    try {
      setLoading(true);
      const data = await learningApi.getClassRanking(classId, params);
      setClassRanking(data);
    } catch (error) {
      console.error(error);
      toast.error("Không thể lấy bảng xếp hạng");
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const fetchMyRank = useCallback(async () => {
    if (!classId) return;
    try {
      const data = await learningApi.getStudentRanking(classId);
      setMyRank(data);
    } catch (error) {
      console.error(error);
    }
  }, [classId]);

  const fetchMyBadges = useCallback(async () => {
    try {
      const data = await learningApi.getMyBadges();
      setBadges(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchMyActivities = useCallback(async () => {
    try {
      const data = await learningApi.getMyActivities({ classId });
      setActivities(data);
    } catch (error) {
      console.error(error);
    }
  }, [classId]);

  return {
    progressData,
    activities,
    badges,
    classRanking,
    myRank,
    loading,
    fetchStudentProgress,
    updateProgress,
    fetchClassRanking,
    fetchMyRank,
    fetchMyBadges,
    fetchMyActivities
  };
}
