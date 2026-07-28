import axiosClient from "../../api/axiosClient";
import type { DashboardResponse } from "./dashboard.types";

export const dashboardService = {
  async getAdminDashboard(): Promise<DashboardResponse> {
    const res = await axiosClient.get("/api/dashboard/admin");
    return res.data.data;
  },
};
