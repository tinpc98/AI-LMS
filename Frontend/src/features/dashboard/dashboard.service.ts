import axiosClient from "../../api/axiosClient";
import type { DashboardResponse } from "./dashboard.types";

/**
 * Dashboard quản trị.
 *
 * ĐÃ GỠ getDashboardData() (275 dòng). Đó là bản dashboard chạy hoàn toàn bằng mock từ thời
 * chưa có API thật: nó tự bịa số liệu từ 6 file mock, kèm delay(300) giả lập mạng. Hàm này
 * chỉ có đúng một nơi gọi là hook useDashboard, mà hook đó KHÔNG còn màn hình nào dùng —
 * DashboardPage đã chuyển sang useDashboardQuery/getAdminDashboard (API thật) từ Wave 1.2.
 *
 * Nói cách khác nó là một vòng khép kín tự nuôi nhau, không dính tới phần còn lại của ứng
 * dụng. Nguy hiểm ở chỗ: mã chết trông y hệt mã sống, người đọc sau này dễ tưởng dashboard
 * vẫn đang chạy bằng dữ liệu bịa.
 */
export const dashboardService = {
  async getAdminDashboard(): Promise<DashboardResponse> {
    const res = await axiosClient.get("/api/dashboard/admin");
    return res.data.data;
  },
};
