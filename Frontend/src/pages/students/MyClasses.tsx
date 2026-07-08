import axios from "axios";
import React, { useEffect, useState } from "react";
import JoinClassModel from "../../components/features/JoinClassModel";
import { classApi } from "../../api/classApi";
import type { IClass } from "../../interface/classInterface";

const MyClassesContent = () => {
  const [myClasses, setMyClasses] = useState<IClass[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const getAllMyClasses = async (isMounted: boolean) => {
    try {
      if (isMounted) {
        setIsLoading(true);
        setErrorMessage("");
      }

      // Response thật có dạng { message, data: [...] } -> phải lấy res.data.data
      const res = await classApi.getMyClasses();
      const classList = res.data?.data;

      if (isMounted) {
        if (Array.isArray(classList)) {
          setMyClasses(classList);
        } else {
          throw new Error("Cấu trúc dữ liệu phản hồi không hợp lệ!");
        }
      }
    } catch (error: unknown) {
      console.error("🚨 Error fetching classes:", error);
      if (isMounted) {
        if (axios.isAxiosError(error)) {
          setErrorMessage(error.response?.data?.message || "Không thể kết nối đến máy chủ. Vui lòng thử lại sau!");
        } else {
          setErrorMessage("Đã xảy ra lỗi không xác định.");
        }
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      await getAllMyClasses(isMounted);
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleJoined = (joinedClass: IClass) => {
    // Thêm lớp vừa tham gia vào danh sách hiển thị ngay, không cần load lại trang
    setMyClasses((prev) => [joinedClass, ...prev]);
  };

  return (
    <>
      <JoinClassModel isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onJoined={handleJoined} />

      <main className="ml-[280px] min-h-screen flex flex-col pt-8">
        <div className="p-margin-desktop max-w-max-content-width mx-auto w-full flex-1">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div className="flex flex-col gap-5 mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-black font-bold rounded-xl shadow-sm hover:bg-primary-container hover:shadow-md active:scale-[0.97] transition-all duration-150 ease-in-out"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  <span>Tham gia lớp học mới</span>
                </button>
              </div>
            </div>

            <div className="flex p-1 bg-surface-container rounded-xl">
              <button className="px-6 py-2 rounded-lg bg-surface-container-lowest text-primary font-bold shadow-sm transition-all text-label-md">
                Đang học
              </button>
              <button className="px-6 py-2 rounded-lg text-on-surface-variant hover:text-on-surface transition-all text-label-md">
                Đã hoàn thành
              </button>
            </div>
          </div>

          {isLoading && <p className="text-center text-gray-500">Đang tải danh sách lớp học...</p>}
          {errorMessage && <p className="text-center text-red-500 mb-4">{errorMessage}</p>}

          {/* Class Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {myClasses.map((myclass) => (
              <div
                key={myclass._id}
                className="glass-card rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300 border border-outline-variant hover:border-primary-container/30"
              >
                {/* Thay banner ảnh (backend chưa có thumbnailUrl) bằng khối màu + icon */}
                <div className="h-32 relative overflow-hidden bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-[40px]">school</span>
                  <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-bold text-primary shadow-sm uppercase">
                    {myclass.status === "active" ? "Đang hoạt động" : "Đã hoàn thành"}
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                      {myclass.className}
                    </h3>
                    <button className="text-on-surface-variant hover:text-primary">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-[11px] font-bold text-primary">
                      {myclass.teacherId?.fullName?.charAt(0) ?? "?"}
                    </div>
                    <span className="text-body-sm text-on-surface-variant">
                      {myclass.teacherId?.fullName ?? "Chưa rõ giáo viên"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-body-sm text-on-surface-variant mb-6">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">groups</span>
                      <span>{myclass.students?.length ?? 0} học sinh</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">key</span>
                      <span className="uppercase font-code-sm">{myclass.joinCode}</span>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-surface-container-low text-primary border border-primary-container/20 rounded-lg font-bold hover:bg-primary-container/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                    <span>Vào lớp học</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Add New Class */}
            <div
              onClick={() => setIsModalOpen(true)}
              className="border-2 border-dashed border-outline-variant rounded-xl flex flex-col items-center justify-center p-8 text-center group hover:border-primary hover:bg-primary/5 transition-all cursor-pointer"
            >
              <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-primary text-[32px]">add</span>
              </div>
              <h3 className="font-headline-md text-headline-md font-bold text-on-surface mb-1">Thêm lớp học mới</h3>
              <p className="text-body-sm text-on-surface-variant max-w-[200px]">
                Sử dụng mã lớp học hoặc tìm kiếm khóa học mới
              </p>
            </div>
          </div>

          {/* AI Insight Section (giữ nguyên, không đổi) */}
          <div className="mt-16 bg-primary-container rounded-2xl p-8 text-white relative overflow-hidden flex flex-col lg:flex-row items-center gap-8">
            <div className="relative z-10 flex-1">
              <div className="flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                  auto_awesome
                </span>
                <span className="font-label-md tracking-widest uppercase opacity-80">AI Learning Insight</span>
              </div>
              <h3 className="font-headline-lg text-headline-lg mb-4">Dự đoán kết quả học tập</h3>
              <p className="font-body-lg text-body-lg mb-6 opacity-90 max-w-2xl">
                Dựa trên tiến độ hiện tại của bạn, AI dự đoán bạn có thể đạt điểm A nếu duy trì tốc độ làm bài tập như
                tuần vừa qua.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="px-6 py-3 bg-white text-primary font-bold rounded-xl hover:shadow-lg transition-all">
                  Xem phân tích chi tiết
                </button>
                <button className="px-6 py-3 border border-white/30 hover:bg-white/10 text-white font-bold rounded-xl transition-all">
                  Lịch học tiếp theo
                </button>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-auto py-8 text-center text-on-surface-variant text-body-sm opacity-50">
          © 2026 Lumen AI - Hệ thống quản lý học tập thông minh
        </footer>
      </main>
    </>
  );
};

export default MyClassesContent;
