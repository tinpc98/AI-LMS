import { useEffect, useState } from "react";
import { classApi } from "../../api/classApi";
import CreateClassModal from "../../components/features/CreateClassModal";
import type { IClass } from "../../interface/ClassInterface";
import { useNavigate } from "react-router-dom";

const ClassManagement = () => {
  const [classes, setClasses] = useState<IClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        setIsLoading(true);
        const res = await classApi.getMyClasses();
        setClasses(res.data.data);
      } catch (error) {
        console.error("Lỗi khi tải danh sách lớp:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchClasses();
  }, []);

  const handleClassCreated = (newClass: IClass) => {
    setClasses((prev) => [newClass, ...prev]);
  };

  // --- CÁC HÀM XỬ LÝ SỰ KIỆN CHO NÚT BẤM MỚI ---
  const handleGoToClass = (classId: string) => {
    console.log("Điều hướng vào lớp học có ID:", classId);
    navigate(`/teacher/classroom-detail/${classId}`);
  };

  const handleEditClass = (cls: IClass) => {
    console.log("Mở modal sửa lớp học:", cls);
    // Logic kích hoạt Modal chỉnh sửa lớp học của bạn tại đây
  };

  const handleDeleteClass = async (classId: string) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa lớp học này không? Hành động này không thể hoàn tác.")) {
      try {
        await classApi.deleteClass(classId);
        setClasses((prev) => prev.filter((c) => c._id !== classId));
      } catch (error) {
        console.error("Lỗi khi xóa lớp học:", error);
      }
    }
  };

  return (
    <main className="ml-[280px] flex-1 flex flex-col relative min-w-0 pt-16">
      <div className="p-margin-desktop max-w-max-content-width mx-auto w-full">
        {/* Tiêu đề trang */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="font-headline-lg text-headline-lg text-on-surface font-bold">Quản lý lớp học</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-primary text-on-primary px-6 py-3 rounded-xl flex items-center gap-2 hover:bg-primary-container hover:shadow-md transition-all duration-200 active:scale-[0.98]"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Tạo lớp học mới
          </button>
        </div>

        {/* Trạng thái Loading */}
        {isLoading && (
          <div className="flex items-center gap-2 text-on-surface-variant my-4 animate-pulse">
            <span className="material-symbols-outlined animate-spin">progress_activity</span>
            <p className="text-sm font-medium">Đang tải danh sách lớp học...</p>
          </div>
        )}

        {/* Danh sách thẻ lớp học */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {classes.map((cls) => (
            <div
              key={cls._id}
              className="bg-surface border border-outline-variant rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
            >
              {/* Phần thông tin lớp học */}
              <div className="mb-6">
                {/* Hàng 1: Tên lớp học và các Badge trạng thái, số lượng học sinh */}
                <div className="flex justify-between items-start mb-3 gap-4">
                  <h3 className="font-headline-sm text-title-lg text-on-surface font-bold tracking-tight group-hover:text-primary transition-colors line-clamp-1 flex-1">
                    {cls.className}
                  </h3>

                  <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 whitespace-nowrap">
                    {/* 🟢 BADGE TRẠNG THÁI: Tự động đổi màu động dựa trên dữ liệu (cls.status) */}
                    {cls.status === "active" || !cls.status ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-success/10 text-success border border-success/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></span>
                        Đang mở
                      </span>
                    ) : cls.status === "completed" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-warning/10 text-warning border border-warning/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
                        Đã hoàn thành
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-error/10 text-error border border-error/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                        Đã đóng
                      </span>
                    )}

                    {/* Badge Số lượng học sinh */}
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      <span className="material-symbols-outlined text-[14px]">group</span>
                      {cls.students?.length || 0} học sinh
                    </span>
                  </div>
                </div>

                {/* Hàng 2: Khung chứa Mã lớp */}
                <div className="flex items-center gap-1 text-sm text-on-surface-variant bg-surface-container-low px-3 py-2 rounded-xl border border-outline-variant/50 w-fit">
                  <span className="text-xs font-semibold select-none text-on-surface-variant/70">Mã lớp:</span>
                  <span className="font-mono font-bold text-primary tracking-wider">{cls.joinCode}</span>
                </div>
              </div>

              {/* Khối hành động thao tác lớp học */}
              <div className="flex items-center gap-2 pt-4 border-t border-outline-variant/60">
                {/* Nút Vào Lớp (Primary Action) */}
                <button
                  onClick={() => handleGoToClass(cls._id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary text-on-primary font-semibold rounded-xl text-sm hover:bg-primary-container hover:shadow-sm active:scale-[0.98] transition-all duration-200"
                >
                  <span className="material-symbols-outlined text-[18px]">login</span>
                  Vào lớp
                </button>

                {/* Nút Sửa Lớp (Secondary Action) */}
                <button
                  onClick={() => handleEditClass(cls)}
                  title="Sửa thông tin lớp"
                  className="p-2.5 text-on-surface-variant hover:text-primary hover:bg-primary/10 border border-outline-variant hover:border-primary/20 rounded-xl transition-all duration-200 active:scale-[0.95]"
                >
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>

                {/* Nút Xóa Lớp (Danger Action) */}
                <button
                  onClick={() => handleDeleteClass(cls._id)}
                  title="Xóa lớp học"
                  className="p-2.5 text-error hover:text-white hover:bg-error border border-outline-variant hover:border-error/20 rounded-xl transition-all duration-200 active:scale-[0.95]"
                >
                  <span className="material-symbols-outlined text-[20px]">delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <CreateClassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onCreated={handleClassCreated} />
    </main>
  );
};

export default ClassManagement;
