import { useState, useEffect, useCallback } from "react";
import { classApi } from "../api/classApi";
import { lessonApi } from "../api/lessonApi";
import assignmentApi from "../api/assignmentApi";
import type { IClass } from "../interface/ClassInterface";
import type { ILesson } from "../interface/lessonInterface";
import type { IAssignment } from "../interface/assignmentInterface";

interface UseClassDetailReturn {
  classInfo: IClass | null;
  lessons: ILesson[];
  assignments: IAssignment[];
  submittedAssignmentIds: string[];
  isLoading: boolean;
  errorMsg: string;
  refetch: () => Promise<void>;
  setSubmittedAssignmentIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useClassDetail = (classId?: string): UseClassDetailReturn => {
  const [classInfo, setClassInfo] = useState<IClass | null>(null);
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [submittedAssignmentIds, setSubmittedAssignmentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const getStudentIdFromToken = (): string | null => {
    const token = localStorage.getItem("accessToken");
    if (!token) return null;
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
      const decoded = JSON.parse(jsonPayload);
      return decoded._id || decoded.id || decoded.userId || null;
    } catch {
      return null;
    }
  };

  const fetchData = useCallback(async () => {
    if (!classId) return;
    try {
      setIsLoading(true);
      setErrorMsg("");

      const [classRes, lessonRes, assignmentRes] = await Promise.all([
        classApi.getClassById(classId),
        lessonApi.getLessonsByClass(classId).catch(() => ({ data: { lessons: [] } })),
        assignmentApi.getAssignmentsByClass(classId).catch(() => []),
      ]);

      const fetchedClass = classRes.data?.data || classRes.data;
      setClassInfo(fetchedClass);

      const rawLessons = lessonRes.data?.lessons || lessonRes.lessons || [];
      const publishedLessons = (rawLessons as ILesson[])
        .filter((l) => l.isPublished)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
      setLessons(publishedLessons);

      const fetchedAssignments = Array.isArray(assignmentRes)
        ? assignmentRes
        : (assignmentRes as any)?.data || [];
      setAssignments(fetchedAssignments);

      // Check student submissions
      const studentId = getStudentIdFromToken();
      if (studentId && fetchedAssignments.length > 0) {
        const submittedIds: string[] = [];
        await Promise.all(
          fetchedAssignments.map(async (item: IAssignment) => {
            try {
              const subs = await assignmentApi.getSubmissionsByAssignment(item._id);
              const hasSubmitted = subs.some(
                (s: any) =>
                  s.studentId === studentId ||
                  s.studentId?._id === studentId ||
                  s.student === studentId ||
                  s.student?._id === studentId
              );
              if (hasSubmitted) {
                submittedIds.push(item._id);
              }
            } catch {
              // Ignore individual submission fetch errors
            }
          })
        );
        setSubmittedAssignmentIds(submittedIds);
      }
    } catch (err: any) {
      console.error("Lỗi tải thông tin lớp học:", err);
      setErrorMsg(err.response?.data?.message || "Không thể tải thông tin lớp học.");
    } finally {
      setIsLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    classInfo,
    lessons,
    assignments,
    submittedAssignmentIds,
    isLoading,
    errorMsg,
    refetch: fetchData,
    setSubmittedAssignmentIds,
  };
};

export default useClassDetail;
