import axiosClient from "./axiosClient";
import type {
  PayrollListResponse,
  PayrollPeriodListResponse,
  PayrollPeriodResponse,
  PayrollCalculateResponse,
  PayrollResponse,
  PayrollConfigListResponse,
  PayrollConfigResponse,
  CreatePayrollPeriodPayload,
  CreatePayrollConfigPayload,
  PayrollQueryParams,
  MyPayrollQueryParams,
} from "../types/payroll";

// ============================================================
// PAYROLL API — 9 endpoints matching Backend contract exactly
// ============================================================

export const payrollApi = {
  // ——— TEACHER ——————————————————————————————————————————————

  /**
   * GET /payrolls/my
   * Auth: Teacher
   * Response: { success, items: IPayroll[], pagination }
   * CRITICAL: NO "data" wrapper — items is at response.data.items
   */
  getMyPayrolls: async (
    params?: MyPayrollQueryParams
  ): Promise<PayrollListResponse> => {
    const response = await axiosClient.get<PayrollListResponse>("/payrolls/my", {
      params,
    });
    return response.data;
  },

  // ——— ADMIN — Payrolls ————————————————————————————————————

  /**
   * GET /payrolls
   * Auth: Admin
   * Response: { success, items: IPayroll[], pagination }
   * CRITICAL: NO "data" wrapper — same pattern as getMyPayrolls
   */
  getAllPayrolls: async (
    params?: PayrollQueryParams
  ): Promise<PayrollListResponse> => {
    const response = await axiosClient.get<PayrollListResponse>("/payrolls", {
      params,
    });
    return response.data;
  },

  /**
   * POST /payrolls/:id/confirm
   * Auth: Admin
   * Body: (none)
   * Guard: Payroll must be CALCULATED
   * Response: { success, data: IPayroll }
   */
  confirmPayroll: async (payrollId: string): Promise<PayrollResponse> => {
    const response = await axiosClient.post<PayrollResponse>(
      `/payrolls/${payrollId}/confirm`
    );
    return response.data;
  },

  /**
   * POST /payrolls/:id/pay
   * Auth: Admin
   * Body: (none)
   * Guard: Payroll must be CONFIRMED
   * Response: { success, data: IPayroll }
   */
  payPayroll: async (payrollId: string): Promise<PayrollResponse> => {
    const response = await axiosClient.post<PayrollResponse>(
      `/payrolls/${payrollId}/pay`
    );
    return response.data;
  },

  // ——— ADMIN — PayrollPeriods ——————————————————————————————

  /**
   * GET /payrolls/periods
   * Auth: Admin
   * Response: { success, data: IPayrollPeriod[] } — no pagination
   */
  getPayrollPeriods: async (): Promise<PayrollPeriodListResponse> => {
    const response = await axiosClient.get<PayrollPeriodListResponse>(
      "/payrolls/periods"
    );
    return response.data;
  },

  /**
   * POST /payrolls/periods
   * Auth: Admin
   * Body: { name, startDate, endDate }
   * Response: { success, data: IPayrollPeriod } — HTTP 201
   */
  createPayrollPeriod: async (
    payload: CreatePayrollPeriodPayload
  ): Promise<PayrollPeriodResponse> => {
    const response = await axiosClient.post<PayrollPeriodResponse>(
      "/payrolls/periods",
      payload
    );
    return response.data;
  },

  /**
   * POST /payrolls/periods/:id/calculate
   * Auth: Admin
   * Body: (none)
   * Response: { success, message } — NO data payload
   * After this: must refetch payroll list to see results.
   */
  calculatePayroll: async (
    periodId: string
  ): Promise<PayrollCalculateResponse> => {
    const response = await axiosClient.post<PayrollCalculateResponse>(
      `/payrolls/periods/${periodId}/calculate`
    );
    return response.data;
  },

  // ——— ADMIN — PayrollConfig ————————————————————————————————

  /**
   * GET /payrolls/config
   * Auth: Admin
   * Response: { success, data: IPayrollConfig[] }
   */
  getPayrollConfigs: async (
    params?: { teacherId?: string }
  ): Promise<PayrollConfigListResponse> => {
    const response = await axiosClient.get<PayrollConfigListResponse>(
      "/payrolls/config",
      { params }
    );
    return response.data;
  },

  /**
   * POST /payrolls/config
   * Auth: Admin
   * Body: { teacherId, type, amount, effectiveFrom, effectiveTo?, status? }
   * Response: { success, data: IPayrollConfig } — HTTP 201
   */
  createPayrollConfig: async (
    payload: CreatePayrollConfigPayload
  ): Promise<PayrollConfigResponse> => {
    const response = await axiosClient.post<PayrollConfigResponse>(
      "/payrolls/config",
      payload
    );
    return response.data;
  },
};
