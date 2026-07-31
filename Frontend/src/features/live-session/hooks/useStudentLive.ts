import { useState, useEffect, useMemo, useCallback } from "react";
import liveApi from "../../../api/liveApi";
import type { ILiveSession } from "../../../interface/liveInterface";
import type { IExtendedLiveSession, StudentLiveStats } from "../../../types/studentLive";

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

  // Lịch sử các buổi học đã diễn ra.
  //
  // ĐÃ GỠ HAI BUỔI HỌC BỊA (Wave 5). Bản cũ trả về cứng "Buổi 1: Tổng quan môn học" và
  // "Buổi 2: Hướng dẫn thực hành dự án" với mốc thời gian 7 ngày và 3 ngày trước, cho MỌI
  // lớp. Chúng được trộn thẳng vào cùng chỗ với dữ liệu thật từ API, không nhãn mác gì, và
  // LiveSessionCard lấy pastSessions[0] làm mục hiển thị dự phòng — nên học sinh nhìn thấy
  // một buổi học chưa từng tồn tại trong lớp của mình. stats.attended cũng đếm cả hai.
  //
  // Trả mảng rỗng cho tới khi có API thật: LiveSessionCard đã có sẵn trạng thái rỗng đúng
  // nghĩa ("Chưa có buổi học trực tuyến — Giảng viên sẽ tạo buổi học khi bắt đầu tiết học"),
  // nên màn hình trống ở đây là câu trả lời trung thực, không phải lỗi thiếu sót.
  //
  // TODO: backend chưa có endpoint liệt kê buổi học đã kết thúc theo lớp.
  const pastSessions: IExtendedLiveSession[] = useMemo(() => [], []);

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
