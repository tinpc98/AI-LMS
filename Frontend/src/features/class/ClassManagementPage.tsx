import { Card, message, Typography, Tabs } from "antd";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "../../shared/api/queryKeys";
import { useAdminListQuery } from "../../shared/hooks/useAdminListQuery";
import type { ClassFormModalHandle } from "./ClassFormModal";
import ClassDetailDrawer from "./ClassDetailDrawer";
import ClassFormModal from "./ClassFormModal";
import ClassTable from "./ClassTable";
import ClassToolbar from "./ClassToolbar";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { classService } from "./classService";
import type { ClassFilters, ClassFormValues, ClassRecord, ClassStatus } from "./class.types";

const initialFilters: ClassFilters = {
  search: "",
  courseId: "",
  learningMode: "All",
  status: "All",
  page: 1,
  limit: 10,
};

const ClassManagementPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [filters, setFilters] = useState<ClassFilters>(initialFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"soft" | "force">("soft");
  const [selectedClass, setSelectedClass] = useState<ClassRecord | undefined>();
  const [mode, setMode] = useState<"create" | "edit">("create");
  const formRef = useRef<ClassFormModalHandle | null>(null);

  // Debounce search filter
  const [debouncedFilters, setDebouncedFilters] = useState<ClassFilters>(initialFilters);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters]);

  // Xem ghi chú ở AccountManagementPage. Trang này khác hai trang kia ở chữ ký service:
  // getClasses nhận thêm cờ thùng rác làm tham số thứ hai, nên bọc lại cho khớp hook.
  const {
    records: classes,
    pagination,
    loading,
    refetch: refetchClasses,
  } = useAdminListQuery<ClassRecord, ClassFilters>({
    resource: "classes",
    filters: debouncedFilters,
    isTrash: activeTab === "trash",
    fetchActive: (f) => classService.getClasses(f, false),
    fetchTrash: (f) => classService.getClasses(f, true),
    errorMessage: "Failed to load classes",
  });

  // TÁCH RIÊNG danh sách khoá học và giáo viên.
  //
  // Bản cũ gộp cả ba lời gọi vào một Promise.all, nên MỖI lần đổi bộ lọc — kể cả gõ tìm kiếm
  // — lại tải lại toàn bộ danh sách khoá học và giáo viên. Đây là dữ liệu tham chiếu, không
  // phụ thuộc bộ lọc. Query riêng, không có filters trong khoá, nên chỉ tải một lần.
  const { data: courseOptions = [] } = useQuery({
    queryKey: queryKeys.class.courseOptions,
    queryFn: classService.getCourseOptions,
  });
  const { data: teacherOptions = [] } = useQuery({
    queryKey: queryKeys.class.teacherOptions,
    queryFn: classService.getTeacherOptions,
  });

  // Các nơi gọi sau thao tác thêm/sửa/xoá chỉ cần nạp lại danh sách lớp; khoá học và giáo
  // viên không đổi vì những thao tác đó.
  const loadClasses = refetchClasses;

  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setFilters(initialFilters);
  };

  const openCreateModal = () => {
    setMode("create");
    setSelectedClass(undefined);
    setModalOpen(true);
  };

  const openEditModal = (classRecord: ClassRecord) => {
    setMode("edit");
    setSelectedClass(classRecord);
    setModalOpen(true);
  };

  const handleSubmit = async (values: ClassFormValues) => {
    try {
      if (mode === "create") {
        await classService.createClass(values);
        message.success("Class created successfully");
      } else if (selectedClass) {
        await classService.updateClass(selectedClass.id, values);
        message.success("Class updated successfully");
      }
      setModalOpen(false);
      await loadClasses();
    } catch {
      message.error("Unable to complete the request");
    }
  };

  const handleView = (classRecord: ClassRecord) => {
    setSelectedClass(classRecord);
    setDetailOpen(true);
  };

  const getNextStatus = (status: ClassStatus): ClassStatus | null => {
    switch (status) {
      case "Draft":
        return "Ready";

      case "Ready":
        return "Ongoing";

      case "Ongoing":
        return "Completed";

      case "Completed":
        return "Archived";

      default:
        return null;
    }
  };

  const handleChangeStatus = async (classRecord: ClassRecord) => {
    try {
      const nextStatus = getNextStatus(classRecord.status);
      if (!nextStatus) {
        message.warning("This status cannot be changed");
        return;
      }
      await classService.updateStatus(classRecord.id, nextStatus);
      message.success(`Status changed to ${nextStatus}`);
      await loadClasses();
    } catch {
      message.error("Unable to update class status");
    }
  };

  const handleDeleteRequest = (classRecord: ClassRecord) => {
    setSelectedClass(classRecord);
    setDeleteMode("soft");
    setDeleteOpen(true);
  };

  const handleForceDeleteRequest = (classRecord: ClassRecord) => {
    setSelectedClass(classRecord);
    setDeleteMode("force");
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedClass) return;

    try {
      if (deleteMode === "soft") {
        await classService.deleteClass(selectedClass.id);
        message.success("Class moved to trash");
      } else {
        await classService.permanentDeleteClass(selectedClass.id);
        message.success("Class permanently deleted");
      }
      setDeleteOpen(false);
      await loadClasses();
    } catch {
      message.error("Unable to complete the request");
    }
  };

  const handleRestore = async (classRecord: ClassRecord) => {
    try {
      await classService.restoreClass(classRecord.id);
      message.success("Class restored successfully");
      await loadClasses();
    } catch {
      message.error("Failed to restore class");
    }
  };

  const handleTableChange = (newPagination: any, _filters: any, sorter: any) => {
    setFilters((prev) => ({
      ...prev,
      page: newPagination.current,
      limit: newPagination.pageSize,
      sortField: sorter.field,
      sortOrder: sorter.order,
    }));
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Class Management
        </Typography.Title>
        <Typography.Paragraph style={{ margin: 0, color: "#64748b" }}>
          Manage classes, schedules, enrollment, and teacher assignment for the center.
        </Typography.Paragraph>
      </div>

      <Card bordered={false}>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <Tabs.TabPane tab="Active Classes" key="active" />
          <Tabs.TabPane tab="Trash" key="trash" />
        </Tabs>

        <ClassToolbar
          filters={filters}
          onFiltersChange={(newFilters) => setFilters({ ...newFilters, page: 1 })}
          onRefresh={() => void loadClasses()}
          onCreate={activeTab !== "trash" ? openCreateModal : undefined}
          courseOptions={courseOptions}
          learningModeOptions={[
            { label: "All Modes", value: "All" },
            { label: "Offline", value: "Offline" },
            { label: "Online", value: "Online" },
            { label: "Hybrid", value: "Hybrid" },
          ]}
        />

        <div style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">
            Showing {pagination?.total || 0} class(es)
          </Typography.Text>
        </div>

        <div style={{ marginTop: 16 }}>
          <ClassTable
            data={classes}
            loading={loading}
            activeTab={activeTab}
            pagination={pagination}
            onChange={handleTableChange}
            courseOptions={courseOptions}
            teacherOptions={teacherOptions}
            onView={handleView}
            onEdit={openEditModal}
            onChangeStatus={handleChangeStatus}
            onDelete={handleDeleteRequest}
            onRestore={handleRestore}
            onForceDelete={handleForceDeleteRequest}
          />
        </div>
      </Card>

      <ClassFormModal
        ref={formRef}
        open={modalOpen}
        mode={mode}
        initialValues={selectedClass}
        onSubmit={handleSubmit}
        onCancel={() => setModalOpen(false)}
        courseOptions={courseOptions}
        teacherOptions={teacherOptions}
      />

      <ClassDetailDrawer
        open={detailOpen}
        classRecord={selectedClass}
        onClose={() => setDetailOpen(false)}
        courseOptions={courseOptions}
        teacherOptions={teacherOptions}
      />

      <DeleteConfirmModal
        open={deleteOpen}
        className={selectedClass?.className}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
};

export default ClassManagementPage;
