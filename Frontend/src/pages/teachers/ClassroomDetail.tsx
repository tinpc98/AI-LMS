import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import assignmentApi from "../../api/assignmentApi";
import { classApi } from "../../api/classApi";
import { lessonApi } from "../../api/lessonApi";
import type { IClass, IStudentSummary } from "../../interface/ClassInterface";
import type { IAssignment, ISubmission } from "../../interface/assignmentInterface";
import type { ILesson } from "../../interface/lessonInterface";
import CreateAssignmentModal from "../../components/features/CreateAssignmentModal";
import CreateLessonModal from "../../components/features/CreateLessonModal";
import LiveRoomModal from "../../components/features/LiveRoomModal"; // <-- TÍCH HỢP LIVE ROOM MODAL
import { useJitsiLiveSession } from "../../hooks/useJitsiLiveSession";
import { TeacherClassroomHeader } from "../../components/features/teacher/TeacherClassroomHeader";

const TAB_ITEMS = [
  { id: "lessons", label: "Bài giảng", icon: "book" },
  { id: "members", label: "Học sinh", icon: "groups" },
  { id: "assignments", label: "Bài tập & Đề thi", icon: "assignment" },
  { id: "chat", label: "Thảo luận nhóm", icon: "chat" },
] as const;

const sortLessonsByOrder = (lessons: ILesson[]) => [...lessons].sort((a, b) => a.order - b.order);

