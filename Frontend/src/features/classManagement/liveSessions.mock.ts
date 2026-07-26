export interface LiveSessionRecord {
  id: string;
  classId: string;
  className: string;
  teacherName: string;
  platform: "Jitsi" | "Zoom" | "Google Meet";
  startTime: string;
  endTime: string;
  status: "Live" | "Scheduled" | "Ended";
  activeParticipants: number;
}

export const mockLiveSessions: LiveSessionRecord[] = [
  {
    id: "live-01",
    classId: "class-2",
    className: "Toán 12 K26 - Tối",
    teacherName: "Trần Thị Bình",
    platform: "Jitsi",
    startTime: "2026-07-26T19:00:00.000Z",
    endTime: "2026-07-26T21:00:00.000Z",
    status: "Live",
    activeParticipants: 18,
  },
  {
    id: "live-02",
    classId: "class-5",
    className: "Anh 12 7.0+",
    teacherName: "Phạm Minh Duyên",
    platform: "Jitsi",
    startTime: "2026-07-26T17:30:00.000Z",
    endTime: "2026-07-26T19:00:00.000Z",
    status: "Live",
    activeParticipants: 21,
  },
  {
    id: "live-03",
    classId: "class-7",
    className: "Lý 12 Cơ bản",
    teacherName: "Trần Thị Bình",
    platform: "Jitsi",
    startTime: "2026-07-26T20:00:00.000Z",
    endTime: "2026-07-26T21:30:00.000Z",
    status: "Scheduled",
    activeParticipants: 0,
  },
];
