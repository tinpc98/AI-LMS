import { useState, useEffect, useMemo, useCallback } from "react";
import liveApi from "../api/liveApi";
import type { ILiveSession } from "../interface/liveInterface";
import type {
  IExtendedLiveSession,
  StudentLiveStats,
} from "../types/studentLive";

export function useStudentLive(
  classId?: string,
  rawLiveSession?: ILiveSession | null,
  classInfo?: any
) {
  const [activeSession, setActiveSession] = useState<ILiveSession | null>(rawLiveSession || null);
  const [loading, setLoading] = useState(false);

  const refreshLiveSession = useCallback(() => {
    if (classId) {
      setLoading(true);
      liveApi
        .getActiveLiveSession(classId)
        .then((res: any) => {
          if (res.data?.data) {
            setActiveSession(res.data.data);
          } else {
            setActiveSession(null);
          }
        })
        .catch((err: any) => {
          console.warn("Không tìm thấy active live session:", err);
          setActiveSession(null);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [classId]);

  // Fetch active session from API if classId is provided
  useEffect(() => {
    refreshLiveSession();
  }, [classId]);

  // Current Live Session Hero item
  const currentLiveItem: IExtendedLiveSession | null = useMemo(() => {
    if (!activeSession && !classInfo?.liveSession) return null;

    const session = activeSession || classInfo?.liveSession;
    if (!session) return null;

    const teacherName =
      typeof classInfo?.teacher === "object" && classInfo?.teacher?.fullName
        ? classInfo.teacher.fullName
        : "Giảng viên phụ trách";

    return {
      _id: session._id || `live-${classId}`,
      id: session.id || session._id || `live-${classId}`,
      classId: session.classId || classId || "",
      roomName: session.roomName || session.meetingRoomId || `room-${classId}`,
      meetingRoomId: session.meetingRoomId || session.roomName || `room-${classId}`,
      sessionNumber: session.sessionNumber || 1,
      title: session.title || `Buổi học trực tuyến lớp ${classInfo?.name || ""}`,
      createdBy: session.createdBy || "",
      status: "Live",
      isLiveNow: true,
      platform: "Jitsi Meet",
      teacherName,
      createdAt: session.createdAt || new Date().toISOString(),
      updatedAt: session.updatedAt || new Date().toISOString(),
    };
  }, [activeSession, classInfo, classId]);

  // Upcoming Sessions list
  const upcomingSessions: IExtendedLiveSession[] = useMemo(() => {
    const list: IExtendedLiveSession[] = [];
    const now = new Date().getTime();

    if (classInfo?.schedule && Array.isArray(classInfo.schedule)) {
      classInfo.schedule.forEach((sched: any, idx: number) => {
        const startTime = new Date(now + (idx + 1) * 3 * 60 * 60 * 1000).toISOString();
        const diffMs = new Date(startTime).getTime() - now;
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const isStartingSoon = diffMs <= 30 * 60 * 1000;

        list.push({
          _id: `upcoming-${idx}`,
          id: `upcoming-${idx}`,
          classId: classId || "",
          roomName: `room-upcoming-${idx}`,
          meetingRoomId: `room-upcoming-${idx}`,
          sessionNumber: idx + 2,
          title: `Buổi ${idx + 2}: ${sched.dayOfWeek || "Lịch học tiếp theo"} (${sched.time || "08:00 - 10:30"})`,
          createdBy: "",
          scheduledStart: startTime,
          status: "Upcoming",
          isLiveNow: false,
          platform: "Jitsi Meet",
          teacherName: classInfo?.teacher?.fullName || "Giảng viên",
          countdownText: `Còn ${hours} giờ ${minutes} phút`,
          isStartingSoon,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      });
    }

    return list;
  }, [classInfo, classId]);

  // Past Sessions history list
  const pastSessions: IExtendedLiveSession[] = useMemo(() => {
    const list: IExtendedLiveSession[] = [
      {
        _id: "past-1",
        id: "past-1",
        classId: classId || "",
        roomName: "room-past-1",
        meetingRoomId: "room-past-1",
        sessionNumber: 1,
        title: "Buổi 1: Tổng quan môn học & Giới thiệu chương trình",
        createdBy: "",
        scheduledStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: "Completed",
        isLiveNow: false,
        platform: "Jitsi Meet",
        teacherName: classInfo?.teacher?.fullName || "Giảng viên",
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        _id: "past-2",
        id: "past-2",
        classId: classId || "",
        roomName: "room-past-2",
        meetingRoomId: "room-past-2",
        sessionNumber: 2,
        title: "Buổi 2: Hướng dẫn thực hành dự án & Thảo luận nhóm",
        createdBy: "",
        scheduledStart: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        status: "Completed",
        isLiveNow: false,
        platform: "Jitsi Meet",
        teacherName: classInfo?.teacher?.fullName || "Giảng viên",
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    return list;
  }, [classInfo, classId]);

  // Stats calculation
  const stats: StudentLiveStats = useMemo(() => {
    const total = (currentLiveItem ? 1 : 0) + upcomingSessions.length + pastSessions.length;
    const attended = pastSessions.filter((s) => s.status === "Completed").length;
    const missed = pastSessions.filter((s) => s.status === "Missed").length;
    const upcoming = upcomingSessions.length + (currentLiveItem ? 1 : 0);

    return { total, attended, missed, upcoming };
  }, [currentLiveItem, upcomingSessions, pastSessions]);

  return {
    loading,
    currentLiveItem,
    upcomingSessions,
    pastSessions,
    stats,
    refreshLiveSession,
  };
}

export default useStudentLive;
