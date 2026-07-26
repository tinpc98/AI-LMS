import axios from "axios";
import { useEffect, useState, useMemo } from "react";
import { classApi } from "../../api/classApi";
import type { IClass } from "../../interface/ClassInterface";
import { useNavigate } from "react-router-dom";
import PageContainer from "../../components/common/PageContainer";

const MyClassesContent = () => {
  // --- STATE & API LOGIC ---
  const [myClasses, setMyClasses] = useState<IClass[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const navigate = useNavigate();

  const getAllMyClasses = async (isMounted: boolean) => {
    try {
      if (isMounted) {
        setIsLoading(true);
        setErrorMessage("");
      }
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

  const handleGoToClass = (classId: string) => {
    console.log("Điều hướng vào lớp học có ID:", classId);
    navigate(`/classdetail/${classId}`);
  };

  // --- LOGIC HỖ TRỢ BỘ LỌC TABS (ĐANG HỌC / ĐÃ HOÀN THÀNH) ---
  const [activeTab, setActiveTab] = useState<"learning" | "completed">("learning");

  // Lọc danh sách lớp học dựa theo tab hoạt động
  const displayedClasses = useMemo(() => {
    return myClasses.filter((c) => {
      if (activeTab === "learning") {
        return c.status === "active" || !c.status;
      }
      return c.status === "completed";
    });
  }, [myClasses, activeTab]);

  // Sinh màu gradient ngẫu nhiên dựa trên tên lớp làm hình nền banner thẻ
  const getBannerGradient = (name: string) => {
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      "from-indigo-600 to-violet-750",
      "from-blue-600 to-indigo-700",
      "from-emerald-500 to-teal-700",
      "from-violet-600 to-fuchsia-750",
      "from-cyan-500 to-blue-700",
      "from-rose-500 to-pink-700",
    ];
    return gradients[hash % gradients.length];
  };

  return (
    <PageContainer>
      <div className="w-full flex-1 space-y-8">
          {/* PAGE HEADER & CONTROLS */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
            <div>
              <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Lớp học của tôi</h2>
              <p className="text-slate-500 text-sm mt-1">
                Quản lý tiến trình học tập và theo dõi kết quả trong các lớp học được phân công.
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap md:flex-nowrap">
              {/* Tabs chuyển đổi bộ lọc trạng thái */}
              <div className="flex p-1 bg-slate-200/60 backdrop-blur-sm rounded-2xl border border-slate-200/40">
                <button
                  onClick={() => setActiveTab("learning")}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "learning"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Đang học
                </button>
                <button
                  onClick={() => setActiveTab("completed")}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === "completed"
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Đã hoàn thành
                </button>
              </div>
            </div>
          </div>

          {/* HIỂN THỊ LỖI NẾU CÓ */}
          {errorMessage && (
            <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-sm font-medium">
              <span className="material-symbols-outlined text-[20px]">error</span>
              <p>{errorMessage}</p>
            </div>
          )}

          {/* CLASS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Trạng thái Loading Skeletons */}
            {isLoading ? (
              [1, 2, 3].map((n) => (
                <div
                  key={n}
                  className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm animate-pulse h-[360px] flex flex-col"
                >
                  <div className="h-32 bg-slate-100"></div>
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="h-5 bg-slate-100 rounded w-3/4"></div>
                      <div className="h-4 bg-slate-100 rounded w-1/2"></div>
                    </div>
                    <div className="h-10 bg-slate-50 rounded-xl"></div>
                    <div className="h-10 bg-slate-100 rounded-xl"></div>
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Render danh sách lớp học */}
                {displayedClasses.map((myclass) => {
                  const isClassActive = myclass.status === "active" || !myclass.status;
                  return (
                    <div
                      key={myclass._id}
                      className="group bg-white border border-slate-100 rounded-3xl overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                    >
                      {/* Thẻ Banner Gradient màu sinh động thay thế ảnh */}
                      <div
                        className={`h-32 relative bg-gradient-to-br ${getBannerGradient(myclass.className)} flex items-center justify-center`}
                      >
                        {/* Họa tiết lưới chìm tinh tế */}
                        <div className="absolute inset-0 bg-white/[0.03] bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
                        <span className="material-symbols-outlined text-white/40 text-[48px] relative z-10 group-hover:scale-110 transition-transform duration-300">
                          school
                        </span>

                        {/* Huy hiệu trạng thái trên Banner */}
                        <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold tracking-wide text-white border border-white/20 shadow-sm uppercase">
                          {isClassActive ? "Đang học" : "Đã hoàn thành"}
                        </div>
                      </div>

                      {/* Nội dung Thẻ */}
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          {/* Dòng Tiêu đề */}
                          <div className="flex justify-between items-start mb-4 gap-3">
                            <h3 className="font-bold text-lg text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                              {myclass.className}
                            </h3>
                            <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer">
                              <span className="material-symbols-outlined block text-[20px]">more_vert</span>
                            </button>
                          </div>

                          {/* Thông tin giáo viên */}
                          <div className="flex items-center gap-2.5 mb-5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600">
                              {myclass.teacherId?.fullName?.charAt(0) ?? "?"}
                            </div>
                            <span className="text-xs font-medium text-slate-500">
                              GV:{" "}
                              <span className="text-slate-700 font-semibold">
                                {myclass.teacherId?.fullName ?? "Chưa rõ giáo viên"}
                              </span>
                            </span>
                          </div>

                          {/* Thống kê thông tin lớp */}
                          <div className="grid grid-cols-2 gap-2 mb-6">
                            {/* Học sinh */}
                            <div className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-600 font-medium">
                              <span className="material-symbols-outlined text-[16px] text-slate-400">groups</span>
                              <span>{myclass.students?.length ?? 0} học sinh</span>
                            </div>
                            {/* Mã lớp */}
                            <div className="flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-50/50 border border-indigo-100/30 rounded-xl text-xs text-indigo-700 font-semibold">
                              <span className="material-symbols-outlined text-[16px] text-indigo-400">key</span>
                              <span className="uppercase font-mono tracking-wider">{myclass.joinCode}</span>
                            </div>
                          </div>
                        </div>

                        {/* Nút Vào học */}
                        <button
                          onClick={() => handleGoToClass(myclass._id)}
                          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 hover:shadow-indigo-600/10 hover:shadow-md text-white font-bold rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 text-xs tracking-wide cursor-pointer"
                        >
                          <span>Vào lớp học</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Thẻ Thêm lớp học mới (Dạng Dash card) */}
                <div
                  onClick={() => alert("Tính năng tham gia lớp học qua mã sắp ra mắt!")}
                  className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-3xl flex flex-col items-center justify-center p-8 text-center bg-white/50 hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer min-h-[330px] group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 text-indigo-600">
                    <span className="material-symbols-outlined text-[26px]">add</span>
                  </div>
                  <h3 className="font-bold text-slate-800 mb-1.5 text-base">Tham gia lớp học mới</h3>
                  <p className="text-xs text-slate-400 max-w-[200px] leading-relaxed">
                    Sử dụng mã lớp học hoặc tham gia khóa học mới từ hệ thống.
                  </p>
                </div>
              </>
            )}
          </div>

          {/* AI Insight Section (Giữ nguyên nội dung, nâng cấp thẩm mỹ) */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-855 to-indigo-950 p-6 md:p-8 text-white shadow-xl">
            {/* Họa tiết phát sáng ngầm */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/15 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span
                    className="material-symbols-outlined text-indigo-400 animate-pulse"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    auto_awesome
                  </span>
                  <span className="text-[10px] font-bold tracking-widest uppercase text-indigo-300">
                    AI Learning Insight
                  </span>
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight">Dự đoán kết quả học tập</h3>
                <p className="text-slate-350 text-sm max-w-3xl leading-relaxed">
                  Dựa trên tiến độ học tập hiện tại của bạn, AI dự đoán bạn có thể đạt **điểm A** nếu duy trì tốc độ làm
                  bài tập như tuần vừa qua.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 self-stretch sm:self-auto justify-start sm:justify-end">
                <button className="px-5 py-3 bg-white text-slate-900 font-bold rounded-2xl hover:shadow-lg transition-all active:scale-[0.97] cursor-pointer text-xs">
                  Xem phân tích chi tiết
                </button>
                <button className="px-5 py-3 border border-white/20 hover:bg-white/10 hover:border-white/30 text-white font-bold rounded-2xl transition-all active:scale-[0.97] cursor-pointer text-xs">
                  Lịch học tiếp theo
                </button>
              </div>
            </div>
          </div>

        {/* FOOTER */}
        <footer className="mt-auto py-8 text-center text-slate-400 text-xs font-medium border-t border-slate-100">
          © 2026 Lumen AI - Hệ thống quản lý học tập thông minh
        </footer>
      </div>
    </PageContainer>
  );
};

export default MyClassesContent;
