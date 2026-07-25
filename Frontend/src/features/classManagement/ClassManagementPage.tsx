import { Card, message, Typography } from "antd";
import { useEffect, useMemo, useRef, useState } from "react";
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
};

const ClassManagementPage = () => {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [filters, setFilters] = useState<ClassFilters>(initialFilters);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassRecord | undefined>();
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [courseOptions, setCourseOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [teacherOptions, setTeacherOptions] = useState<Array<{ id: string; label: string }>>([]);
  const formRef = useRef<ClassFormModalHandle | null>(null);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const [classResponse, courseResponse, teacherResponse] = await Promise.all([
        classService.getClasses(filters),
        classService.getCourseOptions(),
        classService.getTeacherOptions(),
      ]);
      setClasses(classResponse);
      setCourseOptions(courseResponse);
      setTeacherOptions(teacherResponse);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClasses();
  }, [filters]);

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

  const handleChangeStatus = async (classRecord: ClassRecord) => {
    try {
      const nextStatus: ClassStatus = classRecord.status === "Active" ? "Completed" : classRecord.status === "Completed" ? "Cancelled" : "Active";
      await classService.updateStatus(classRecord.id, nextStatus);
      message.success(`Status changed to ${nextStatus}`);
      await loadClasses();
    } catch {
      message.error("Unable to update class status");
    }
  };

  const handleDeleteRequest = (classRecord: ClassRecord) => {
    setSelectedClass(classRecord);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedClass) return;

    try {
      await classService.deleteClass(selectedClass.id);
      message.success("Class deleted successfully");
      setDeleteOpen(false);
      await loadClasses();
    } catch {
      message.error("Unable to delete the class");
    }
  };

  const filteredCount = useMemo(() => classes.length, [classes]);

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
        <ClassToolbar
          filters={filters}
          onFiltersChange={setFilters}
          onRefresh={() => void loadClasses()}
          onCreate={openCreateModal}
          courseOptions={courseOptions}
          learningModeOptions={[
            { label: "All Modes", value: "All" },
            { label: "Offline", value: "Offline" },
            { label: "Online", value: "Online" },
            { label: "Hybrid", value: "Hybrid" },
          ]}
        />

        <div style={{ marginTop: 16 }}>
          <Typography.Text type="secondary">Showing {filteredCount} class(es)</Typography.Text>
        </div>

        <div style={{ marginTop: 16 }}>
          <ClassTable
            data={classes}
            loading={loading}
            courseOptions={courseOptions}
            teacherOptions={teacherOptions}
            onView={handleView}
            onEdit={openEditModal}
            onChangeStatus={handleChangeStatus}
            onDelete={handleDeleteRequest}
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

      <DeleteConfirmModal open={deleteOpen} className={selectedClass?.className} onConfirm={confirmDelete} onCancel={() => setDeleteOpen(false)} />
    </div>
  );
};

export default ClassManagementPage;
