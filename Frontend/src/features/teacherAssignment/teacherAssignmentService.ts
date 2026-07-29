import type { AccountRecord, ClassRecord, CourseRecord, TeacherAssignmentFilters } from "./teacherAssignment.types";
import { mockClasses } from "../classManagement/mockClasses";
import { mockUsers } from "../accountManagement/account.mock";
import { mockCourses } from "../courseManagement/mockCourses";

// In-memory state for runtime mutation simulation
let activeClasses: ClassRecord[] = [...mockClasses];

export const teacherAssignmentService = {
  getClasses: async (filters?: TeacherAssignmentFilters): Promise<ClassRecord[]> => {
    let result = [...activeClasses];

    if (!filters) return result;

    if (filters.search) {
      const query = filters.search.toLowerCase().trim();
      result = result.filter(
        (item) =>
          item.className.toLowerCase().includes(query) ||
          item.classCode.toLowerCase().includes(query)
      );
    }

    if (filters.courseId) {
      result = result.filter((item) => item.courseId === filters.courseId);
    }

    if (filters.teacherId) {
      result = result.filter((item) => item.teacherId === filters.teacherId);
    }

    if (filters.status === "Assigned") {
      result = result.filter((item) => !!item.teacherId);
    } else if (filters.status === "Unassigned") {
      result = result.filter((item) => !item.teacherId);
    }

    return Promise.resolve(result);
  },

  getAllClasses: async (): Promise<ClassRecord[]> => {
    return Promise.resolve([...activeClasses]);
  },

  getTeachers: async (): Promise<AccountRecord[]> => {
    const teachers = mockUsers.filter((user) => user.role === "Teacher");
    return Promise.resolve(teachers);
  },

  getCourses: async (): Promise<CourseRecord[]> => {
    return Promise.resolve(mockCourses);
  },

  assignTeacher: async (classId: string, teacherId: string): Promise<ClassRecord> => {
    const classIndex = activeClasses.findIndex((c) => c.id === classId);
    if (classIndex === -1) {
      throw new Error("Class not found");
    }

    const updatedClass: ClassRecord = {
      ...activeClasses[classIndex],
      teacherId,
      updatedAt: new Date().toISOString(),
    };

    activeClasses[classIndex] = updatedClass;
    return Promise.resolve(updatedClass);
  },

  changeTeacher: async (classId: string, newTeacherId: string): Promise<ClassRecord> => {
    return teacherAssignmentService.assignTeacher(classId, newTeacherId);
  },

  removeTeacher: async (classId: string): Promise<ClassRecord> => {
    const classIndex = activeClasses.findIndex((c) => c.id === classId);
    if (classIndex === -1) {
      throw new Error("Class not found");
    }

    const updatedClass: ClassRecord = {
      ...activeClasses[classIndex],
      teacherId: null,
      updatedAt: new Date().toISOString(),
    };

    activeClasses[classIndex] = updatedClass;
    return Promise.resolve(updatedClass);
  },

  resetMockData: (): void => {
    activeClasses = [...mockClasses];
  },
};
