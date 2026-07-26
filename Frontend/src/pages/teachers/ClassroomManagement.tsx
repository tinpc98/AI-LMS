import { useEffect, useState, useMemo } from "react";
import { classApi } from "../../api/classApi";
import type { IClass } from "../../interface/ClassInterface";
import { useNavigate } from "react-router-dom";

const ClassManagement = () => {
  // --- STATE & DATA FETCHING LOGIC ---
  const [classes, setClasses] = useState<IClass[]>([]);
  const [isLoading, setIsLoading] = useState(false);
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

  // --- CÁC HÀM XỬ LÝ SỰ KIỆN ---
  const handleGoToClass = (classId: string) => {
    console.log("Điều hướng vào lớp học có ID:", classId);
    navigate(`/teacher/classroom-detail/${classId}`);
  };

  // --- LOGIC HỖ TRỢ GIAO DIỆN MỚI ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, active, completed, closed
  const [sortBy, setSortBy] = useState("newest"); // newest, name-asc, name-desc
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Xử lý sao chép nhanh mã lớp học
  const handleCopyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Tính toán thống kê dữ liệu lớp học
  const stats = useMemo(() => {
    const total = classes.length;
    const active = classes.filter((c) => c.status === "active" || !c.status).length;
    const completed = classes.filter((c) => c.status === "completed").length;
    const closed = classes.filter((c) => c.status === "closed").length;
    const totalStudents = classes.reduce((sum, c) => sum + (c.students?.length || 0), 0);
    return { total, active, completed, closed, totalStudents };
  }, [classes]);

  // Bộ lọc và sắp xếp lớp học
  const filteredAndSortedClasses = useMemo(() => {
    let result = [...classes];

    // 1. Tìm kiếm theo tên lớp hoặc mã tham gia
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) => c.className?.toLowerCase().includes(term) || c.joinCode?.toLowerCase().includes(term),
      );
    }

    // 2. Lọc theo trạng thái lớp học
    if (statusFilter !== "all") {
      result = result.filter((c) => {
        const status = c.status || "active";
        return status === statusFilter;
      });
    }

    // 3. Sắp xếp danh sách
    result.sort((a, b) => {
      if (sortBy === "name-asc") {
        return a.className.localeCompare(b.className);
      }
      if (sortBy === "name-desc") {
        return b.className.localeCompare(a.className);
      }
      // Mặc định: Mới nhất lên trước
      return b._id.localeCompare(a._id);
    });

    return result;
  }, [classes, searchTerm, statusFilter, sortBy]);

  // Tạo màu gradient ngẫu nhiên cho avatar lớp học
  const getGradientClass = (name: string) => {
    const hash = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const gradients = [
      "from-indigo-500 to-purple-600 text-white",
      "from-blue-500 to-indigo-600 text-white",
      "from-emerald-400 to-teal-600 text-white",
      "from-rose-500 to-pink-600 text-white",
      "from-amber-400 to-orange-500 text-white",
      "from-violet-500 to-fuchsia-600 text-white",
    ];
    return gradients[hash % gradients.length];
  };

  return (
    <main className="ml-[280px] flex-1 flex flex-col relative min-w-0 pt-16 bg-slate-50/50 min-h-screen font-sans selection:bg-indigo-500/20">
      {/* Container chính */}
      <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* SECTION 1: HEADER & STATS BANNER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-50/90 via-purple-50/80 to-pink-50/60 p-6 md:p-8 text-slate-800 shadow-sm border border-indigo-100/50 backdrop-blur-md">
          {/* Họa tiết nền mờ ảo - Đổi sang màu sáng dịu bắt mắt */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-purple-300/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              {/* Huy hiệu nhỏ phía trên */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 border border-indigo-200/50 mb-3 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                Hệ thống E-Learning
              </span>
              {/* Tiêu đề chính chữ đậm màu slate sâu */}
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">Quản lý lớp học</h2>
              <p className="text-slate-500 text-sm mt-2 max-w-xl font-medium leading-relaxed">
                Theo dõi trạng thái, quản lý học sinh và điều phối hoạt động giảng dạy trong các lớp học được phân công.
              </p>
            </div>
          </div>

          {/* Dashboard Thống kê Số liệu (Grid các hộp số liệu trắng mờ kính) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-indigo-100/70">
            {/* Hộp 1: Tổng số lớp */}
            <div className="bg-white/70 backdrop-blur-md border border-white p-4 rounded-2xl flex items-center gap-3 shadow-sm hover:scale-[1.02] transition-transform duration-300">
              <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100/30">
                <span className="material-symbols-outlined block text-xl">school</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">Tổng số lớp</div>
              </div>
            </div>

            {/* Hộp 2: Đang hoạt động */}
            <div className="bg-white/70 backdrop-blur-md border border-white p-4 rounded-2xl flex items-center gap-3 shadow-sm hover:scale-[1.02] transition-transform duration-300">
              <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100/30">
                <span className="material-symbols-outlined block text-xl">sensors</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.active}</div>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">Đang hoạt động</div>
              </div>
            </div>

            {/* Hộp 3: Đã hoàn thành */}
            <div className="bg-white/70 backdrop-blur-md border border-white p-4 rounded-2xl flex items-center gap-3 shadow-sm hover:scale-[1.02] transition-transform duration-300">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100/30">
                <span className="material-symbols-outlined block text-xl">verified</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.completed}</div>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">Đã hoàn thành</div>
              </div>
            </div>

            {/* Hộp 4: Tổng học sinh */}
            <div className="bg-white/70 backdrop-blur-md border border-white p-4 rounded-2xl flex items-center gap-3 shadow-sm hover:scale-[1.02] transition-transform duration-300">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-100/30">
                <span className="material-symbols-outlined block text-xl">groups</span>
              </div>
              <div>
                <div className="text-2xl font-bold text-slate-900">{stats.totalStudents}</div>
                <div className="text-xs text-slate-500 font-semibold mt-0.5">Tổng học sinh</div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: CONTROLS (TÌM KIẾM & BỘ LỌC) */}
        <div className="bg-white border border-slate-100 shadow-sm rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Ô Tìm kiếm */}
          <div className="relative flex-1 max-w-md">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Tìm theo tên lớp hoặc mã lớp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-sm focus:outline-none focus:border-indigo-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>

          {/* Bộ lọc & Sắp xếp */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Lọc theo trạng thái */}
            <div className="flex bg-slate-50 p-1 rounded-2xl border border-slate-200/60">
              {[
                { label: "Tất cả", value: "all" },
                { label: "Đang mở", value: "active" },
                { label: "Đã hoàn thành", value: "completed" },
                { label: "Đã đóng", value: "closed" },
              ].map((pill) => (
                <button
                  key={pill.value}
                  onClick={() => setStatusFilter(pill.value)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer ${
                    statusFilter === pill.value
                      ? "bg-white text-slate-900 shadow-sm font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Sắp xếp */}
            <div className="relative min-w-[150px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200/80 rounded-2xl py-3 pl-4 pr-10 text-xs font-semibold text-slate-600 appearance-none focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="newest">Mới nhất</option>
                <option value="name-asc">Tên: A-Z</option>
                <option value="name-desc">Tên: Z-A</option>
              </select>
              <span className="material-symbols-outlined absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none text-[18px]">
                unfold_more
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 3: DANH SÁCH THẺ LỚP HỌC */}

        {/* Loading State - Skeletons */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-white border border-slate-100 rounded-3xl p-6 space-y-6 shadow-sm animate-pulse"
              >
                <div className="flex gap-4">
                  <div className="w-14 h-14 bg-slate-100 rounded-2xl"></div>
                  <div className="flex-1 space-y-2 py-1">
                    <div className="h-4 bg-slate-100 rounded w-3/4"></div>
                    <div className="h-3 bg-slate-100 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-8 bg-slate-50 rounded-2xl w-full"></div>
                </div>
                <div className="pt-4 border-t border-slate-100 flex gap-2">
                  <div className="h-10 bg-slate-100 rounded-2xl flex-1"></div>
                  <div className="h-10 bg-slate-100 rounded-2xl w-10"></div>
                  <div className="h-10 bg-slate-100 rounded-2xl w-10"></div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAndSortedClasses.length === 0 ? (
          /* Empty State - Không có lớp học */
          <div className="flex flex-col items-center justify-center bg-white border border-slate-100 rounded-3xl p-16 text-center shadow-sm">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-[40px]">class</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Không tìm thấy lớp học nào</h3>
            <p className="text-slate-500 text-sm mt-2 max-w-sm">
              {searchTerm || statusFilter !== "all"
                ? "Hãy thử thay đổi từ khóa tìm kiếm hoặc gỡ bộ lọc trạng thái xem sao."
                : "Hiện tại bạn chưa được phân công lớp học nào. Vui lòng liên hệ Admin."}
            </p>
            {searchTerm || statusFilter !== "all" && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                }}
                className="mt-6 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-all cursor-pointer"
              >
                Đặt lại bộ lọc
              </button>
            )}
          </div>
        ) : (
          /* Lưới thẻ danh sách lớp học */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedClasses.map((cls) => {
              const classStatus = cls.status || "active";
              return (
                <div
                  key={cls._id}
                  className="group relative bg-white border border-slate-100 rounded-3xl p-6 flex flex-col justify-between shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Viền màu trạng thái mỏng phía trên cùng thẻ */}
                  <div
                    className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-3xl transition-all duration-300 ${
                      classStatus === "active"
                        ? "bg-emerald-500 group-hover:h-2"
                        : classStatus === "completed"
                          ? "bg-amber-500 group-hover:h-2"
                          : "bg-rose-500 group-hover:h-2"
                    }`}
                  ></div>

                  <div>
                    {/* Hàng Header Thẻ */}
                    <div className="flex items-start gap-4 mb-5">
                      {/* Avatar ký tự đầu tiên với Gradient sống động */}
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-inner bg-gradient-to-br ${getGradientClass(cls.className)}`}
                      >
                        {cls.className ? cls.className.charAt(0).toUpperCase() : "C"}
                      </div>

                      <div className="flex-1 min-w-0">
                        {/* Huy hiệu trạng thái */}
                        <div className="flex items-center gap-1.5 mb-1">
                          {classStatus === "active" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              Đang mở
                            </span>
                          ) : classStatus === "completed" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-50 text-amber-600 border border-amber-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              Hoàn thành
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-50 text-rose-600 border border-rose-100">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                              Đã đóng
                            </span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 tracking-tight group-hover:text-indigo-600 transition-colors line-clamp-1">
                          {cls.className}
                        </h3>
                      </div>
                    </div>

                    {/* Chi tiết sĩ số & Mã lớp */}
                    <div className="space-y-2.5 mb-6">
                      {/* Sĩ số lớp */}
                      <div className="flex items-center justify-between text-xs bg-slate-50 border border-slate-100 rounded-xl px-3 py-2 text-slate-600">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-slate-400">group</span>
                          Sĩ số lớp:
                        </span>
                        <span className="font-bold text-slate-800">{cls.students?.length || 0} học sinh</span>
                      </div>

                      {/* Mã lớp tham gia */}
                      <div className="flex items-center justify-between text-xs bg-indigo-50/50 border border-indigo-100/50 rounded-xl px-3 py-2 text-indigo-950">
                        <span className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-indigo-400">key</span>
                          Mã tham gia:
                        </span>

                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-indigo-600 tracking-wider text-sm">
                            {cls.joinCode}
                          </span>
                          <button
                            onClick={() => handleCopyCode(cls._id, cls.joinCode)}
                            title="Sao chép mã"
                            className="p-1 rounded bg-white border border-indigo-100 text-indigo-500 hover:text-indigo-700 hover:border-indigo-300 transition-all cursor-pointer relative animate-none"
                          >
                            <span className="material-symbols-outlined text-[14px] block">
                              {copiedCodeId === cls._id ? "check" : "content_copy"}
                            </span>
                            {copiedCodeId === cls._id && (
                              <span className="absolute bottom-full right-1/2 translate-x-1/2 mb-1 px-1.5 py-0.5 text-[8px] bg-slate-900 text-white rounded font-sans whitespace-nowrap shadow">
                                Đã chép
                              </span>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Nhóm nút chức năng */}
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                    {/* Nút Vào Lớp */}
                    <button
                      onClick={() => handleGoToClass(cls._id)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-bold rounded-2xl text-xs tracking-wide shadow-md shadow-indigo-600/10 hover:bg-indigo-700 hover:shadow-indigo-600/20 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">logout</span>
                      Vào lớp
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
};

export default ClassManagement;