export default function ClassroomDetail() {
  const { classId } = useParams<{ classId: string }>();
  const isMounted = useRef(false);

  // --- States Logic thực tế ---
  const [classInfo, setClassInfo] = useState<IClass | null>(null);
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [assignments, setAssignments] = useState<IAssignment[]>([]);
  const [reviewingAssignment, setReviewingAssignment] = useState<IAssignment | null>(null);
  const [reviewSubmissions, setReviewSubmissions] = useState<ISubmission[]>([]);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // --- States UI điều khiển hệ thống ---
  const [editingLesson, setEditingLesson] = useState<ILesson | null>(null);
  const [activeTab, setActiveTab] = useState("lessons");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");

  // --- Custom Hook Chức năng Học Online ---
  const {
    isLiveRoomOpen,
    setIsLiveRoomOpen,
    liveRoomName,
    jwtToken,
    appId,
    isLiveLoading,
    handleStartLiveSession,
  } = useJitsiLiveSession({ classId, isTeacher: true });

  const loadClassroom = useCallback(async () => {
    if (!classId) return;
    setIsLoading(true);
    setErrorMsg("");

    try {
      const [classRes, lessonRes] = await Promise.all([
        classApi.getClassById(classId),
        lessonApi.getLessonsByClass(classId),
      ]);

      if (isMounted.current) {
        setClassInfo(classRes.data.data);
        setLessons(lessonRes.data.lessons);
      }
    } catch (error: unknown) {
      if (isMounted.current && axios.isAxiosError(error)) {
        setErrorMsg(error.response?.data?.message || "Không thể tải dữ liệu lớp học.");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [classId]);

  const loadAssignments = useCallback(async () => {
    if (!classId) return;

    try {
      const data = await assignmentApi.getAssignmentsByClass(classId);
      if (isMounted.current) {
        setAssignments(data);
      }
    } catch (error: unknown) {
      if (isMounted.current && axios.isAxiosError(error)) {
        console.error("Không thể tải danh sách bài tập:", error.response?.data?.message || error.message);
      }
    }
  }, [classId]);

  useEffect(() => {
    isMounted.current = true;

    void (async () => {
      await Promise.all([loadClassroom(), loadAssignments()]);
    })();

    return () => {
      isMounted.current = false;
    };
  }, [loadClassroom, loadAssignments]);

  // --- Xử lý sự kiện mở Phòng học Online (Thông qua Custom Hook) ---
  const onStartLiveClick = () => {
    if (!classInfo) return;
    void handleStartLiveSession(classInfo.className || "Buổi học trực tuyến");
  };

  const handleLessonCreated = (newLesson: ILesson) => {
    setLessons((prev) => sortLessonsByOrder([...prev, newLesson]));
    setIsModalOpen(false);
  };

  const handleLessonUpdated = (updatedLesson: ILesson) => {
    setLessons((prev) =>
      sortLessonsByOrder(prev.map((lesson) => (lesson._id === updatedLesson._id ? updatedLesson : lesson))),
    );
    setEditingLesson(null);
  };

  const handleDeleteLesson = async (id: string) => {
    if (!confirm("Xóa bài giảng này? Hành động không thể hoàn tác.")) return;
    try {
      await lessonApi.deleteLesson(id);
      setLessons((prev) => prev.filter((l) => l._id !== id));
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message || "Xóa bài giảng thất bại.");
      }
    }
  };

  const handleAssignmentCreated = (newAssignment: IAssignment) => {
    setAssignments((prev) => [newAssignment, ...prev]);
    setIsAssignmentModalOpen(false);
  };

  const handleReviewAssignment = async (assignment: IAssignment) => {
    setReviewingAssignment(assignment);
    setIsReviewLoading(true);
    try {
      const submissions = await assignmentApi.getSubmissionsByAssignment(assignment._id);
      setReviewSubmissions(submissions);
    } catch (error: unknown) {
      console.error("Không thể tải danh sách bài nộp:", error);
      setReviewSubmissions([]);
    } finally {
      setIsReviewLoading(false);
    }
  };

  const formatDeadline = (value: string) => {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return "Chưa xác định";
    }

    return parsed.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-on-surface-variant font-medium">Đang tải dữ liệu lớp học...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !classInfo) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-surface px-4">
        <span className="material-symbols-outlined text-4xl text-error">error</span>
        <p className="text-error font-medium text-center">{errorMsg || "Không tìm thấy lớp học."}</p>
        <Link
          to="/teacher/classroom-management"
          className="text-primary font-bold hover:underline flex items-center gap-1 text-sm"
        >
          <span className="material-symbols-outlined text-base">arrow_back</span> Quay lại quản lý lớp học
        </Link>
      </main>
    );
  }

  return (
    <div className="bg-surface font-body-md text-on-surface min-h-screen flex">
      {/* Nhúng font và cấu trúc CSS bổ trợ */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono&display=swap');
      `}</style>

      {/* 1. SIDE NAVIGATION BAR (TEACHER PORTAL) */}
      <aside className="fixed left-0 top-0 h-screen w-[280px] bg-surface-container-lowest border-r border-outline-variant flex flex-col py-8 px-4 z-50 hidden md:flex">
        <div className="mb-8 px-2 flex items-center gap-3">
          <div className="w-10 h-10 bg-primary flex items-center justify-center rounded-lg">
            <span className="material-symbols-outlined text-white" style={{ fontVariationSettings: "'FILL' 1" }}>
              school
            </span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-primary" style={{ fontFamily: "Hanken Grotesk" }}>
              AI-LMS Pro
            </h1>
            <p className="text-on-surface-variant text-xs">Teacher Portal</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <Link
            to="/teacher/dashboard"
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg group"
          >
            <span className="material-symbols-outlined group-hover:text-primary">dashboard</span>
            <span className="text-sm font-medium">Dashboard</span>
          </Link>
          <Link
            to="/teacher/classroom-management"
            className="flex items-center gap-3 px-4 py-3 text-primary font-bold border-r-4 border-primary bg-surface-container rounded-lg"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
              groups
            </span>
            <span className="text-sm font-medium">Class Management</span>
          </Link>
          <Link
            to="/teacher/lessons"
            className="flex items-center gap-3 px-4 py-3 text-on-surface-variant hover:bg-surface-container-high transition-colors rounded-lg group"
          >
            <span className="material-symbols-outlined group-hover:text-primary">book</span>
            <span className="text-sm font-medium">Lessons</span>
          </Link>
        </nav>
      </aside>

      {/* 2. MAIN CONTENT WRAPPER */}
      <main className="flex-1 md:ml-[280px] min-h-screen flex flex-col min-w-0">
        {/* TOP NAV BAR - Sub-component */}
        <TeacherClassroomHeader
          classInfo={classInfo}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isLiveLoading={isLiveLoading}
          onStartLiveClick={onStartLiveClick}
          tabItems={TAB_ITEMS}
        />

        {/* CANVAS NỘI DUNG CHÍNH (Thay đổi linh hoạt theo Tab active) */}
        <div className="flex-1 p-6 sm:p-8 max-w-[1280px] w-full mx-auto box-border">
          {/* TAB 1: QUẢN LÝ BÀI GIẢNG */}
          {activeTab === "lessons" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Bài giảng đã đăng ({lessons.length})</h3>
                  <p className="text-xs text-on-surface-variant">
                    Tải lên tài liệu PDF hoặc bài giảng video để học sinh ôn tập học liệu.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingLesson(null);
                    setIsModalOpen(true);
                  }}
                  className="bg-[#3525cd] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-[#281baf] hover:shadow-md transition-all active:scale-95 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-lg">add</span>
                  Tạo bài giảng
                </button>
              </div>

              {lessons.length === 0 ? (
                <div className="border-2 border-dashed border-outline-variant rounded-2xl p-16 text-center text-on-surface-variant bg-white">
                  <span className="material-symbols-outlined text-4xl text-outline mb-2">menu_book</span>
                  <p className="text-sm font-medium">Chưa có bài giảng nào được đăng tải.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {lessons.map((lesson) => (
                    <div
                      key={lesson._id}
                      className="bg-white border border-outline-variant p-5 rounded-2xl hover:shadow-md transition-all flex flex-col justify-between group animate-fade-in"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h4 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors">
                            {lesson.title}
                          </h4>
                          <span className="text-[10px] bg-surface-container-high px-2 py-0.5 rounded text-on-surface-variant font-medium flex-shrink-0">
                            {lesson.videoUrl ? "Video" : "Tài liệu"}
                          </span>
                        </div>
                        {lesson.description && (
                          <p className="text-on-surface-variant text-xs line-clamp-2 mb-4">{lesson.description}</p>
                        )}

                        <div className="space-y-1.5 mb-4">
                          {lesson.videoUrl && (
                            <a
                              href={lesson.videoUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 text-primary text-xs font-bold hover:underline"
                            >
                              <span className="material-symbols-outlined text-base">play_circle</span> Xem video hướng
                              dẫn
                            </a>
                          )}
                          {lesson.attachments &&
                            lesson.attachments.map((file) => (
                              <a
                                key={file.publicId}
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-on-surface-variant text-xs hover:text-primary truncate"
                              >
                                <span className="material-symbols-outlined text-base text-outline">attach_file</span>{" "}
                                <span className="truncate">{file.name}</span>
                              </a>
                            ))}
                        </div>
                      </div>

                      {/* Chân Card: Nơi đặt cặp nút Sửa & Xóa */}
                      <div className="flex items-center justify-between pt-3 border-t border-outline-variant/40 mt-auto">
                        <span className="text-[11px] text-outline font-medium">
                          Ngày tạo: {new Date(lesson.createdAt).toLocaleDateString("vi-VN")}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingLesson(lesson)}
                            className="text-primary hover:bg-primary/10 p-2 rounded-lg transition-colors"
                            title="Sửa bài giảng"
                          >
                            <span className="material-symbols-outlined text-lg">edit</span>
                          </button>
                          <button
                            onClick={() => handleDeleteLesson(lesson._id)}
                            className="text-error hover:bg-error-container/10 p-2 rounded-lg transition-colors"
                            title="Xóa bài giảng"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DANH SÁCH THÀNH VIÊN (HỌC SINH) */}
          {activeTab === "members" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">
                    Danh sách lớp học ({classInfo.students?.length ?? 0} thành viên)
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Theo dõi chuyên cần và danh sách tài khoản học sinh đã tham gia lớp.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-outline-variant rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead>
                      <tr className="bg-surface-container border-b border-outline-variant">
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Học sinh
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Mã số học sinh
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                          Trạng thái chuyên cần
                        </th>
                        <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">
                          Hành động
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/30">
                      {classInfo.students && classInfo.students.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-12 text-center text-xs text-on-surface-variant">
                            Chưa có học sinh nào tham gia lớp học bằng mã code.
                          </td>
                        </tr>
                      ) : (
                        classInfo.students.map((student: IStudentSummary, index: number) => (
                          <tr key={student._id || index} className="hover:bg-surface-container-low transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                  {student.fullName?.substring(0, 2).toUpperCase() || "ST"}
                                </div>
                                <div>
                                  <p className="font-bold text-sm text-on-surface">{student.fullName || "Ẩn danh"}</p>
                                  <p className="text-xs text-on-surface-variant">{student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-mono">STU-00{100 + index}</td>
                            <td className="px-6 py-4">
                              <span className="bg-green-50 text-green-700 px-2 py-0.5 rounded text-[11px] font-bold uppercase">
                                98% Đều đặn
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button className="text-on-surface-variant hover:text-primary p-1 rounded-md transition-colors">
                                <span className="material-symbols-outlined text-xl">more_vert</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BÀI TẬP VÀ ĐỀ THI TRỰC TUYẾN */}
          {activeTab === "assignments" && (
            <div className="space-y-4">
              <div className="mb-2 flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">Học liệu Đánh giá</h3>
                  <p className="text-xs text-on-surface-variant">
                    Tạo bài tập về nhà, đề kiểm tra định kỳ và chia sẻ tài liệu cho cả lớp.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setActiveTab("assignments");
                    setIsAssignmentModalOpen(true);
                  }}
                  className="bg-[#3525cd] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 hover:bg-[#281baf] hover:shadow-md transition-all active:scale-95 flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-sm">assignment_add</span>
                  <span>Tạo bài tập</span>
                </button>
              </div>

              {assignments.length === 0 ? (
                <div className="rounded-2xl border-2 border-dashed border-outline-variant bg-white p-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined mb-2 text-4xl text-outline">assignment</span>
                  <p className="text-sm font-medium">Chưa có bài tập nào được giao cho lớp học này.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment._id} className="rounded-2xl border border-outline-variant bg-white p-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="flex items-start gap-4">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary-container text-primary">
                            <span className="material-symbols-outlined text-lg">assignment</span>
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-sm font-bold text-on-surface sm:text-base">{assignment.title}</h5>
                            <p className="mt-1 text-xs text-on-surface-variant">
                              Hạn nộp: {formatDeadline(assignment.deadline)}
                            </p>
                            {assignment.description && (
                              <p className="mt-2 text-sm text-on-surface-variant">{assignment.description}</p>
                            )}
                            {assignment.attachments?.length > 0 && (
                              <div className="mt-3 flex flex-wrap gap-2">
                                {assignment.attachments.map((file) => (
                                  <a
                                    key={file.publicId}
                                    href={file.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-low px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
                                  >
                                    <span className="material-symbols-outlined text-sm">download</span>
                                    <span className="truncate">{file.name}</span>
                                  </a>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => void handleReviewAssignment(assignment)}
                          className="self-start rounded-lg border border-primary px-4 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/5 sm:self-center"
                        >
                          Chấm điểm
                        </button>
                      </div>

                      {reviewingAssignment?._id === assignment._id && (
                        <div className="mt-4 rounded-xl border border-outline-variant bg-surface-container-low p-4">
                          <div className="mb-3 flex items-center justify-between">
                            <h6 className="text-sm font-semibold text-on-surface">Danh sách học sinh đã nộp</h6>
                            <button
                              onClick={() => setReviewingAssignment(null)}
                              className="text-xs font-semibold text-primary"
                            >
                              Đóng
                            </button>
                          </div>
                          {isReviewLoading ? (
                            <p className="text-sm text-on-surface-variant">Đang tải danh sách bài nộp...</p>
                          ) : reviewSubmissions.length === 0 ? (
                            <p className="text-sm text-on-surface-variant">
                              Chưa có học sinh nào nộp bài cho assignment này.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {reviewSubmissions.map((submission) => {
                                const student = typeof submission.studentId === "object" ? submission.studentId : null;
                                return (
                                  <div
                                    key={submission._id}
                                    className="rounded-lg border border-outline-variant bg-white p-3"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div>
                                        <p className="text-sm font-semibold text-on-surface">
                                          {student?.fullName || "Học sinh"}
                                        </p>
                                        <p className="text-xs text-on-surface-variant">{student?.email || ""}</p>
                                      </div>
                                      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary">
                                        {submission.status === "graded" ? "Đã chấm" : "Đã nộp"}
                                      </span>
                                    </div>
                                    {submission.content && (
                                      <p className="mt-2 text-xs text-on-surface-variant line-clamp-3">
                                        {submission.content}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: THẢO LUẬN NHÓM LỚP HỌC */}
          {activeTab === "chat" && (
            <div className="bg-white border border-outline-variant rounded-2xl h-[500px] flex flex-col overflow-hidden shadow-sm">
              <div className="p-4 border-b border-outline-variant flex items-center justify-between bg-surface-container-low flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                    #
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-on-surface">Kênh chung - Thảo luận lớp học</h4>
                    <p className="text-[10px] text-green-600 flex items-center gap-1 font-medium mt-0.5">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Học sinh trực tuyến
                      kết nối thời gian thực
                    </p>
                  </div>
                </div>
              </div>

              {/* Vùng Tin nhắn nội dung mẫu */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/40">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex-shrink-0 flex items-center justify-center font-bold text-blue-700 text-xs">
                    TN
                  </div>
                  <div className="max-w-[75%]">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xs text-on-surface">Trần Nam</span>
                      <span className="text-[10px] text-outline">09:42 AM</span>
                    </div>
                    <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-outline-variant/60 shadow-sm text-xs sm:text-sm">
                      Dạ thưa thầy, tệp tài liệu PDF đính kèm chương vừa đăng em chưa mở được ạ. Thầy cấp quyền giúp em
                      với ạ!
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 flex-row-reverse">
                  <div className="w-8 h-8 rounded-full bg-primary flex-shrink-0 flex items-center justify-center font-bold text-white text-xs">
                    GV
                  </div>
                  <div className="max-w-[75%] text-right">
                    <div className="flex items-center justify-end gap-2 mb-1">
                      <span className="text-[10px] text-outline">09:45 AM</span>
                      <span className="font-bold text-xs text-primary">Bạn (Giảng viên)</span>
                    </div>
                    <div className="bg-primary text-white p-3 rounded-2xl rounded-tr-none text-left text-xs sm:text-sm">
                      Chào Nam, hệ thống vừa cập nhật xong đồng bộ đám mây, em thử tải hoặc tải lại (F5) trang xem được
                      chưa nhé. Thầy vừa kiểm tra lại link rồi.
                    </div>
                  </div>
                </div>
              </div>

              {/* Thanh gõ tin nhắn phía dưới chân chat */}
              <div className="p-3 border-t border-outline-variant bg-white flex-shrink-0">
                <div className="flex items-center gap-2 bg-surface-container rounded-xl p-1.5 px-3 border border-transparent focus-within:border-primary/20 transition-all">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-transparent border-none focus:ring-0 text-xs sm:text-sm outline-none"
                    placeholder="Nhập nội dung tin nhắn trao đổi với cả lớp học..."
                  />
                  <button className="bg-primary text-white p-2 rounded-lg active:scale-95 transition-transform flex items-center justify-center">
                    <span className="material-symbols-outlined text-base">send</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODALS HỆ THỐNG */}
      <CreateLessonModal
        isOpen={isModalOpen || !!editingLesson}
        onClose={() => {
          setIsModalOpen(false);
          setEditingLesson(null);
        }}
        classId={classId!}
        lessonData={editingLesson}
        onCreated={handleLessonCreated}
        onUpdated={handleLessonUpdated}
      />

      <CreateAssignmentModal
        isOpen={isAssignmentModalOpen}
        onClose={() => setIsAssignmentModalOpen(false)}
        classId={classId!}
        onCreated={handleAssignmentCreated}
      />

      {/* MODAL HỌC ONLINE TRỰC TUYẾN */}
      <LiveRoomModal
        isOpen={isLiveRoomOpen}
        onClose={() => setIsLiveRoomOpen(false)}
        roomName={liveRoomName}
        jwtToken={jwtToken}
        appId={appId}
      />
    </div>
  );
}
