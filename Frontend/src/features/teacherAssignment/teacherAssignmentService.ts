import axiosClient from "../../api/axiosClient";
import type { AccountRecord, ClassRecord, CourseRecord, TeacherAssignmentFilters } from "./teacherAssignment.types";

const mapClass = (c: any): ClassRecord => {
  return {
    ...c,
    id: c._id,
    courseId: c.courseId?._id || c.courseId,
    teacherId: c.teacherId?._id || c.teacherId,
    teacher: c.teacherId?._id ? { id: c.teacherId._id, fullName: c.teacherId.fullName } : null,
    assignedBy: c.assignedBy?._id || c.assignedBy,
  };
};

export const teacherAssignmentService = {
  getClasses: async (filters?: TeacherAssignmentFilters): Promise<ClassRecord[]> => {
    const params: Record<string, any> = { ...filters };
    
    // Map custom status filter to backend isAssigned boolean
    if (params.status === "Assigned") {
      params.isAssigned = true;
    } else if (params.status === "Unassigned") {
      params.isAssigned = false;
    }
    delete params.status; // Remove custom status from backend request

    // Remove empty filters
    Object.keys(params).forEach((key) => {
      if (params[key] === "" || params[key] === "All") {
        delete params[key];
      }
    });

    const res = await axiosClient.get("/api/classes", { params });
    // Assuming backend returns { data: [...], pagination: {...} }
    return res.data.data.map(mapClass);
  },

  getAllClasses: async (): Promise<ClassRecord[]> => {
    const res = await axiosClient.get("/api/classes", { params: { limit: 1000 } });
    return res.data.data.map(mapClass);
  },

  getTeachers: async (): Promise<AccountRecord[]> => {
    const res = await axiosClient.get("/api/users", { params: { role: "Teacher", limit: 1000 } });
    return res.data.data.map((u: any) => ({ ...u, id: u._id }));
  },

  getCourses: async (): Promise<CourseRecord[]> => {
    const res = await axiosClient.get("/api/courses", { params: { limit: 1000 } });
    return res.data.data.map((c: any) => ({ ...c, id: c._id }));
  },

  assignTeacher: async (classId: string, teacherId: string): Promise<ClassRecord> => {
    const res = await axiosClient.patch(`/api/classes/${classId}/assign-teacher`, { teacherId });
    return mapClass(res.data.data);
  },

  changeTeacher: async (classId: string, newTeacherId: string): Promise<ClassRecord> => {
    return teacherAssignmentService.assignTeacher(classId, newTeacherId);
  },

  removeTeacher: async (classId: string): Promise<ClassRecord> => {
    const res = await axiosClient.patch(`/api/classes/${classId}/unassign-teacher`);
    return mapClass(res.data.data);
  },
};

