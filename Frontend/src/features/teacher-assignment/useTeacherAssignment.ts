import { useState, useMemo } from "react";
import { message } from "antd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  ClassRecord,
  TeacherAssignmentFilters,
  TeacherAssignmentStats,
} from "./teacherAssignment.types";
import { teacherAssignmentService } from "./teacherAssignmentService";
import { calculateTeachingLoad } from "./teacherAssignmentUtils";
import { queryKeys } from "../../shared/api/queryKeys";

const initialFilters: TeacherAssignmentFilters = {
  search: "",
  courseId: "",
  teacherId: "",
  status: "All",
};

export const useTeacherAssignment = () => {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TeacherAssignmentFilters>(initialFilters);

  // Modal / Drawer state
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [changeModalOpen, setChangeModalOpen] = useState(false);
  const [removeModalOpen, setRemoveModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassRecord | undefined>();

  // Fetch data
  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: queryKeys.teacherAssignment.classes(filters),
    queryFn: () => teacherAssignmentService.getClasses(filters),
  });

  const { data: allClasses = [], isLoading: allClassesLoading } = useQuery({
    queryKey: queryKeys.teacherAssignment.allClasses,
    queryFn: () => teacherAssignmentService.getAllClasses(),
  });

  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: queryKeys.teacherAssignment.teachers,
    queryFn: () => teacherAssignmentService.getTeachers(),
  });

  const { data: courses = [], isLoading: coursesLoading } = useQuery({
    queryKey: queryKeys.teacherAssignment.courses,
    queryFn: () => teacherAssignmentService.getCourses(),
  });

  const loading = classesLoading || allClassesLoading || teachersLoading || coursesLoading;

  // Mutations
  const assignMutation = useMutation({
    mutationFn: ({ classId, teacherId }: { classId: string; teacherId: string }) =>
      teacherAssignmentService.assignTeacher(classId, teacherId),
    onSuccess: () => {
      message.success("Teacher assigned successfully!");
      setAssignModalOpen(false);
      setChangeModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.teacherAssignment.all });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to assign teacher.");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (classId: string) => teacherAssignmentService.removeTeacher(classId),
    onSuccess: () => {
      message.success("Teacher assignment removed successfully.");
      setRemoveModalOpen(false);
      void queryClient.invalidateQueries({ queryKey: queryKeys.teacherAssignment.all });
    },
    onError: (err: any) => {
      message.error(err?.response?.data?.message || "Failed to remove teacher assignment.");
    },
  });

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

  const handleAssign = (classId: string, teacherId: string) => {
    assignMutation.mutate({ classId, teacherId });
  };

  const handleChange = (classId: string, newTeacherId: string) => {
    assignMutation.mutate({ classId, teacherId: newTeacherId });
  };

  const handleRemove = () => {
    if (!selectedClass) return;
    removeMutation.mutate(selectedClass.id);
  };

  // Provide a stub loadData so components calling void loadData() don't break
  const loadData = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.teacherAssignment.all });
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
    actionLoading: assignMutation.isPending || removeMutation.isPending,
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
