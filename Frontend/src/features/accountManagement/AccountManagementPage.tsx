import { Card, message, Typography, Tabs } from "antd";
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { AccountFormModalHandle } from "./AccountFormModal";
import AccountDetailDrawer from "./AccountDetailDrawer";
import AccountFormModal from "./AccountFormModal";
import AccountTable from "./AccountTable";
import AccountToolbar from "./AccountToolbar";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { accountService } from "./accountService";
import type { AccountFilters, AccountFormValues, AccountRecord, AccountRole, AccountStatus, Pagination } from "./account.types";

const initialFilters: AccountFilters = {
  search: "",
  role: "All",
  status: "All",
  page: 1,
  limit: 10,
};

const AccountManagementPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState<AccountFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [permanentDeleteOpen, setPermanentDeleteOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountRecord | undefined>();
  const [mode, setMode] = useState<"create" | "edit">("create");
  const formRef = useRef<AccountFormModalHandle | null>(null);
  
  const searchTimeoutRef = useRef<number | null>(null);

  const loadAccounts = useCallback(async (currentFilters = filters) => {
    setLoading(true);
    try {
      const fetchFn = activeTab === "trash" ? accountService.getTrashUsers : accountService.getAccounts;
      const response = await fetchFn(currentFilters);
      if (response.success) {
        setAccounts(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch {
      message.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const handleFilterChange = (newFilters: AccountFilters) => {
    // If search text changed, use debounce and reset page to 1
    if (newFilters.search !== filters.search) {
      if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = window.setTimeout(() => {
        setFilters({ ...newFilters, page: 1 });
      }, 500);
    } else {
      // If role or status changed, update immediately and reset page
      setFilters({ ...newFilters, page: 1 });
    }
  };

  const handleTableChange = (tablePagination: any, _: any, sorter: any) => {
    setFilters((prev) => ({
      ...prev,
      page: tablePagination.current,
      limit: tablePagination.pageSize,
      sort: sorter.field || "createdAt",
      order: sorter.order === "ascend" ? "asc" : "desc",
    }));
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setFilters({ ...initialFilters }); // Reset filters when switching tabs
  };

  const openCreateModal = () => {
    setMode("create");
    setSelectedAccount(undefined);
    setModalOpen(true);
  };

  const openEditModal = (account: AccountRecord) => {
    setMode("edit");
    setSelectedAccount(account);
    setModalOpen(true);
  };

  const handleSubmit = async (values: AccountFormValues) => {
    try {
      if (mode === "create") {
        await accountService.createAccount(values);
        message.success("Account created successfully");
      } else if (selectedAccount) {
        await accountService.updateAccount(selectedAccount.id, values);
        message.success("Account updated successfully");
      }
      setModalOpen(false);
      await loadAccounts();
    } catch {
      message.error("Unable to complete the request");
    }
  };

  const handleView = (account: AccountRecord) => {
    setSelectedAccount(account);
    setDetailOpen(true);
  };

  const handleToggleLock = async (account: AccountRecord) => {
    try {
      const nextStatus: AccountStatus = account.status === "Locked" ? "Active" : "Locked";
      await accountService.updateStatus(account.id, nextStatus);
      message.success(`Account ${nextStatus === "Locked" ? "locked" : "unlocked"}`);
      await loadAccounts();
    } catch {
      message.error("Unable to update account status");
    }
  };

  const handleResetPassword = async (account: AccountRecord) => {
    try {
      await accountService.resetPassword(account.id);
      message.success("Password reset requested");
      await loadAccounts();
    } catch {
      message.error("Unable to reset password");
    }
  };

  const handleDeleteRequest = (account: AccountRecord) => {
    setSelectedAccount(account);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedAccount) return;
    try {
      await accountService.deleteAccount(selectedAccount.id);
      message.success("Account deleted successfully");
      setDeleteOpen(false);
      await loadAccounts();
    } catch {
      message.error("Unable to delete the account");
    }
  };

  const handleRestore = async (account: AccountRecord) => {
    try {
      await accountService.restoreUser(account.id);
      message.success("Account restored successfully");
      await loadAccounts();
    } catch {
      message.error("Unable to restore account");
    }
  };

  const handlePermanentDeleteRequest = (account: AccountRecord) => {
    setSelectedAccount(account);
    setPermanentDeleteOpen(true);
  };

  const confirmPermanentDelete = async () => {
    if (!selectedAccount) return;
    try {
      await accountService.permanentDeleteUser(selectedAccount.id);
      message.success("Account permanently deleted");
      setPermanentDeleteOpen(false);
      await loadAccounts();
    } catch {
      message.error("Unable to permanently delete account");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Account Management
        </Typography.Title>
        <Typography.Paragraph style={{ margin: 0, color: "#64748b" }}>
          Manage system accounts, roles, and access status for the LMS center.
        </Typography.Paragraph>
      </div>

      <Card bordered={false}>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <Tabs.TabPane tab="Active Accounts" key="active" />
          <Tabs.TabPane tab="Trash" key="trash" />
        </Tabs>

        <AccountToolbar
          filters={filters}
          onFiltersChange={handleFilterChange}
          onRefresh={() => void loadAccounts()}
          onCreate={activeTab === "active" ? openCreateModal : undefined}
        />

        <div style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">Showing total {pagination.total} account(s)</Typography.Text>
        </div>

        <div style={{ marginTop: 16 }}>
          <AccountTable
            data={accounts}
            loading={loading}
            isTrash={activeTab === "trash"}
            pagination={{
              current: pagination.page,
              pageSize: pagination.limit,
              total: pagination.total,
            }}
            onChange={handleTableChange}
            onView={handleView}
            onEdit={openEditModal}
            onToggleLock={handleToggleLock}
            onResetPassword={handleResetPassword}
            onDelete={handleDeleteRequest}
            onRestore={handleRestore}
            onPermanentDelete={handlePermanentDeleteRequest}
          />
        </div>
      </Card>

      <AccountFormModal
        ref={formRef}
        open={modalOpen}
        mode={mode}
        initialValues={selectedAccount}
        onSubmit={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />

      <AccountDetailDrawer open={detailOpen} account={selectedAccount} onClose={() => setDetailOpen(false)} />

      <DeleteConfirmModal
        open={deleteOpen}
        accountName={selectedAccount?.fullName}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <DeleteConfirmModal
        open={permanentDeleteOpen}
        accountName={selectedAccount?.fullName + " (PERMANENTLY)"}
        onConfirm={confirmPermanentDelete}
        onCancel={() => setPermanentDeleteOpen(false)}
      />
    </div>
  );
};

export default AccountManagementPage;
