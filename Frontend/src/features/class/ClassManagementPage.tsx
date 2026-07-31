import { Card, message, Typography, Tabs } from "antd";
import { useEffect, useRef, useState } from "react";
import type { ClassFormModalHandle } from "./ClassFormModal";
import ClassDetailDrawer from "./ClassDetailDrawer";
import ClassFormModal from "./ClassFormModal";
import ClassTable from "./ClassTable";
import ClassToolbar from "./ClassToolbar";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { classService } from "./classService";
import type {
  ClassFilters,
  ClassFormValues,
  ClassRecord,
  ClassStatus,
  Pagination,
} from "./class.types";

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
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [pagination, setPagination] = useState<Pagination | undefined>();
  const [filters, setFilters] = useState<ClassFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteMode, setDeleteMode] = useState<"soft" | "force">("soft");
  const [selectedClass, setSelectedClass] = useState<ClassRecord | undefined>();
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [courseOptions, setCourseOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [teacherOptions, setTeacherOptions] = useState<Array<{ id: string; label: string }>>([]);
  const formRef = useRef<ClassFormModalHandle | null>(null);

  // Debounce search filter
  const [debouncedFilters, setDebouncedFilters] = useState<ClassFilters>(initialFilters);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedFilters(filters);
    }, 500);
    return () => clearTimeout(handler);
  }, [filters]);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const isTrash = activeTab === "trash";
      const [classResponse, courseResponse, teacherResponse] = await Promise.all([
        classService.getClasses(debouncedFilters, isTrash),
        classService.getCourseOptions(),
        classService.getTeacherOptions(),
      ]);
      setClasses(classResponse.data);
      setPagination(classResponse.pagination);
      setCourseOptions(courseResponse);
      setTeacherOptions(teacherResponse);
    } catch {
      message.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClasses();
  }, [debouncedFilters, activeTab]);

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
