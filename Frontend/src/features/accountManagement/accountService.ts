import type { AccountFilters, AccountFormValues, AccountRecord } from "./account.types";
import { mockAccounts } from "./mockAccounts";

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const normalizeText = (value: string) => value.trim().toLowerCase();

export const accountService = {
  async getAccounts(filters: AccountFilters): Promise<AccountRecord[]> {
    await delay(500);

    return mockAccounts.filter((account) => {
      const matchesSearch =
        !filters.search ||
        [account.fullName, account.email, account.phone].some((value) =>
          normalizeText(value).includes(normalizeText(filters.search)),
        );

      const matchesRole = filters.role === "All" || account.role === filters.role;
      const matchesStatus = filters.status === "All" || account.status === filters.status;

      return matchesSearch && matchesRole && matchesStatus;
    });
  },

  async getAccountById(id: string): Promise<AccountRecord | undefined> {
    await delay(300);
    return mockAccounts.find((account) => account.id === id);
  },

  async createAccount(payload: AccountFormValues): Promise<AccountRecord> {
    await delay(400);
    const newAccount: AccountRecord = {
      id: `${Date.now()}`,
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      role: payload.role,
      status: payload.status,
      avatar: payload.avatar || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    mockAccounts.unshift(newAccount);
    return newAccount;
  },

  async updateAccount(id: string, payload: AccountFormValues): Promise<AccountRecord> {
    await delay(400);
    const index = mockAccounts.findIndex((account) => account.id === id);
    if (index === -1) {
      throw new Error("Account not found");
    }

    const updatedAccount: AccountRecord = {
      ...mockAccounts[index],
      fullName: payload.fullName.trim(),
      email: payload.email.trim().toLowerCase(),
      phone: payload.phone.trim(),
      role: payload.role,
      status: payload.status,
      avatar: payload.avatar || "",
      updatedAt: new Date().toISOString(),
    };

    mockAccounts[index] = updatedAccount;
    return updatedAccount;
  },

  async updateStatus(id: string, status: "Active" | "Locked"): Promise<AccountRecord> {
    await delay(300);
    const index = mockAccounts.findIndex((account) => account.id === id);
    if (index === -1) {
      throw new Error("Account not found");
    }

    const updatedAccount = {
      ...mockAccounts[index],
      status,
      updatedAt: new Date().toISOString(),
    };

    mockAccounts[index] = updatedAccount;
    return updatedAccount;
  },

  async resetPassword(id: string): Promise<void> {
    await delay(300);
    const index = mockAccounts.findIndex((account) => account.id === id);
    if (index === -1) {
      throw new Error("Account not found");
    }

    mockAccounts[index] = {
      ...mockAccounts[index],
      updatedAt: new Date().toISOString(),
    };
  },

  async deleteAccount(id: string): Promise<void> {
    await delay(300);
    const index = mockAccounts.findIndex((account) => account.id === id);
    if (index === -1) {
      throw new Error("Account not found");
    }

    mockAccounts.splice(index, 1);
  },
};
