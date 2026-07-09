// Frontend/src/pages/teachers/ClassroomDetail.tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { classApi } from "../../api/classApi";
import { lessonApi } from "../../api/lessonApi";
import type { IClass } from "../../interface/classInterface";
import type { ILesson } from "../../interface/lessonInterface";
import CreateLessonModal from "../../components/features/CreateLessonModal";

const ClassroomDetail = () => {
  const { classId } = useParams<{ classId: string }>();
  const isMounted = useRef(false);

  const [classInfo, setClassInfo] = useState<IClass | null>(null);
  const [lessons, setLessons] = useState<ILesson[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

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
        setLessons(lessonRes.data.lessons); // BE trả về { lessons: [...] }, không phải { data }
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

  useEffect(() => {
    isMounted.current = true;
    void Promise.resolve().then(loadClassroom);

    return () => {
      isMounted.current = false;
    };
  }, [loadClassroom]);

  const handleLessonCreated = (newLesson: ILesson) => {
    setLessons((prev) => [...prev, newLesson]);
    setIsModalOpen(false);
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

  if (isLoading) {
    return <main className="md:ml-[280px] min-h-screen flex items-center justify-center">Đang tải...</main>;
  }

  if (errorMsg || !classInfo) {
    return (
      <main className="md:ml-[280px] min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-error">{errorMsg || "Không tìm thấy lớp học."}</p>
        <Link to="/teacher/classroom-management" className="text-primary font-bold hover:underline">
          Quay lại danh sách lớp
        </Link>
      </main>
    );
  }

  return (
    <main className="md:ml-[280px] min-h-screen flex flex-col">
      <header className="h-20 bg-surface border-b border-outline-variant flex items-center justify-between px-margin-desktop sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
        <div>
          <p className="text-body-sm text-on-surface-variant">
            <Link to="/teacher/classroom-management" className="hover:text-primary">
              Quản lý lớp học
            </Link>{" "}
            / {classInfo.className}
          </p>
          <h2 className="font-headline-md text-headline-md font-bold">{classInfo.className}</h2>
        </div>
        <div className="flex items-center gap-4">
          <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-label-md font-bold">
            Mã lớp: {classInfo.joinCode}
          </span>
          <span className="text-body-sm text-on-surface-variant">{classInfo.students.length} học sinh</span>
        </div>
      </header>

      <div className="flex-1 px-margin-desktop py-8 max-w-max-content-width mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="font-headline-md text-headline-md text-on-surface">Bài giảng ({lessons.length})</h3>
            <p className="text-on-surface-variant text-body-sm">Danh sách bài giảng của lớp học này.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-white px-6 py-3 rounded-xl font-label-md flex items-center gap-2 hover:shadow-lg transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">add</span>
            Tạo bài giảng
          </button>
        </div>

        {lessons.length === 0 ? (
          <div className="border-2 border-dashed border-outline-variant rounded-2xl p-16 text-center text-on-surface-variant">
            Chưa có bài giảng nào. Bấm "Tạo bài giảng" để bắt đầu.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lessons.map((lesson) => (
              <div
                key={lesson._id}
                className="bg-surface-container-lowest border border-outline-variant p-6 rounded-2xl hover:shadow-md transition-all"
              >
                <h4 className="font-bold text-lg mb-2">{lesson.title}</h4>
                {lesson.description && (
                  <p className="text-on-surface-variant text-body-sm mb-4 line-clamp-2">{lesson.description}</p>
                )}

                {lesson.videoUrl && (
                  <a
                    href={lesson.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 text-primary text-body-sm font-bold mb-2 hover:underline"
                  >
                    <span className="material-symbols-outlined text-[18px]">play_circle</span>
                    Xem video
                  </a>
                )}

                {lesson.attachments.length > 0 && (
                  <div className="space-y-1 mb-4">
                    {lesson.attachments.map((file) => (
                      <a
                        key={file.publicId}
                        href={file.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 text-on-surface-variant text-body-sm hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[16px]">attach_file</span>
                        {file.name}
                      </a>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-outline-variant/30">
                  <span className="text-[11px] text-on-surface-variant">
                    {new Date(lesson.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                  <button
                    onClick={() => handleDeleteLesson(lesson._id)}
                    className="text-error hover:bg-error-container/10 p-2 rounded-lg transition-colors"
                    title="Xóa bài giảng"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateLessonModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        classId={classId!}
        onCreated={handleLessonCreated}
      />
    </main>
  );
};

export default ClassroomDetail;
