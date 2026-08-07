import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient from "../../../api/axiosClient";

export default function ExamResults() {
  const { examId } = useParams();

  const [studentList, setStudentList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [examInfo, setExamInfo] = useState<any>(null);

  useEffect(() => {
    const fetchExamData = async (isFirstLoad = false) => {
      try {
        if (isFirstLoad) setIsLoading(true);

        // 1. Gọi API lấy danh sách học sinh làm bài
        const resAttempts = await axiosClient.get(`/api/exam-attempts/exam/${examId}`);
        setStudentList(resAttempts.data.data || []);

        // 2. GỌI API LẤY CHI TIẾT KỲ THI ĐỂ HIỆN TÊN (Chỉ gọi lần đầu tiên)
        if (isFirstLoad) {
          try {
            const resExam = await axiosClient.get(`/api/exams/${examId}`);
            const examData = resExam.data.data || resExam.data;
            setExamInfo({
              title: examData.title || "Kỳ thi không xác định",
              totalStudents: resAttempts.data.data.length,
            });
          } catch (err) {
            console.error("Chưa lấy được tên kỳ thi:", err);
          }
        }
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu kết quả:", error);
      } finally {
        if (isFirstLoad) setIsLoading(false);
      }
    };

    if (examId) fetchExamData(true);

    const pollingInterval = setInterval(() => {
      if (examId) fetchExamData(false);
    }, 5000);

    return () => clearInterval(pollingInterval);
  }, [examId]);

  // Cấu hình giao diện theo trạng thái
  const getStatusConfig = (status: any) => {
    const configs: Record<string, any> = {
      GRADED: {
        label: "Đã chấm",
        containerColor: "bg-white border-gray-200 hover:border-primary/30",
        badgeColor: "bg-green-100 text-green-700 border-green-200",
        icon: "verified_user",
        iconText: "Đã chốt",
        iconColor: "text-green-700 bg-green-100 border-green-200",
        scoreColor: "text-primary",
      },
      SUBMITTED: {
        label: "Đã nộp",
        containerColor: "bg-white border-gray-200 hover:border-primary/30",
        badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
        icon: "task_alt",
        iconText: "Đã nộp",
        iconColor: "text-blue-700 bg-blue-100 border-blue-200",
        scoreColor: "text-gray-400",
      },
      PARTIALLY_GRADED: {
        label: "Chờ chấm TL",
        containerColor: "bg-yellow-50/30 border-yellow-200 hover:border-yellow-400",
        badgeColor: "bg-yellow-100 text-yellow-700 border-yellow-200",
        icon: "rate_review",
        iconText: "Chờ chấm",
        iconColor: "text-yellow-700 bg-yellow-100 border-yellow-200",
        scoreColor: "text-yellow-600",
      },
      IN_PROGRESS: {
        label: "Đang làm",
        containerColor: "bg-gray-50/30 border-gray-200 hover:border-gray-400",
        badgeColor: "bg-gray-100 text-gray-600 border-gray-200",
        icon: "timer",
        iconText: "Đang làm",
        iconColor: "text-gray-600 bg-gray-100 border-gray-200",
        scoreColor: "text-gray-400",
      },
    };
    return configs[status] ?? configs.IN_PROGRESS;
  };

  return (
    <main className="ml-[280px] pt-16 min-h-screen font-body-md bg-surface">
      <div className="w-full max-w-7xl mx-auto p-6 md:p-8 animate-in fade-in duration-500">
        {/* HEADER & BREADCRUMBS */}
        <div className="mb-8">
          <nav className="flex items-center gap-2 text-gray-500 text-sm mb-4">
            <Link to="/teacher" className="hover:text-primary transition-colors font-medium">
              Quản lý kỳ thi
            </Link>
            <span className="material-symbols-outlined text-base">chevron_right</span>
            <span className="text-gray-900 font-semibold">Kết quả</span>
          </nav>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                {examInfo ? examInfo.title : "Đang tải dữ liệu kỳ thi..."}
              </h2>
              <p className="text-gray-500 mt-2 font-medium">
                Tổng cộng: <span className="text-primary font-bold">{studentList.length || 0}</span>{" "}
                học sinh tham gia
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <select className="bg-white border border-gray-300 text-gray-700 rounded-xl text-sm px-4 py-2.5 outline-none shadow-sm cursor-pointer">
                <option value="">Tất cả Trạng thái</option>
                <option value="GRADED">Đã chấm</option>
                <option value="SUBMITTED">Đã nộp (chờ chấm)</option>
                <option value="PARTIALLY_GRADED">Chờ chấm tự luận</option>
                <option value="IN_PROGRESS">Đang làm bài</option>
              </select>
              <button className="bg-primary text-white font-bold text-sm py-2.5 px-6 rounded-xl shadow-md hover:bg-primary/90 transition-all flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">download</span>
                Xuất Excel
              </button>
            </div>
          </div>
        </div>

        {/* GRID KẾT QUẢ (CARDS) */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20 text-gray-500">
            <span className="material-symbols-outlined animate-spin text-4xl mr-3 text-primary">
              progress_activity
            </span>
            Đang tải danh sách thí sinh...
          </div>
        ) : studentList.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <span className="material-symbols-outlined text-4xl text-gray-300 mb-2">
              sentiment_dissatisfied
            </span>
            <p className="text-gray-500">Chưa có thí sinh nào hoàn thành bài thi này.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 2xl:grid-cols-3 gap-4">
            {studentList.map((item) => {
              const currentStatus = getStatusConfig(item.status);

              // Lấy thông tin học sinh từ trường populate studentId trong MongoDB
              const student = item.studentId || {};
              const studentName = student.fullName || "Học sinh";
              const studentCode = student.studentCode || `STU-${item._id.slice(-6).toUpperCase()}`;
              const className = student.className || "10A1";

              return (
                <Link
                  to={`/teacher/exam-review/${item._id}`}
                  key={item._id}
                  className={`${currentStatus.containerColor} rounded-2xl border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative flex flex-col h-full p-5`}
                >
                  {/* Badge Trạng thái */}
                  <div className="absolute top-4 right-4 z-10">
                    <span
                      className={`${currentStatus.badgeColor} border text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider`}
                    >
                      {currentStatus.label}
                    </span>
                  </div>

                  {/* Info */}
                  <div className="flex items-start gap-4 mb-6 pr-12">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 flex-shrink-0 shadow-sm border-gray-100 group-hover:border-primary">
                      <img
                        className="w-full h-full object-cover"
                        alt={studentName}
                        src={
                          student.avatar ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=random`
                        }
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3
                        className="font-bold text-lg truncate text-gray-900 group-hover:text-primary transition-colors"
                        title={studentName}
                      >
                        {studentName}
                      </h3>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-gray-500 text-xs mt-1">
                        <span className="flex items-center gap-1 font-medium">
                          <span className="material-symbols-outlined text-[14px]">badge</span>
                          {studentCode}
                        </span>
                        <span>•</span>
                        <span className="font-medium text-gray-700">Lớp {className}</span>
                      </div>
                    </div>
                  </div>

                  {/* Score & Timer Box */}
                  <div
                    className={`mt-auto border-t pt-4 flex justify-between items-end ${item.status === "ALERT" ? "bg-red-50/50" : item.status === "REVIEW" ? "bg-yellow-50/50" : "bg-transparent"}`}
                  >
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest mb-1 text-gray-500">
                        Score
                      </p>
                      <p className={`font-bold text-3xl ${currentStatus.scoreColor}`}>
                        {item.totalScore !== undefined && item.totalScore !== null
                          ? item.totalScore
                          : "--"}
                        <span className="text-sm font-medium text-gray-400">/10</span>
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-1 text-gray-500 text-xs font-medium">
                        <span className="material-symbols-outlined text-[14px]">timer</span>
                        {item.duration || "42:15"}
                      </div>
                      <div
                        className={`flex items-center gap-1 border px-2.5 py-0.5 rounded-md text-[10px] font-bold ${currentStatus.iconColor}`}
                      >
                        <span className="material-symbols-outlined text-[14px] fill-current">
                          {currentStatus.icon}
                        </span>
                        {currentStatus.iconText}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
