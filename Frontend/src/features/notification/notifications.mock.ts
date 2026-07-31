export interface NotificationRecord {
  id: string;
  title: string;
  description: string;
  type:
    | "student_registered"
    | "teacher_assigned"
    | "course_created"
    | "ai_generated"
    | "live_started"
    | "system";
  timestamp: string;
  status: "unread" | "read";
  targetUrl?: string;
}

export const mockNotifications: NotificationRecord[] = [
  {
    id: "notif-01",
    title: "Học sinh mới đăng ký",
    description: "Đỗ Thị Phương vừa ghi danh vào lớp Toán 12 K25 - Sáng.",
    type: "student_registered",
    timestamp: "10 phút trước",
    status: "unread",
    targetUrl: "/admin/accounts",
  },
  {
    id: "notif-02",
    title: "Phân công giáo viên",
    description: "Cô Trần Thị Bình đã được phân công đảm nhận lớp Lý 12 VIP.",
    type: "teacher_assigned",
    timestamp: "35 phút trước",
    status: "unread",
    targetUrl: "/admin/teacher-assignment",
  },
  {
    id: "notif-03",
    title: "Khóa học mới được tạo",
    description: "Khóa học 'Mathematics 12 Intensive 2027' đã xuất bản thành công.",
    type: "course_created",
    timestamp: "2 giờ trước",
    status: "read",
    targetUrl: "/admin/courses",
  },
  {
    id: "notif-04",
    title: "AI sinh đề thi mới",
    description: "Hệ thống AI đã tự động khởi tạo 50 câu hỏi trắc nghiệm Hóa Học 12.",
    type: "ai_generated",
    timestamp: "3 giờ trước",
    status: "read",
    targetUrl: "/admin/ai-management",
  },
  {
    id: "notif-05",
    title: "Buổi học trực tuyến bắt đầu",
    description: "Lớp 'Toán 12 K26 - Tối' vừa mở phòng học trực tuyến Jitsi.",
    type: "live_started",
    timestamp: "4 giờ trước",
    status: "read",
    targetUrl: "/admin/classes",
  },
];
