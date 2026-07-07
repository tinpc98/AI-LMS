import axios from "axios";
import React, { useEffect, useState } from "react";
import type { IMyClass } from "../../interface/myClassInterface";
import JoinClassModal from "../../components/features/JoinClassModel";

const MyClassesContent = () => {
  const [myClasses, setMyClasses] = useState<IMyClass[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const getAllMyClasses = async (isMounted: boolean) => {
    try {
      // Bọc các hành động cập nhật trạng thái vào trong hàng đợi bất đồng bộ
      if (isMounted) {
        setIsLoading(true);
        setErrorMessage("");
      }

      const { data } = await axios.get("http://localhost:3000/myClasses");

      if (isMounted) {
        if (Array.isArray(data)) {
          setMyClasses(data);
        } else {
          throw new Error("Cấu trúc dữ liệu phản hồi không hợp lệ!");
        }
      }
    } catch (error: any) {
      console.error("🚨 Error fetching classes:", error);
      if (isMounted) {
        setErrorMessage(error.response?.data?.message || "Không thể kết nối đến máy chủ. Vui lòng thử lại sau!");
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

  return (
    <>
      <JoinClassModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />

      <main className="ml-[280px] min-h-screen flex flex-col pt-8">
        {/* Content Canvas */}
        <div className="p-margin-desktop max-w-max-content-width mx-auto w-full flex-1">
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div className="flex flex-col gap-5 mb-6">
              {/* Hàng 1: Tiêu đề trang và Nút bấm nằm song song sang 2 bên */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-4">
                <button
                  // SỬA LỖI 2: Đổi thành Arrow Function để tránh kích hoạt re-render vô hạn
                  onClick={() => setIsModalOpen(true)}
                  className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-black font-bold rounded-xl shadow-sm hover:bg-primary-container hover:shadow-md active:scale-[0.97] transition-all duration-150 ease-in-out"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  <span>Tham gia lớp học mới</span>
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="flex p-1 bg-surface-container rounded-xl">
              <button className="px-6 py-2 rounded-lg bg-surface-container-lowest text-primary font-bold shadow-sm transition-all text-label-md">
                Đang học
              </button>
              <button className="px-6 py-2 rounded-lg text-on-surface-variant hover:text-on-surface transition-all text-label-md">
                Đã hoàn thành
              </button>
            </div>
          </div>

          {/* Hiển thị thông báo lỗi hoặc trạng thái Loading nếu cần thiết */}
          {isLoading && <p className="text-center text-gray-500">Đang tải danh sách lớp học...</p>}
          {errorMessage && <p className="text-center text-red-500 mb-4">{errorMessage}</p>}

          {/* Class Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {myClasses.map((myclass) => (
              <div
                key={myclass.id}
                className="glass-card rounded-xl overflow-hidden group hover:shadow-xl transition-all duration-300 border border-outline-variant hover:border-primary-container/30"
              >
                {/* Thumbnail & AI Badge */}
                <div className="h-40 relative overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                    style={{
                      backgroundImage: `url(${myclass.thumbnailUrl})`,
                    }}
                  ></div>

                  {myclass.isAiRecommended && (
                    <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[12px] font-bold text-primary flex items-center gap-1 shadow-sm">
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      AI Recommended
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-headline-md text-headline-md font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
                      {myclass.title} - {myclass.subtitle}
                    </h3>
                    <button className="text-on-surface-variant hover:text-primary">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <img
                      className="w-8 h-8 rounded-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all"
                      src={myclass.teacher.avatarUrl}
                      alt={myclass.teacher.name}
                    />
                    <span className="text-body-sm text-on-surface-variant">{myclass.teacher.name}</span>
                  </div>

                  <div className="flex items-center gap-4 text-body-sm text-on-surface-variant mb-6">
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                      <span>{myclass.schedule.days.join(", ")}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">schedule</span>
                      <span>{myclass.schedule.time}</span>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex justify-between text-body-sm">
                      <span className="text-on-surface-variant">Tiến độ học tập</span>
                      <span className="font-bold text-primary">{myclass.progress}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${myclass.progress}%` }}
                      ></div>
                    </div>
                  </div>

                  <button className="w-full py-3 bg-surface-container-low text-primary border border-primary-container/20 rounded-lg font-bold hover:bg-primary-container/10 transition-all active:scale-[0.98] flex items-center justify-center gap-2">
                    <span>Vào lớp học</span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            ))}

            {/* Add New Class (Bento Placeholder) */}
            <div
              onClick={() => setIsModalOpen(true)} // Tận dụng mở modal khi click vào ô trống Bento này luôn
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

          {/* AI Insight Section */}
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
                Dựa trên tiến độ hiện tại của bạn trong lớp <span className="font-bold">Toán học 10</span>, AI dự đoán
                bạn có thể đạt điểm A nếu duy trì tốc độ làm bài tập như tuần vừa qua.
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
            <div className="w-full lg:w-72 aspect-square relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <div className="h-full flex flex-col justify-between">
                <p className="text-label-md font-medium opacity-80">Chỉ số tập trung</p>
                <div className="flex items-end justify-between h-32 gap-2">
                  <div className="w-full bg-white/20 rounded-t-sm h-[40%]"></div>
                  <div className="w-full bg-white/20 rounded-t-sm h-[60%]"></div>
                  <div className="w-full bg-white/40 rounded-t-sm h-[85%]"></div>
                  <div className="w-full bg-white/20 rounded-t-sm h-[50%]"></div>
                  <div className="w-full bg-white/60 rounded-t-sm h-[70%]"></div>
                  <div className="w-full bg-white rounded-t-sm h-[95%]"></div>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-[24px] font-bold">92%</span>
                  <span className="text-xs px-2 py-1 bg-green-500 rounded text-white font-bold">Excellent</span>
                </div>
              </div>
            </div>
            <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
            <div className="absolute -left-20 -top-20 w-80 h-80 bg-indigo-400/20 rounded-full blur-3xl"></div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-auto py-8 text-center text-on-surface-variant text-body-sm opacity-50">
          © 2026 Lumen AI - Hệ thống quản lý học tập thông minh
        </footer>
      </main>
    </>
  );
};

export default MyClassesContent;
