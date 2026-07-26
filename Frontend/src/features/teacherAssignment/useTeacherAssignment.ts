import { useCallback, useEffect, useMemo, useState } from "react";
import { message } from "antd";
import type {
  AccountRecord,
  ClassRecord,
  CourseRecord,
  TeacherAssignmentFilters,
  TeacherAssignmentStats,
} from "./teacherAssignment.types";
import { teacherAssignmentService } from "./teacherAssignmentService";
import { calculateTeachingLoad } from "./teacherAssignmentUtils";

const initialFilters: TeacherAssignmentFilters = {
  search: "",
  courseId: "",
  teacherId: "",
  status: "All",
};

export const useTeacherAssignment = () => {
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [allClasses, setAllClasses] = useState<ClassRecord[]>([]);
  const [teachers, setTeachers] = useState<AccountRecord[]>([]);
  const [courses, setCourses] = useState<CourseRecord[]>([]);
  const [filters, setFilters] = useState<TeacherAssignmentFilters>(initialFilters);
  const [loading, setLoading] = useState(false);

  // Modal / Drawer state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassRecord | undefined>();
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [filteredClassesRes, allClassesRes, teachersRes, coursesRes] = await Promise.all([
        teacherAssignmentService.getClasses(filters),
        teacherAssignmentService.getAllClasses(),
        teacherAssignmentService.getTeachers(),
        teacherAssignmentService.getCourses(),
      ]);

      setClasses(filteredClassesRes);
      setAllClasses(allClassesRes);
      setTeachers(teachersRes);
      setCourses(coursesRes);
    } catch {
      message.error("Failed to load assignment data.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Dynamic Teaching Load calculation
  const teachingLoadMap = useMemo(() => {
    return calculateTeachingLoad(allClasses);
  }, [allClasses]);

  // Statistics calculation
  const stats: TeacherAssignmentStats = useMemo(() => {
    const totalClasses = allClasses.length;
    const assignedCount = allClasses.filter((c) => !!c.teacherId).length;
    const unassignedCount = totalClasses - assignedCount;

    // Unique assigned teachers
    const activeTeacherIds = new Set(allClasses.map((c) => c.teacherId).filter(Boolean));
    const activeTeachersCount = activeTeacherIds.size;

    return {
      totalClasses,
      assignedCount,
      unassignedCount,
      activeTeachersCount,
    };
  }, [allClasses]);

  // Handlers
  const openAssignModal = (classRecord: ClassRecord) => {
    setSelectedClass(classRecord);
    setAssignModalOpen(true);
  };

  const openChangeModal = (classRecord: ClassRecord) => {
    setSelectedClass(classRecord);
    setChangeModalOpen(true);
  };

  const openRemoveModal = (classRecord: ClassRecord) => {
    setSelectedClass(classRecord);
    setRemoveModalOpen(true);
  };

  const openDrawer = (classRecord: ClassRecord) => {
    setSelectedClass(classRecord);
    setDrawerOpen(true);
  };

  const handleAssign = async (classId: string, teacherId: string) => {
    try {
      await teacherAssignmentService.assignTeacher(classId, teacherId);
      message.success("Teacher assigned successfully!");
      setAssignModalOpen(false);
      await loadData();
    } catch {
      message.error("Failed to assign teacher.");
    }
  };

  const handleChange = async (classId: string, newTeacherId: string) => {
    try {
      await teacherAssignmentService.changeTeacher(classId, newTeacherId);
      message.success("Teacher updated successfully!");
      setChangeModalOpen(false);
      await loadData();
    } catch {
      message.error("Failed to update teacher assignment.");
    }
  };

  const handleRemove = async () => {
    if (!selectedClass) return;
    setActionLoading(true);
    try {
      await teacherAssignmentService.removeTeacher(selectedClass.id);
      message.success("Teacher assignment removed successfully.");
      setRemoveModalOpen(false);
      await loadData();
    } catch {
      message.error("Failed to remove teacher assignment.");
    } finally {
      setActionLoading(false);
    }
  };

  const selectedTeacher = useMemo(() => {
    if (!selectedClass?.teacherId) return null;
    return teachers.find((t) => t.id === selectedClass.teacherId) || null;
  }, [selectedClass, teachers]);

  return {
    classes,
    allClasses,
    teachers,
    courses,
    filters,
    setFilters,
    loading,
    stats,
    teachingLoadMap,
    // Modal states
    assignModalOpen,
    setAssignModalOpen,
    changeModalOpen,
    setChangeModalOpen,
    removeModalOpen,
    setRemoveModalOpen,
    drawerOpen,
    setDrawerOpen,
    selectedClass,
    selectedTeacher,
    actionLoading,
    // Handlers
    loadData,
    openAssignModal,
    openChangeModal,
    openRemoveModal,
    openDrawer,
    handleAssign,
    handleChange,
    handleRemove,
  };
};
