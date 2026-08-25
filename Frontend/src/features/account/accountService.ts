import axiosClient from "../../api/axiosClient";
import type {
  AccountFilters,
  AccountFormValues,
  AccountRecord,
  ApiResponse,
} from "./account.types";

const mapUser = (user: any): AccountRecord => ({
  ...user,
  id: user._id || user.id,
});

export const accountService = {
  async getAccounts(filters: AccountFilters): Promise<ApiResponse<AccountRecord[]>> {
    // Clean up empty filters
    const params: Record<string, any> = { ...filters };
    if (params.role === "All") delete params.role;
    if (params.status === "All") delete params.status;
    if (!params.search) delete params.search;

    const response = await axiosClient.get("/users", { params });
    return { ...response.data, data: response.data.data.map(mapUser) };
  },

  async getAccountById(id: string): Promise<ApiResponse<AccountRecord>> {
    const response = await axiosClient.get(`/users/${id}`);
    return { ...response.data, data: mapUser(response.data.data) };
  },

  async createAccount(payload: AccountFormValues): Promise<ApiResponse<AccountRecord>> {
    const response = await axiosClient.post("/users", payload);
    return { ...response.data, data: mapUser(response.data.data) };
  },

  async updateAccount(id: string, payload: AccountFormValues): Promise<ApiResponse<AccountRecord>> {
    const response = await axiosClient.put(`/users/${id}`, payload);
    return { ...response.data, data: mapUser(response.data.data) };
  },

  async updateStatus(id: string, status: "Active" | "Locked"): Promise<ApiResponse<AccountRecord>> {
    const response = await axiosClient.put(`/users/${id}`, { status });
    return { ...response.data, data: mapUser(response.data.data) };
  },

  async resetPassword(id: string): Promise<void> {
    // Assuming backend has a reset password endpoint, or use update if none
    await axiosClient.put(`/users/${id}`, { password: "defaultPassword123!" });
  },

  async deleteAccount(id: string): Promise<ApiResponse<void>> {
    const response = await axiosClient.delete(`/users/${id}`);
    return response.data;
  },

  async getTrashUsers(filters: AccountFilters): Promise<ApiResponse<AccountRecord[]>> {
    const params: Record<string, any> = { ...filters };
    if (params.role === "All") delete params.role;
    if (params.status === "All") delete params.status;
    if (!params.search) delete params.search;

    const response = await axiosClient.get("/users/trash", { params });
    return { ...response.data, data: response.data.data.map(mapUser) };
  },

  async restoreUser(id: string): Promise<ApiResponse<AccountRecord>> {
    const response = await axiosClient.patch(`/users/${id}/restore`);
    return { ...response.data, data: mapUser(response.data.data) };
  },

  async permanentDeleteUser(id: string): Promise<ApiResponse<void>> {
    const response = await axiosClient.delete(`/users/${id}/force`);
    return response.data;
  },
};
