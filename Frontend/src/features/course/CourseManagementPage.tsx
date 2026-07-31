import { Card, message, Typography, Tabs } from "antd";
import { useRef, useState } from "react";
import { useAdminListQuery } from "../../shared/hooks/useAdminListQuery";
import type { CourseFormModalHandle } from "./CourseFormModal";
import CourseDetailDrawer from "./CourseDetailDrawer";
import CourseFormModal from "./CourseFormModal";
import CourseTable from "./CourseTable";
import CourseToolbar from "./CourseToolbar";
import DeleteConfirmModal from "./DeleteConfirmModal";
import { courseService } from "./courseService";
import type { CourseFilters, CourseFormValues, CourseRecord, CourseStatus } from "./course.types";

const initialFilters: CourseFilters = {
  search: "",
  subject: "All",
  status: "All",
  page: 1,
  limit: 10,
};

const CourseManagementPage = () => {
  const [activeTab, setActiveTab] = useState("active");
  const [filters, setFilters] = useState<CourseFilters>(initialFilters);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [permanentDeleteOpen, setPermanentDeleteOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<CourseRecord | undefined>();
  const [mode, setMode] = useState<"create" | "edit">("create");
  const formRef = useRef<CourseFormModalHandle | null>(null);

  const searchTimeoutRef = useRef<number | null>(null);

  // Xem ghi chú ở AccountManagementPage — cùng một hook, cùng lý do.
  const {
    records: courses,
    pagination,
    loading,
    refetch: loadCourses,
  } = useAdminListQuery<CourseRecord, CourseFilters>({
    resource: "courses",
    filters,
    isTrash: activeTab === "trash",
    fetchActive: courseService.getCourses,
    fetchTrash: courseService.getTrashCourses,
    errorMessage: "Failed to load courses",
  });

  const handleFilterChange = (newFilters: CourseFilters) => {
    if (newFilters.search !== filters.search) {
      if (searchTimeoutRef.current) window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = window.setTimeout(() => {
        setFilters({ ...newFilters, page: 1 });
      }, 500);
    } else {
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
    setFilters({ ...initialFilters });
  };

  const openCreateModal = () => {
    setMode("create");
    setSelectedCourse(undefined);
    setModalOpen(true);
  };

  const openEditModal = (course: CourseRecord) => {
    setMode("edit");
    setSelectedCourse(course);
    setModalOpen(true);
  };

  const handleSubmit = async (values: CourseFormValues) => {
    try {
      if (mode === "create") {
        await courseService.createCourse(values);
        message.success("Course created successfully");
      } else if (selectedCourse) {
        await courseService.updateCourse(selectedCourse.id, values);
        message.success("Course updated successfully");
      }
      setModalOpen(false);
      await loadCourses();
    } catch {
      message.error("Unable to complete the request");
    }
  };

  const handleView = (course: CourseRecord) => {
    setSelectedCourse(course);
    setDetailOpen(true);
  };

  const handleChangeStatus = async (course: CourseRecord) => {
    try {
      const nextStatus: CourseStatus =
        course.status === "Published"
          ? "Closed"
          : course.status === "Closed"
            ? "Draft"
            : "Published";
      await courseService.updateStatus(course.id, nextStatus);
      message.success(`Status changed to ${nextStatus}`);
      await loadCourses();
    } catch {
      message.error("Unable to update course status");
    }
  };

  const handleDeleteRequest = (course: CourseRecord) => {
    setSelectedCourse(course);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedCourse) return;

    try {
      await courseService.deleteCourse(selectedCourse.id);
      message.success("Course deleted successfully");
      setDeleteOpen(false);
      await loadCourses();
    } catch {
      message.error("Unable to delete the course");
    }
  };

  const handleRestore = async (course: CourseRecord) => {
    try {
      await courseService.restoreCourse(course.id);
      message.success("Course restored successfully");
      await loadCourses();
    } catch {
      message.error("Unable to restore course");
    }
  };

  const handlePermanentDeleteRequest = (course: CourseRecord) => {
    setSelectedCourse(course);
    setPermanentDeleteOpen(true);
  };

  const confirmPermanentDelete = async () => {
    if (!selectedCourse) return;
    try {
      await courseService.permanentDeleteCourse(selectedCourse.id);
      message.success("Course permanently deleted");
      setPermanentDeleteOpen(false);
      await loadCourses();
    } catch {
      message.error("Unable to permanently delete course");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Typography.Title level={3} style={{ marginBottom: 4 }}>
          Course Management
        </Typography.Title>
        <Typography.Paragraph style={{ margin: 0, color: "#64748b" }}>
          Manage training programs, subjects, and course lifecycle for the center.
        </Typography.Paragraph>
      </div>

      <Card bordered={false}>
        <Tabs activeKey={activeTab} onChange={handleTabChange}>
          <Tabs.TabPane tab="Active Courses" key="active" />
          <Tabs.TabPane tab="Trash" key="trash" />
        </Tabs>

        <CourseToolbar
          filters={filters}
          onFiltersChange={handleFilterChange}
          onRefresh={() => void loadCourses()}
          onCreate={activeTab === "active" ? openCreateModal : undefined}
        />

        <div style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">
            Showing total {pagination.total} course(s)
          </Typography.Text>
        </div>

        <div style={{ marginTop: 16 }}>
          <CourseTable
            data={courses}
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
            onChangeStatus={handleChangeStatus}
            onDelete={handleDeleteRequest}
            onRestore={handleRestore}
            onPermanentDelete={handlePermanentDeleteRequest}
          />
        </div>
      </Card>

      <CourseFormModal
        ref={formRef}
        open={modalOpen}
        mode={mode}
        initialValues={selectedCourse}
        onSubmit={handleSubmit}
        onCancel={() => setModalOpen(false)}
      />

      <CourseDetailDrawer
        open={detailOpen}
        course={selectedCourse}
        onClose={() => setDetailOpen(false)}
      />

      <DeleteConfirmModal
        open={deleteOpen}
        courseName={selectedCourse?.courseName}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <DeleteConfirmModal
        open={permanentDeleteOpen}
        courseName={selectedCourse?.courseName + " (PERMANENTLY)"}
        onConfirm={confirmPermanentDelete}
        onCancel={() => setPermanentDeleteOpen(false)}
      />
    </div>
  );
};

export default CourseManagementPage;
