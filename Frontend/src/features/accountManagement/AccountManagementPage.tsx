import { Card, message, Typography } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
import type { AccountFormModalHandle } from "./AccountFormModal";
import AccountDetailDrawer from "./AccountDetailDrawer";
import AccountFormModal from "./AccountFormModal";
import AccountTable from "./AccountTable";
import AccountToolbar from "./AccountToolbar";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { accountService } from "./accountService";
import type { AccountFilters, AccountFormValues, AccountRecord, AccountRole, AccountStatus } from "./account.types";

const initialFilters: AccountFilters = {
  search: "",
  role: "All",
  status: "All",
};

const AccountManagementPage = () => {
  const [accounts, setAccounts] = useState<AccountRecord[]>([]);
  const [filters, setFilters] = useState<AccountFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<AccountRecord | undefined>();
  const [mode, setMode] = useState<"create" | "edit">("create");
  const formRef = useRef<AccountFormModalHandle | null>(null);

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const response = await accountService.getAccounts(filters);
      setAccounts(response);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, [filters]);

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
    if (!selectedAccount) {
      return;
    }

    try {
      await accountService.deleteAccount(selectedAccount.id);
      message.success("Account deleted successfully");
      setDeleteOpen(false);
      await loadAccounts();
    } catch {
      message.error("Unable to delete the account");
    }
  };

  const filteredCount = useMemo(() => accounts.length, [accounts]);

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
        <AccountToolbar
          filters={filters}
          onFiltersChange={setFilters}
          onRefresh={() => void loadAccounts()}
          onCreate={openCreateModal}
        />

        <div style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">Showing {filteredCount} account(s)</Typography.Text>
        </div>

        <div style={{ marginTop: 16 }}>
          <AccountTable
            data={accounts}
            loading={loading}
            onView={handleView}
            onEdit={openEditModal}
            onToggleLock={handleToggleLock}
            onResetPassword={handleResetPassword}
            onDelete={handleDeleteRequest}
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
    </div>
  );
};

export default AccountManagementPage;
